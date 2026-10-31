<?php
namespace ALFB_Flipbook;
if ( !defined('ABSPATH') ) { exit;}

// A small Freemius opt-in for the free plugin, in place of the full SDK.
// It talks only to Freemius (wp.freemius.com and api.freemius.com), and only after the site admin agrees.
class fs_lite {

    const OPTION   = 'alfb_fs_lite';
    const OPT_IN   = 'https://wp.freemius.com/action/service/user/install/';
    const API      = 'https://api.freemius.com';
    const SDK      = '2.13.4';
    const NONCE    = 'alfb_fs_lite';

    // the Freemius reason ids, see the deactivation form
    const REASON_OTHER     = 7;
    const REASON_TEMPORARY = 15;

    private static $instance;

    private $file;
    private $id;
    private $slug;
    private $public_key;

    public function __construct( $file, array $config )
    {
        self::$instance   = $this;
        $this->file       = $file;
        $this->id         = (string) $config['id'];
        $this->slug       = $config['slug'];
        $this->public_key = $config['public_key'];

        register_activation_hook( $file, array( $this, 'activated' ) );
        register_deactivation_hook( $file, array( $this, 'deactivated' ) );

        if ( is_admin() ) {
            add_action('admin_init', array( $this, 'admin_init' ));
            add_action('admin_post_alfb_fs_opt_in', array( $this, 'opt_in_action' ));
            add_action('admin_post_alfb_fs_skip', array( $this, 'skip_action' ));
            add_action('wp_ajax_alfb_fs_tracking', array( $this, 'tracking_ajax' ));
            add_action('wp_ajax_alfb_fs_reason', array( $this, 'reason_ajax' ));
            add_action('admin_enqueue_scripts', array( $this, 'plugins_page_assets' ));
            add_action('admin_footer-plugins.php', array( $this, 'deactivate_form' ));
            add_filter('plugin_action_links_' . plugin_basename( $file ), array( $this, 'action_links' ));
            add_action('alfb_dashboard_before', array( $this, 'opt_in_card' ));
            add_action('admin_notices', array( $this, 'notices' ));
        }
    }

    public static function instance() {
        return self::$instance;
    }

    // the free plugin has no paid code
    public function is_premium() {
        return false;
    }

    public function can_use_premium_code() {
        return false;
    }

    /* ----- stored state ----- */

    // state: '' not asked yet, 'skipped', 'pending' (waiting for the email link), 'connected'; 'tracking' is false after an opt-out
    private function data() {
        $data = get_option( self::OPTION, null );
        if ( ! is_array( $data ) ) {
            $data = $this->from_full_sdk();
            update_option( self::OPTION, $data, false );
        }
        return array_merge( array(
            'state'    => '',
            'tracking' => true,
            'install'  => array(),
            'email'    => '',
            'version'  => '',
            'reason'   => null,
            'redirect' => false,
        ), $data );
    }

    private function save( array $changes ) {
        $data = array_merge( $this->data(), $changes );
        update_option( self::OPTION, $data, false );
        return $data;
    }

    // a site that opted in or skipped with the full Freemius SDK (1.4.2) keeps that choice
    private function from_full_sdk() {
        $data     = array( 'state' => '' );
        $accounts = get_option( 'fs_accounts', array() );
        if ( ! is_array( $accounts ) ) {
            return $data;
        }
        $site = isset( $accounts['sites'][ $this->slug ] ) ? (array) $accounts['sites'][ $this->slug ] : array();
        if ( ! empty( $site['id'] ) && ! empty( $site['public_key'] ) && ! empty( $site['secret_key'] ) ) {
            $data['state']   = 'connected';
            $data['install'] = array( 'id' => (string) $site['id'], 'public_key' => (string) $site['public_key'], 'secret_key' => (string) $site['secret_key'] );
        } elseif ( ! empty( $accounts['plugin_data'][ $this->slug ]['is_anonymous']['is'] ) ) {
            $data['state'] = 'skipped';
        }
        if ( ! empty( $accounts['unique_id'] ) && is_string( $accounts['unique_id'] ) ) {
            $data['uid'] = $accounts['unique_id'];
        }
        // the full SDK's sync jobs for this plugin
        wp_clear_scheduled_hook( 'fs_data_sync_' . $this->slug );
        wp_clear_scheduled_hook( 'fs_install_sync_' . $this->slug );
        return $data;
    }

    public function is_connected() {
        $data = $this->data();
        return 'connected' === $data['state'] && $data['tracking'];
    }

    // the same anonymous site id the full SDK makes, so a site is never counted twice
    private function uid() {
        $data = $this->data();
        if ( ! empty( $data['uid'] ) ) {
            return $data['uid'];
        }
        $auth = defined( 'SECURE_AUTH_KEY' ) ? SECURE_AUTH_KEY : '';
        if ( '' === $auth || false !== strpos( $auth, ' ' ) || 'put your unique phrase here' === $auth ) {
            $auth = md5( microtime() );
        }
        $uid = md5( preg_replace( '#^https?://#', '', $this->site_url() ) . $auth );
        $this->save( array( 'uid' => $uid ) );
        return $uid;
    }

    private function site_url() {
        return get_option( 'siteurl' );
    }

    private function version() {
        return defined( 'ALFB_PLUGIN_VERSION' ) ? ALFB_PLUGIN_VERSION : '';
    }

    /* ----- Freemius requests ----- */

    // what Freemius gets about the site; nothing about other plugins or themes
    private function site_data() {
        return array(
            'sdk_version'                  => self::SDK,
            'platform_version'             => get_bloginfo( 'version' ),
            'programming_language_version' => phpversion(),
            'url'                          => $this->site_url(),
            'title'                        => get_bloginfo( 'name' ),
            'language'                     => substr( get_bloginfo( 'language' ), 0, 8 ),
            'version'                      => $this->version(),
            'is_premium'                   => false,
        );
    }

    // a signed call to the Freemius API: an install's own keys, or the plugin's public key
    private function api( $path, $method, array $body = array(), $install = null, $blocking = true ) {
        // '/' is the scope itself (/v1/installs/12.json), 'uninstall.json' a resource under it
        $scope    = $install ? '/installs/' . $install['id'] : '/plugins/' . $this->id;
        $path     = trim( $path, '/' );
        $resource = '/v1' . $scope . ( '' === $path ? '.json' : '/' . $path );
        $id       = $install ? $install['id'] : $this->id;
        $public   = $install ? $install['public_key'] : $this->public_key;
        $secret   = $install ? $install['secret_key'] : $this->public_key;

        $json = $body ? wp_json_encode( $body ) : '';
        $md5  = $json ? md5( $json ) : '';
        $type = in_array( $method, array( 'POST', 'PUT' ), true ) ? 'application/json' : '';
        $date = gmdate( 'D, d M Y H:i:s +0000' );
        $sign = hash_hmac( 'sha256', implode( "\n", array( $method, $md5, $type, $date, $resource ) ), $secret );
        $sign = rtrim( strtr( base64_encode( $sign ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- the Freemius API signature format

        $headers = array(
            'Date'          => $date,
            'Authorization' => ( $secret === $public ? 'FSP ' : 'FS ' ) . $id . ':' . $public . ':' . $sign,
        );
        // the signature covers the content type, so a GET must not send one
        if ( $type ) {
            $headers['Content-Type'] = $type;
        }
        if ( $md5 ) {
            $headers['Content-MD5'] = $md5;
        }

        $response = wp_remote_request( self::API . $resource, array(
            'method'   => $method,
            'headers'  => $headers,
            'body'     => $json,
            'timeout'  => $blocking ? 15 : 3,
            'blocking' => $blocking,
        ) );
        if ( ! $blocking || is_wp_error( $response ) ) {
            return $response;
        }
        return json_decode( wp_remote_retrieve_body( $response ) );
    }

    private function update_install( array $changes, $blocking = false ) {
        $data = $this->data();
        if ( 'connected' !== $data['state'] || empty( $data['install']['secret_key'] ) ) {
            return false;
        }
        return $this->api( '/', 'PUT', array_merge( $this->site_data(), array( 'uid' => $this->uid(), 'is_active' => true, 'is_uninstalled' => false ), $changes ), $data['install'], $blocking );
    }

    /* ----- opt-in ----- */

    private function return_url() {
        // a plain URL, wp_nonce_url() would HTML-escape the &
        return add_query_arg( array(
            'fs_action' => $this->slug . '_activate_new',
            '_wpnonce'  => wp_create_nonce( self::NONCE . '_return' ),
        ), dashboard::url() );
    }

    public function opt_in_action() {
        check_admin_referer( self::NONCE . '_opt_in' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__('You are not allowed to do this.', 'softicon-flipbook'), '', array( 'response' => 403 ) );
        }
        $user = wp_get_current_user();

        $response = wp_remote_post( self::OPT_IN, array(
            'timeout' => 30,
            'body'    => array(
                'sdk_version'                    => self::SDK,
                'platform_version'               => get_bloginfo( 'version' ),
                'programming_language_version'   => phpversion(),
                'plugin_slug'                    => $this->slug,
                'plugin_id'                      => $this->id,
                'plugin_public_key'              => $this->public_key,
                'plugin_version'                 => $this->version(),
                'return_url'                     => $this->return_url(),
                'account_url'                    => dashboard::url(),
                'is_premium'                     => false,
                'is_active'                      => true,
                'is_uninstalled'                 => false,
                'is_localhost'                   => $this->is_localhost(),
                'user_firstname'                 => $user->user_firstname,
                'user_lastname'                  => $user->user_lastname,
                'user_email'                     => $user->user_email,
                'site_uid'                       => $this->uid(),
                'site_url'                       => $this->site_url(),
                'site_name'                      => get_bloginfo( 'name' ),
                'language'                       => substr( get_bloginfo( 'language' ), 0, 8 ),
                'is_disconnected'                => false,
                'is_extensions_tracking_allowed' => false,
                'is_diagnostic_tracking_allowed' => true,
                'format'                         => 'json',
            ),
        ) );

        $result = is_wp_error( $response ) ? null : json_decode( wp_remote_retrieve_body( $response ) );
        $notice = 'error';
        if ( is_object( $result ) && ! empty( $result->install_secret_key ) ) {
            $this->connect( $result->install_id, $result->install_public_key, $result->install_secret_key );
            $notice = 'connected';
        } elseif ( is_object( $result ) && ! empty( $result->pending_activation ) ) {
            $this->save( array( 'state' => 'pending', 'email' => isset( $result->email ) ? sanitize_email( $result->email ) : $user->user_email ) );
            $notice = 'pending';
        }

        wp_safe_redirect( add_query_arg( 'alfb_fs', $notice, dashboard::url() ) );
        exit;
    }

    private function connect( $id, $public_key, $secret_key ) {
        $this->save( array(
            'state'    => 'connected',
            'tracking' => true,
            'email'    => '',
            'version'  => $this->version(),
            'install'  => array( 'id' => (string) absint( $id ), 'public_key' => sanitize_text_field( $public_key ), 'secret_key' => sanitize_text_field( $secret_key ) ),
        ) );
    }

    public function skip_action() {
        check_admin_referer( self::NONCE . '_skip' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__('You are not allowed to do this.', 'softicon-flipbook'), '', array( 'response' => 403 ) );
        }
        $this->save( array( 'state' => 'skipped' ) );
        wp_safe_redirect( dashboard::url() );
        exit;
    }

    public function admin_init() {
        // the link in the Freemius confirmation email comes back here with the install's keys
        // phpcs:disable WordPress.Security.NonceVerification.Recommended -- checked by check_admin_referer below
        if ( isset( $_GET['fs_action'], $_GET['install_secret_key'] ) && $this->slug . '_activate_new' === $_GET['fs_action'] ) {
            check_admin_referer( self::NONCE . '_return' );
            if ( current_user_can( 'manage_options' ) && 'pending' === $this->data()['state'] && isset( $_GET['install_id'], $_GET['install_public_key'] ) ) {
                $this->connect( absint( $_GET['install_id'] ), sanitize_text_field( wp_unslash( $_GET['install_public_key'] ) ), sanitize_text_field( wp_unslash( $_GET['install_secret_key'] ) ) );
                wp_safe_redirect( add_query_arg( 'alfb_fs', 'connected', dashboard::url() ) );
                exit;
            }
        }
        // phpcs:enable

        $data = $this->data();

        // once after activation, the dashboard where the opt-in is
        if ( $data['redirect'] ) {
            $this->save( array( 'redirect' => false ) );
            if ( '' === $data['state'] && current_user_can( 'manage_options' ) && ! isset( $_GET['activate-multi'] ) && ! wp_doing_ajax() && ! is_network_admin() ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only reads where WordPress came from
                wp_safe_redirect( dashboard::url() );
                exit;
            }
        }

        // a new plugin version is reported once
        if ( $this->is_connected() && $data['version'] !== $this->version() ) {
            $this->save( array( 'version' => $this->version() ) );
            $this->update_install( array() );
        }
    }

    /* ----- activation, deactivation, uninstall ----- */

    public function activated() {
        register_uninstall_hook( $this->file, array( __CLASS__, 'uninstall' ) );
        $data = $this->save( array( 'redirect' => '' === $this->data()['state'] ) );
        if ( 'connected' === $data['state'] && $data['tracking'] ) {
            $this->update_install( array( 'is_active' => true ) );
        }
    }

    public function deactivated() {
        register_uninstall_hook( $this->file, array( __CLASS__, 'uninstall' ) );
        if ( $this->is_connected() ) {
            $this->update_install( array( 'is_active' => false ) );
        }
    }

    // the plugin is deleted: the reason given at deactivation goes to Freemius, then the stored data is removed
    public static function uninstall() {
        $self = self::instance();
        if ( $self ) {
            $data   = $self->data();
            $reason = is_array( $data['reason'] ) ? $data['reason'] : null;
            $params = $reason ? array( 'reason_id' => $reason['id'], 'reason_info' => $reason['info'] ) : array();
            if ( $self->is_connected() ) {
                $self->update_install( array_merge( $params, array( 'is_active' => false, 'is_uninstalled' => true ) ), true );
            } elseif ( $reason ) {
                // a site that never opted in only sends the answer it chose to give, with no name or email
                $self->api( 'uninstall.json', 'PUT', array_merge( $params, array( 'uid' => $self->uid() ) ) );
            }
        }
        delete_option( self::OPTION );
    }

    /* ----- opt-out and back in, from the Plugins page ----- */

    public function tracking_ajax() {
        check_ajax_referer( self::NONCE . '_tracking' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( null, 403 );
        }
        $data   = $this->data();
        $enable = ! empty( $_POST['enable'] );
        if ( 'connected' !== $data['state'] ) {
            wp_send_json_success( array( 'url' => dashboard::url() ) );
        }
        $result = $this->api( 'permissions.json', 'PUT', array( 'permissions' => 'user,site,events,diagnostic', 'is_enabled' => $enable ), $data['install'] );
        if ( ! is_object( $result ) || ! isset( $result->install_id ) ) {
            wp_send_json_error( array( 'message' => __('Could not reach Freemius. Please try again.', 'softicon-flipbook') ) );
        }
        $this->save( array( 'tracking' => $enable ) );
        wp_send_json_success();
    }

    public function action_links( $links ) {
        if ( ! current_user_can( 'manage_options' ) ) {
            return $links;
        }
        $data = $this->data();
        if ( $this->is_connected() ) {
            $links['alfb-opt'] = '<a href="#" class="alfb-fs-tracking" data-enable="0">' . esc_html__('Opt Out', 'softicon-flipbook') . '</a>';
        } elseif ( 'connected' === $data['state'] ) {
            $links['alfb-opt'] = '<a href="#" class="alfb-fs-tracking" data-enable="1">' . esc_html__('Opt In', 'softicon-flipbook') . '</a>';
        } else {
            $links['alfb-opt'] = '<a href="' . esc_url( add_query_arg( 'alfb_fs', 'ask', dashboard::url() ) ) . '">' . esc_html__('Opt In', 'softicon-flipbook') . '</a>';
        }
        return $links;
    }

    /* ----- the deactivation form ----- */

    public static function reasons() {
        return array(
            1                      => array( __('I no longer need the plugin', 'softicon-flipbook'), '' ),
            2                      => array( __('I found a better plugin', 'softicon-flipbook'), __('Which plugin?', 'softicon-flipbook') ),
            3                      => array( __('I only needed it for a short time', 'softicon-flipbook'), '' ),
            12                     => array( __('It is not working', 'softicon-flipbook'), __('What did not work? We would like to fix it.', 'softicon-flipbook') ),
            11                     => array( __('I need a feature it does not have', 'softicon-flipbook'), __('Which feature?', 'softicon-flipbook') ),
            4                      => array( __('It broke my site', 'softicon-flipbook'), '' ),
            self::REASON_TEMPORARY => array( __('It is a temporary deactivation, I am fixing something', 'softicon-flipbook'), '' ),
            self::REASON_OTHER     => array( __('Other', 'softicon-flipbook'), __('Please tell us more', 'softicon-flipbook') ),
        );
    }

    public function reason_ajax() {
        check_ajax_referer( self::NONCE . '_reason' );
        if ( ! current_user_can( 'activate_plugins' ) ) {
            wp_send_json_error( null, 403 );
        }
        $id = isset( $_POST['reason'] ) ? absint( $_POST['reason'] ) : 0;
        if ( ! isset( self::reasons()[ $id ] ) ) {
            wp_send_json_error();
        }
        $info = isset( $_POST['info'] ) ? sanitize_text_field( wp_unslash( $_POST['info'] ) ) : '';
        $this->save( array( 'reason' => array( 'id' => $id, 'info' => mb_substr( $info, 0, 128 ) ) ) );
        wp_send_json_success();
    }

    public function plugins_page_assets( $hook ) {
        if ( 'plugins.php' !== $hook ) {
            return;
        }
        wp_enqueue_style( 'alfb-fs-lite', ALFB_PLUGIN_URL . 'assets/css/fs-lite.css', array(), dashboard::version( 'assets/css/fs-lite.css' ) );
        wp_enqueue_script( 'alfb-fs-lite', ALFB_PLUGIN_URL . 'assets/js/fs-lite.js', array(), dashboard::version( 'assets/js/fs-lite.js' ), array( 'in_footer' => true, 'strategy' => 'defer' ) );
        wp_add_inline_script( 'alfb-fs-lite', 'window.alfbFsLite = ' . wp_json_encode( array(
            'ajax'     => admin_url( 'admin-ajax.php' ),
            'plugin'   => plugin_basename( $this->file ),
            'reason'   => wp_create_nonce( self::NONCE . '_reason' ),
            'tracking' => wp_create_nonce( self::NONCE . '_tracking' ),
            'optOut'   => __('Stop sending usage data to SoftIcon through Freemius? You can opt in again at any time.', 'softicon-flipbook'),
        ) ) . ';', 'before' );
    }

    public function deactivate_form() {
        if ( ! current_user_can( 'activate_plugins' ) ) {
            return;
        }
        ?>
        <div class="alfb-fs-modal" id="alfb-fs-deactivate" hidden>
            <form class="alfb-fs-dialog" role="dialog" aria-modal="true" aria-labelledby="alfb-fs-deactivate-title">
                <h2 id="alfb-fs-deactivate-title"><?php esc_html_e('Quick question before you go', 'softicon-flipbook'); ?></h2>
                <p><?php esc_html_e('Why are you deactivating SoftIcon Flipbook? Your answer helps us make it better.', 'softicon-flipbook'); ?></p>
                <ul>
                    <?php foreach ( self::reasons() as $id => $reason ) : ?>
                        <li>
                            <label><input type="radio" name="reason" value="<?php echo esc_attr( $id ); ?>"> <?php echo esc_html( $reason[0] ); ?></label>
                            <?php if ( $reason[1] ) : ?>
                                <input type="text" name="info" maxlength="128" placeholder="<?php echo esc_attr( $reason[1] ); ?>" aria-label="<?php echo esc_attr( $reason[1] ); ?>" hidden disabled>
                            <?php endif; ?>
                        </li>
                    <?php endforeach; ?>
                </ul>
                <p class="alfb-fs-small"><?php esc_html_e('Only your answer is sent, when the plugin is deleted. No name or email unless you opted in before.', 'softicon-flipbook'); ?></p>
                <div class="alfb-fs-actions">
                    <button type="button" class="button-link alfb-fs-skip"><?php esc_html_e('Skip & Deactivate', 'softicon-flipbook'); ?></button>
                    <span>
                        <button type="button" class="button alfb-fs-cancel"><?php esc_html_e('Cancel', 'softicon-flipbook'); ?></button>
                        <button type="submit" class="button button-primary" disabled><?php esc_html_e('Submit & Deactivate', 'softicon-flipbook'); ?></button>
                    </span>
                </div>
            </form>
        </div>
        <?php
    }

    /* ----- the opt-in card on the dashboard ----- */

    public function opt_in_card() {
        $data = $this->data();
        $ask  = isset( $_GET['alfb_fs'] ) && 'ask' === $_GET['alfb_fs']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only shows the card
        if ( ! current_user_can( 'manage_options' ) || ( '' !== $data['state'] && ! ( $ask && 'connected' !== $data['state'] ) ) ) {
            return;
        }
        $user = wp_get_current_user();
        $permissions = array(
            array( 'admin-users', __('Your profile', 'softicon-flipbook'), __('Name and email address', 'softicon-flipbook') ),
            array( 'admin-site-alt3', __('Your site', 'softicon-flipbook'), __('Site address, title and language, WordPress and PHP versions', 'softicon-flipbook') ),
            array( 'admin-plugins', __('Plugin events', 'softicon-flipbook'), __('Flipbook version, activation, deactivation and uninstall', 'softicon-flipbook') ),
        );
        ?>
        <section class="alfb-optin">
            <img src="<?php echo esc_url( ALFB_PLUGIN_URL . 'assets/images/icon-128x128.png' ); ?>" alt="" width="56" height="56">
            <div class="alfb-optin-body">
                <h2><?php esc_html_e('Never miss an important update', 'softicon-flipbook'); ?></h2>
                <p><?php
                    /* translators: %s: the admin's first name or user name */
                    printf( esc_html__('Hi %s! Opt in to get emails about security fixes and new features, and to share some basic site data with SoftIcon through Freemius. It helps us make Flipbook better. If you skip, the plugin works just the same.', 'softicon-flipbook'), esc_html( $user->user_firstname ? $user->user_firstname : $user->display_name ) );
                ?></p>
                <details>
                    <summary><?php esc_html_e('What is shared', 'softicon-flipbook'); ?></summary>
                    <ul>
                        <?php foreach ( $permissions as $permission ) : ?>
                            <li><span class="dashicons dashicons-<?php echo esc_attr( $permission[0] ); ?>" aria-hidden="true"></span><strong><?php echo esc_html( $permission[1] ); ?></strong> <?php echo esc_html( $permission[2] ); ?></li>
                        <?php endforeach; ?>
                    </ul>
                    <p><?php esc_html_e('Nothing about your posts, visitors, other plugins or themes. You can opt out at any time from the Plugins page.', 'softicon-flipbook'); ?>
                        <a href="https://freemius.com/privacy/" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Freemius privacy policy', 'softicon-flipbook'); ?></a></p>
                </details>
                <div class="alfb-optin-actions">
                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                        <input type="hidden" name="action" value="alfb_fs_opt_in">
                        <?php wp_nonce_field( self::NONCE . '_opt_in' ); ?>
                        <button type="submit" class="alfb-btn alfb-btn-teal"><?php esc_html_e('Allow & Continue', 'softicon-flipbook'); ?></button>
                    </form>
                    <?php if ( '' === $data['state'] ) : ?>
                        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                            <input type="hidden" name="action" value="alfb_fs_skip">
                            <?php wp_nonce_field( self::NONCE . '_skip' ); ?>
                            <button type="submit" class="button-link"><?php esc_html_e('Skip', 'softicon-flipbook'); ?></button>
                        </form>
                    <?php endif; ?>
                </div>
            </div>
        </section>
        <?php
    }

    public function notices() {
        $screen = get_current_screen();
        if ( ! $screen || 'toplevel_page_' . dashboard::PAGE !== $screen->id ) {
            return;
        }
        $data   = $this->data();
        $notice = isset( $_GET['alfb_fs'] ) ? sanitize_key( wp_unslash( $_GET['alfb_fs'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only picks a message
        if ( 'connected' === $notice && $this->is_connected() ) {
            echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Thank you! You will now hear about important Flipbook updates.', 'softicon-flipbook') . '</p></div>';
        } elseif ( 'pending' === $data['state'] ) {
            /* translators: %s: email address */
            echo '<div class="notice notice-info"><p>' . sprintf( esc_html__('Almost done: please open the email we sent to %s and click the link to confirm.', 'softicon-flipbook'), '<strong>' . esc_html( $data['email'] ) . '</strong>' ) . '</p></div>';
        } elseif ( 'error' === $notice ) {
            echo '<div class="notice notice-error is-dismissible"><p>' . esc_html__('Could not reach Freemius right now. Please try again later.', 'softicon-flipbook') . '</p></div>';
        }
    }

    private function is_localhost() {
        $host = wp_parse_url( $this->site_url(), PHP_URL_HOST );
        return in_array( $host, array( 'localhost', '127.0.0.1', '::1' ), true ) || (bool) preg_match( '/\.(local|test|localhost|example|invalid)$/', (string) $host );
    }
}
