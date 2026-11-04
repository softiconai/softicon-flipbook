<?php
namespace ALFB_Flipbook;
if ( !defined('ABSPATH') ) { exit;}

// the Flipbook admin page; src/dashboard (React) draws it from config(), Pro adds its own tabs in PHP
class dashboard {

    const PAGE     = 'softicon-flipbook';
    const PLAYLIST = 'https://www.youtube.com/playlist?list=PLJEAefIarF4g';
    const CACHE    = 'alfb_freemius';
    // the review request: when a published flipbook was first seen, and the person's answer
    const REVIEW   = 'alfb_review';

    public function __construct()
    {
        add_action('admin_menu', array( $this, 'menu' ));
        add_action('admin_enqueue_scripts', array( $this, 'enqueue_assets' ));
        add_filter('plugin_action_links_' . plugin_basename( ALFB_PLUGIN_PATH . 'softicon-flipbook.php' ), array( $this, 'action_links' ));
        add_filter('plugin_row_meta', array( $this, 'row_meta' ), 10, 2);
    }

    public static function is_pro() {
        return defined( 'ALFB_IS_PRO' ) && ALFB_IS_PRO;
    }

    // SoftIcon Flipbook Pro installed without an active license: its features are locked and Pricing shows again
    public static function locked() {
        return self::is_pro() && (bool) apply_filters( 'alfb_pro_locked', false );
    }

    // the Freemius product id and public key, from fs lite (free) or the Freemius SDK (Pro)
    private static function product() {
        $fs = function_exists( 'alfb_fs' ) ? alfb_fs() : null;
        if ( $fs && method_exists( $fs, 'public_key' ) ) {
            return array( (string) $fs->id(), $fs->public_key() );
        }
        if ( $fs && method_exists( $fs, 'get_public_key' ) ) {
            return array( (string) $fs->get_id(), $fs->get_public_key() );
        }
        return null;
    }

    // the public plans and prices; fs lite reads them in the free plugin, the Freemius SDK's plugin scope in Pro
    private static function fetch_pricing() {
        $fs = function_exists( 'alfb_fs' ) ? alfb_fs() : null;
        if ( $fs && method_exists( $fs, 'pricing' ) ) {
            return $fs->pricing();
        }
        if ( $fs && method_exists( $fs, 'get_api_plugin_scope' ) ) {
            $result = $fs->get_api_plugin_scope()->get( 'pricing.json' );
            return is_object( $result ) && isset( $result->plans ) && is_array( $result->plans ) ? $result : null;
        }
        return null;
    }

    // the tutorials; a click plays one in a popup on the dashboard
    public static function videos() {
        return array(
            'https://www.youtube.com/watch?v=5geq69DXoN8' => __('Overview in one minute', 'softicon-flipbook'),
            'https://www.youtube.com/watch?v=KGP_xpi8NGo' => __('Add a flipbook', 'softicon-flipbook'),
            'https://www.youtube.com/watch?v=XBJuUV9HpkA' => __('Lightbox: covers that open a popup', 'softicon-flipbook'),
            'https://www.youtube.com/watch?v=qqQeZQkX5ms' => __('Hardcover design', 'softicon-flipbook'),
            'https://www.youtube.com/watch?v=1J7wCaUvugc' => __('Reading features', 'softicon-flipbook'),
            'https://www.youtube.com/watch?v=H9IxgIocY68' => __('Every setting explained', 'softicon-flipbook'),
        );
    }

    /* ----- plans, features and prices, all set in Freemius ----- */

    // kept for 12 hours (1 hour after a failed read); $fetch false only reads what is kept, for the editor
    public static function freemius( $fetch = true ) {
        $data = get_transient( self::CACHE );
        if ( false === $data && $fetch && ( ! self::is_pro() || self::locked() ) ) {
            $data = self::parse( self::fetch_pricing() );
            // no paid plan yet (plans not released in Freemius): ask again within the hour
            set_transient( self::CACHE, $data, $data['error'] || ! $data['pro'] ? HOUR_IN_SECONDS : 12 * HOUR_IN_SECONDS );
        }
        return is_array( $data ) ? $data : self::parse( false );
    }

    // the free plan's features, and the first paid plan with its features and prices
    private static function parse( $result ) {
        $data = array( 'error' => ! is_object( $result ), 'free' => array(), 'pro' => null, 'money_back' => 0 );
        if ( ! is_object( $result ) ) {
            return $data;
        }
        $data['money_back'] = isset( $result->plugin->money_back_period ) ? absint( $result->plugin->money_back_period ) : 0;

        foreach ( $result->plans as $plan ) {
            $features = array();
            foreach ( isset( $plan->features ) && is_array( $plan->features ) ? $plan->features : array() as $feature ) {
                if ( ! empty( $feature->title ) ) {
                    $features[] = array(
                        'title'    => sanitize_text_field( $feature->title ),
                        'text'     => isset( $feature->description ) ? sanitize_text_field( $feature->description ) : '',
                        'featured' => ! empty( $feature->is_featured ),
                    );
                }
            }

            $prices = array();
            foreach ( isset( $plan->pricing ) && is_array( $plan->pricing ) ? $plan->pricing : array() as $price ) {
                foreach ( array( 'lifetime', 'annual', 'monthly' ) as $cycle ) {
                    if ( isset( $price->{ $cycle . '_price' } ) && is_numeric( $price->{ $cycle . '_price' } ) ) {
                        $prices[] = array(
                            'licenses' => empty( $price->licenses ) ? 'unlimited' : absint( $price->licenses ),
                            'price'    => (float) $price->{ $cycle . '_price' },
                            'cycle'    => $cycle,
                            'currency' => isset( $price->currency ) ? sanitize_key( $price->currency ) : 'usd',
                        );
                        break;
                    }
                }
            }

            if ( $prices && null === $data['pro'] ) {
                // fewest sites first, unlimited last
                usort( $prices, function ( $a, $b ) {
                    $a = 'unlimited' === $a['licenses'] ? PHP_INT_MAX : $a['licenses'];
                    $b = 'unlimited' === $b['licenses'] ? PHP_INT_MAX : $b['licenses'];
                    return $a - $b;
                } );
                $data['pro'] = array(
                    'id'       => isset( $plan->id ) ? absint( $plan->id ) : 0,
                    'title'    => isset( $plan->title ) ? sanitize_text_field( $plan->title ) : '',
                    'text'     => isset( $plan->description ) ? sanitize_text_field( $plan->description ) : '',
                    'features' => $features,
                    'prices'   => $prices,
                );
            } elseif ( ! $prices && isset( $plan->name ) && 'free' === $plan->name ) {
                $data['free'] = $features;
            }
        }
        return $data;
    }

    // the Pro features the free plan does not have
    public static function pro_only( $data ) {
        if ( ! $data['pro'] ) {
            return array();
        }
        $free = array_map( 'strtolower', wp_list_pluck( $data['free'], 'title' ) );
        return array_values( array_filter( $data['pro']['features'], function ( $feature ) use ( $free ) {
            return ! in_array( strtolower( $feature['title'] ), $free, true );
        } ) );
    }


    // the dashboard is one page; each tab is a #/route in it
    public static function url( $tab = '' ) {
        return admin_url( 'admin.php?page=' . self::PAGE ) . ( $tab ? '#/' . $tab : '' );
    }

    public function menu() {
        add_menu_page(
            __('SoftIcon Flipbook', 'softicon-flipbook'),
            __('Flipbook', 'softicon-flipbook'),
            'manage_options',
            self::PAGE,
            array( $this, 'render' ),
            'dashicons-book-alt',
            58
        );
    }

    public function action_links( $links ) {
        array_unshift( $links, '<a href="' . esc_url( self::url() ) . '">' . esc_html__('Dashboard', 'softicon-flipbook') . '</a>' );
        if ( ! self::is_pro() ) {
            $links[] = '<a href="' . esc_url( self::url( 'compare' ) ) . '" style="color:#b45309;font-weight:600">' . esc_html__('Free vs Pro', 'softicon-flipbook') . '</a>';
        }
        return $links;
    }

    public function row_meta( $links, $file ) {
        if ( plugin_basename( ALFB_PLUGIN_PATH . 'softicon-flipbook.php' ) === $file ) {
            $links[] = '<a href="' . esc_url( self::url( 'videos' ) ) . '">' . esc_html__('Video tutorials', 'softicon-flipbook') . '</a>';
        }
        return $links;
    }

    // a new file gets a new URL, so a browser never keeps an old copy after an update
    public static function version( $file ) {
        $time = file_exists( ALFB_PLUGIN_PATH . $file ) ? filemtime( ALFB_PLUGIN_PATH . $file ) : false;
        return $time ? ALFB_PLUGIN_VERSION . '.' . $time : ALFB_PLUGIN_VERSION;
    }

    public function enqueue_assets( $hook ) {
        if ( 'toplevel_page_' . self::PAGE !== $hook ) {
            return;
        }
        wp_enqueue_style( 'alfb-dashboard', ALFB_PLUGIN_URL . 'assets/css/dashboard.css', array(), self::version( 'assets/css/dashboard.css' ) );
        $script = file_exists( ALFB_PLUGIN_PATH . 'build/dashboard.asset.php' ) ? require ALFB_PLUGIN_PATH . 'build/dashboard.asset.php' : array( 'dependencies' => array(), 'version' => ALFB_PLUGIN_VERSION );
        wp_enqueue_script( 'alfb-dashboard', ALFB_PLUGIN_URL . 'build/dashboard.js', $script['dependencies'], $script['version'], true );
        wp_set_script_translations( 'alfb-dashboard', 'softicon-flipbook', ALFB_PLUGIN_PATH . 'languages' );
        wp_add_inline_script( 'alfb-dashboard', 'window.alfbDashboard = ' . wp_json_encode( self::config() ) . ';', 'before' );
        // the demos are real flipbooks, drawn by src/dashboard/Demos.js
        wp_enqueue_style( generate_block_asset_handle( 'softicon/flipbook', 'style' ) );
        wp_enqueue_script( generate_block_asset_handle( 'softicon/flipbook', 'viewScript' ) );
        // add-ons enqueue their tabs here; a script that adds tabs makes itself a dependency of alfb-dashboard
        do_action( 'alfb_dashboard_assets' );
    }

    // the tab names; their content is React (src/dashboard), Pro adds its own through the alfb.dashboard.tabs JS filter
    public static function tabs() {
        $tabs = array(
            'welcome' => __('Welcome', 'softicon-flipbook'),
            'demos'   => __('Demos', 'softicon-flipbook'),
        );
        if ( ! self::is_pro() || self::locked() ) {
            $tabs['pricing'] = __('Pricing', 'softicon-flipbook');
            $tabs['compare'] = __('Free vs Pro', 'softicon-flipbook');
        }
        $tabs['help'] = __('Help', 'softicon-flipbook');
        return apply_filters( 'alfb_dashboard_tabs', $tabs );
    }

    // a tab placed just before Help
    public static function before_help( $tabs, $key, $label ) {
        $at = array_search( 'help', array_keys( $tabs ), true );
        $at = false === $at ? count( $tabs ) : $at;
        return array_slice( $tabs, 0, $at, true ) + array( $key => $label ) + array_slice( $tabs, $at, null, true );
    }

    private static function config() {
        $tabs = array();
        foreach ( self::tabs() as $key => $label ) {
            $tabs[] = array( 'key' => $key, 'label' => $label );
        }
        $videos = array();
        foreach ( self::videos() as $url => $title ) {
            $videos[] = array( 'url' => $url, 'title' => $title );
        }
        $config = array(
            'tabs'    => $tabs,
            'pro'     => self::is_pro(),
            'version' => ALFB_PLUGIN_VERSION,
            'icon'    => ALFB_PLUGIN_URL . 'assets/images/icon-128x128.png',
            'videos'  => $videos,
            'notice'  => method_exists( alfb_fs(), 'notice' ) ? alfb_fs()->notice() : null,
            'review'  => self::review(),
            // Pro without a license: these tabs open the "this is a Pro feature" popup instead
            'locked'     => self::locked(),
            'lockedTabs' => self::locked() ? array_values( (array) apply_filters( 'alfb_dashboard_locked_tabs', array() ) ) : array(),
            'activate'   => self::locked() ? esc_url_raw( (string) apply_filters( 'alfb_activate_url', '' ) ) : '',
            'urls'    => array(
                // a new page that starts with a flipbook of the demo PDF (src/index.js)
                'newPage'  => admin_url( 'post-new.php?post_type=page&alfb_start=1' ),
                // the sample PDFs the Demos tab shows
                'demo'     => ALFB_PLUGIN_URL . 'assets/demo/',
                'playlist' => self::PLAYLIST,
            ),
        );
        return apply_filters( 'alfb_dashboard_config', $config );
    }

    // registered on every request (REST calls are not admin pages), see softicon-flipbook.php
    public static function routes() {
        $admin = function () {
            return current_user_can( 'manage_options' );
        };
        register_rest_route( 'alfb/v1', '/dashboard/plans', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'plans' ),
            'permission_callback' => $admin,
        ) );
        register_rest_route( 'alfb/v1', '/dashboard/review', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'review_answer' ),
            'permission_callback' => $admin,
            'args'                => array(
                'answer' => array( 'required' => true, 'enum' => array( 'later', 'done' ) ),
            ),
        ) );
    }

    // a short review request on this dashboard only: 3 days after a published flipbook is first seen, until
    // the person reviews, says they did, or asks again later (30 days)
    public static function review() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return null;
        }
        $review = wp_parse_args( get_option( self::REVIEW, array() ), array( 'since' => 0, 'checked' => 0, 'later' => 0, 'done' => false ) );
        if ( $review['done'] || $review['later'] > time() ) {
            return null;
        }
        // a published page or post with the block, looked for at most once a day until one is found
        if ( ! $review['since'] && $review['checked'] < time() - DAY_IN_SECONDS ) {
            $found = new \WP_Query( array(
                'post_type'      => 'any',
                'post_status'    => 'publish',
                's'              => 'wp:softicon/flipbook',
                'sentence'       => true,
                'posts_per_page' => 1,
                'fields'         => 'ids',
                'no_found_rows'  => true,
            ) );
            $review['checked'] = time();
            $review['since']   = $found->posts ? time() : 0;
            update_option( self::REVIEW, $review, false );
        }
        if ( ! $review['since'] || $review['since'] > time() - 3 * DAY_IN_SECONDS ) {
            return null;
        }
        return array( 'url' => 'https://wordpress.org/support/plugin/softicon-flipbook/reviews/#new-post' );
    }

    public static function review_answer( $request ) {
        $review = wp_parse_args( get_option( self::REVIEW, array() ), array( 'since' => 0, 'checked' => 0, 'later' => 0, 'done' => false ) );
        if ( 'done' === $request->get_param( 'answer' ) ) {
            $review['done'] = true;
        } else {
            $review['later'] = time() + 30 * DAY_IN_SECONDS;
        }
        update_option( self::REVIEW, $review, false );
        return rest_ensure_response( array( 'ok' => true ) );
    }

    // the Pricing and Free vs Pro tabs: the plans from Freemius and what the checkout needs;
    // ?cached=1 only reads what is kept and never asks Freemius
    public static function plans( $request = null ) {
        $data             = self::freemius( ! ( $request && $request->get_param( 'cached' ) ) );
        $data['pro_only'] = self::pro_only( $data );
        $product          = ( self::is_pro() && ! self::locked() ) ? null : self::product();
        $data['checkout'] = ! $product ? null : array(
            'product' => $product[0],
            'key'     => $product[1],
            // the icon on WordPress.org: always https, so it shows in the checkout on any site (a local http
            // address would not), and the site's own address is not sent to Freemius
            'image'   => 'https://ps.w.org/softicon-flipbook/assets/icon-256x256.png',
            'base'    => 'https://checkout.freemius.com/plugin/' . $product[0] . '/',
        );
        return rest_ensure_response( $data );
    }

    // React draws the whole page into #alfb-dashboard
    public function render() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        ?>
        <div class="wrap alfb-dash-notices">
            <h1 class="screen-reader-text"><?php echo esc_html( self::is_pro() ? __('SoftIcon Flipbook Pro', 'softicon-flipbook') : __('SoftIcon Flipbook', 'softicon-flipbook') ); ?></h1>
            <hr class="wp-header-end">
        </div>
        <div id="alfb-dashboard" class="alfb-dash">
            <noscript><p><?php esc_html_e('The Flipbook dashboard needs JavaScript.', 'softicon-flipbook'); ?></p></noscript>
        </div>
        <?php
    }
}
