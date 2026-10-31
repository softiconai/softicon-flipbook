<?php
namespace ALFB_Flipbook;
if ( !defined('ABSPATH') ) { exit;}

// the Flipbook admin page: welcome, live demos, free vs Pro and help; Pro adds its own tabs
class dashboard {

    const PAGE = 'softicon-flipbook';

    public function __construct()
    {
        add_action('admin_menu', array( $this, 'menu' ));
        add_action('admin_enqueue_scripts', array( $this, 'enqueue_assets' ));
        add_filter('plugin_action_links_' . plugin_basename( ALFB_PLUGIN_PATH . 'softicon-flipbook.php' ), array( $this, 'action_links' ));
    }

    public static function url( $tab = '' ) {
        return admin_url( 'admin.php?page=' . self::PAGE . ( $tab ? '&tab=' . $tab : '' ) );
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
        if ( ! pro_features::active() ) {
            $links[] = '<a href="' . esc_url( self::url( 'pro' ) ) . '" style="color:#b45309;font-weight:600">' . esc_html__('Free vs Pro', 'softicon-flipbook') . '</a>';
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
        wp_enqueue_script( 'alfb-dashboard', ALFB_PLUGIN_URL . 'assets/js/dashboard.js', array(), self::version( 'assets/js/dashboard.js' ), array( 'in_footer' => true, 'strategy' => 'defer' ) );
        // the demos are real flipbooks
        wp_enqueue_style( generate_block_asset_handle( 'softicon/flipbook', 'style' ) );
        wp_enqueue_script( generate_block_asset_handle( 'softicon/flipbook', 'viewScript' ) );
        do_action( 'alfb_dashboard_assets' );
    }

    public static function tabs() {
        $pro  = pro_features::active();
        $tabs = array(
            'welcome' => __('Welcome', 'softicon-flipbook'),
            'demos'   => __('Demos', 'softicon-flipbook'),
        );
        if ( ! $pro ) {
            $tabs['pricing'] = __('Pricing', 'softicon-flipbook');
        }
        $tabs['pro']  = $pro ? __('Settings', 'softicon-flipbook') : __('Free vs Pro', 'softicon-flipbook');
        $tabs['help'] = __('Help', 'softicon-flipbook');
        return apply_filters( 'alfb_dashboard_tabs', $tabs );
    }

    public function render() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        $tabs = self::tabs();
        $tab  = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'welcome'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only picks the tab to show
        $tab  = isset( $tabs[ $tab ] ) ? $tab : 'welcome';
        $pro  = pro_features::active();
        ?>
        <div class="alfb-dash">
            <header class="alfb-dash-head">
                <a class="alfb-dash-brand" href="<?php echo esc_url( self::url() ); ?>">
                    <img src="<?php echo esc_url( ALFB_PLUGIN_URL . 'assets/images/icon-128x128.png' ); ?>" alt="" width="36" height="36">
                    <strong><?php echo $pro ? esc_html__('Flipbook Pro', 'softicon-flipbook') : esc_html__('Flipbook', 'softicon-flipbook'); ?></strong>
                    <span class="alfb-version"><?php echo esc_html( 'v' . ALFB_PLUGIN_VERSION ); ?></span>
                </a>
                <nav class="alfb-dash-tabs" aria-label="<?php esc_attr_e('Flipbook dashboard', 'softicon-flipbook'); ?>">
                    <?php foreach ( $tabs as $key => $label ) : ?>
                        <a href="<?php echo esc_url( self::url( 'welcome' === $key ? '' : $key ) ); ?>" class="<?php echo $key === $tab ? 'is-active' : ''; ?>"<?php echo $key === $tab ? ' aria-current="page"' : ''; ?>><?php echo esc_html( $label ); ?></a>
                    <?php endforeach; ?>
                </nav>
                <div class="alfb-dash-end">
                    <a class="alfb-dash-more" href="https://wordpress.org/plugins/author/softiconai/" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Our plugins', 'softicon-flipbook'); ?></a>
                    <?php if ( $pro ) : ?>
                        <span class="alfb-pro-on"><span class="dashicons dashicons-yes-alt" aria-hidden="true"></span><?php esc_html_e('Pro active', 'softicon-flipbook'); ?></span>
                    <?php else : ?>
                        <a class="alfb-btn alfb-btn-amber alfb-upgrade" href="<?php echo esc_url( self::url( 'pricing' ) ); ?>"><span class="dashicons dashicons-unlock" aria-hidden="true"></span><?php esc_html_e('Upgrade to Pro', 'softicon-flipbook'); ?></a>
                    <?php endif; ?>
                </div>
            </header>

            <div class="wrap alfb-dash-body">
                <h1 class="screen-reader-text"><?php echo esc_html( $pro ? __('SoftIcon Flipbook Pro', 'softicon-flipbook') : __('SoftIcon Flipbook', 'softicon-flipbook') ); ?></h1>
                <hr class="wp-header-end">
                <?php
                if ( method_exists( $this, 'tab_' . $tab ) ) {
                    call_user_func( array( $this, 'tab_' . $tab ) );
                }
                do_action( 'alfb_dashboard_' . $tab );
                ?>
            </div>
        </div>
        <?php
    }

    private function tab_welcome() {
        $videos = array(
            array( 'XBJuUV9HpkA', __('Lightbox: covers that open a popup', 'softicon-flipbook') ),
            array( 'KGP_xpi8NGo', __('Add a flipbook', 'softicon-flipbook') ),
            array( 'qqQeZQkX5ms', __('Hardcover design', 'softicon-flipbook') ),
            array( '1J7wCaUvugc', __('Reading features', 'softicon-flipbook') ),
            array( 'H9IxgIocY68', __('Every setting explained', 'softicon-flipbook') ),
            array( '5geq69DXoN8', __('Overview in one minute', 'softicon-flipbook') ),
        );
        ?>
        <section class="alfb-hero">
            <div>
                <h2><?php esc_html_e('Turn any PDF into a book people enjoy reading', 'softicon-flipbook'); ?></h2>
                <p><?php esc_html_e('Catalogs, magazines, menus and brochures that turn like real pages, on phones and big screens, right inside the block editor.', 'softicon-flipbook'); ?></p>
                <p class="alfb-actions">
                    <a class="alfb-btn alfb-btn-amber" href="<?php echo esc_url( admin_url( 'post-new.php?post_type=page' ) ); ?>"><?php esc_html_e('Create a flipbook', 'softicon-flipbook'); ?></a>
                    <a class="alfb-btn alfb-btn-ghost" href="<?php echo esc_url( self::url( 'demos' ) ); ?>"><?php esc_html_e('See the demos', 'softicon-flipbook'); ?></a>
                </p>
            </div>
            <a class="alfb-hero-video" href="<?php echo esc_url( videos::PLAYLIST ); ?>" target="_blank" rel="noopener noreferrer">
                <span class="dashicons dashicons-controls-play" aria-hidden="true"></span>
                <?php esc_html_e('Watch the video tutorials', 'softicon-flipbook'); ?>
            </a>
        </section>

        <h2 class="alfb-title"><?php esc_html_e('Get started in three steps', 'softicon-flipbook'); ?></h2>
        <div class="alfb-grid alfb-steps">
            <div class="alfb-card"><span class="alfb-step">1</span><h3><?php esc_html_e('Add the block', 'softicon-flipbook'); ?></h3><p><?php esc_html_e('In any page or post, click + and search for "Flipbook".', 'softicon-flipbook'); ?></p></div>
            <div class="alfb-card"><span class="alfb-step">2</span><h3><?php esc_html_e('Pick a PDF', 'softicon-flipbook'); ?></h3><p><?php esc_html_e('Upload one, choose it from the Media Library, or build the book from images.', 'softicon-flipbook'); ?></p></div>
            <div class="alfb-card"><span class="alfb-step">3</span><h3><?php esc_html_e('Choose the look', 'softicon-flipbook'); ?></h3><p><?php esc_html_e('Classic or Hardcover, on the page or in a popup, then publish.', 'softicon-flipbook'); ?></p></div>
        </div>

        <h2 class="alfb-title"><?php esc_html_e('Video tutorials', 'softicon-flipbook'); ?></h2>
        <div class="alfb-grid alfb-videos">
            <?php foreach ( $videos as $video ) : ?>
                <a class="alfb-card alfb-video" href="<?php echo esc_url( 'https://www.youtube.com/watch?v=' . $video[0] . '&list=PLJEAefIarF4g' ); ?>" target="_blank" rel="noopener noreferrer">
                    <span class="dashicons dashicons-video-alt3" aria-hidden="true"></span><?php echo esc_html( $video[1] ); ?>
                </a>
            <?php endforeach; ?>
        </div>
        <?php
    }

    private function tab_demos() {
        $pdfs = demos::preview_pdfs();
        ?>
        <p class="alfb-lead"><?php esc_html_e('These are real flipbooks, try them. "Create a page" copies one into a new draft page, with the sample PDF added to your Media Library.', 'softicon-flipbook'); ?></p>
        <div class="alfb-demos">
            <?php foreach ( demos::all() as $key => $demo ) : ?>
                <article class="alfb-card alfb-demo<?php echo ! empty( $demo['pro'] ) ? ' is-pro' : ''; ?>">
                    <header>
                        <h3><?php echo esc_html( $demo['title'] ); ?><?php if ( ! empty( $demo['pro'] ) ) : ?> <span class="alfb-badge"><?php esc_html_e('Pro', 'softicon-flipbook'); ?></span><?php endif; ?></h3>
                        <p><?php echo esc_html( $demo['text'] ); ?></p>
                    </header>
                    <?php if ( isset( $demo['blocks'] ) ) : ?>
                        <div class="alfb-demo-view<?php echo ! empty( $demo['row'] ) ? ' is-row' : ''; ?>">
                            <?php echo do_blocks( demos::markup( $demo, $pdfs ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the block's render.php escapes ?>
                        </div>
                        <footer><a class="alfb-btn alfb-btn-teal" href="<?php echo esc_url( demos::create_url( $key ) ); ?>"><?php esc_html_e('Create a page with this', 'softicon-flipbook'); ?></a></footer>
                    <?php else : ?>
                        <div class="alfb-demo-locked"><span class="dashicons <?php echo esc_attr( $demo['icon'] ); ?>" aria-hidden="true"></span></div>
                        <footer><a class="alfb-btn alfb-btn-amber" href="<?php echo esc_url( self::url( 'pro' ) ); ?>"><?php esc_html_e('Available in Pro', 'softicon-flipbook'); ?></a></footer>
                    <?php endif; ?>
                </article>
            <?php endforeach; ?>
        </div>
        <?php
    }

    // a plan's price, paid once
    private static function price( $plan ) {
        ?>
        <p class="alfb-price"><sup>$</sup><?php echo esc_html( $plan['price'] ); ?><span><?php esc_html_e('one-time', 'softicon-flipbook'); ?></span></p>
        <?php
    }

    private function tab_pricing() {
        $includes = array(
            __('Every free feature', 'softicon-flipbook'),
            __('Bookshelf block', 'softicon-flipbook'),
            __('Lead capture', 'softicon-flipbook'),
            __('Reading analytics', 'softicon-flipbook'),
            __('PDF protection', 'softicon-flipbook'),
            __('Updates and email support for life', 'softicon-flipbook'),
        );
        ?>
        <div class="alfb-intro">
            <span class="alfb-eyebrow"><?php esc_html_e('Pricing', 'softicon-flipbook'); ?></span>
            <h2><?php esc_html_e('Pay once, use it for life', 'softicon-flipbook'); ?></h2>
            <p><?php esc_html_e('No subscription. Every plan has all Pro features; pick how many websites you need.', 'softicon-flipbook'); ?></p>
        </div>
        <div class="alfb-plans alfb-plans-3">
            <?php foreach ( pro_features::plans() as $plan ) : ?>
                <div class="alfb-plan">
                    <span class="alfb-tag"><?php echo esc_html( $plan['sites'] ); ?></span>
                    <h3><?php echo esc_html( $plan['title'] ); ?></h3>
                    <?php self::price( $plan ); ?>
                    <a class="alfb-btn alfb-btn-teal alfb-btn-block" href="<?php echo esc_url( pro_features::checkout( $plan['licenses'] ) ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Get Pro', 'softicon-flipbook'); ?> &rarr;</a>
                    <ul class="alfb-checks">
                        <li><?php echo esc_html( $plan['sites'] ); ?></li>
                        <?php foreach ( $includes as $item ) : ?>
                            <li><?php echo esc_html( $item ); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endforeach; ?>
        </div>
        <p class="alfb-note">
            <?php esc_html_e('Secure checkout by Freemius. Pro replaces the free plugin and keeps every book you made.', 'softicon-flipbook'); ?>
            <a href="<?php echo esc_url( self::url( 'pro' ) ); ?>"><?php esc_html_e('Compare Free and Pro', 'softicon-flipbook'); ?></a>
        </p>
        <?php
    }

    private function tab_pro() {
        // Pro shows its settings here instead (alfb_dashboard_pro)
        if ( pro_features::active() ) {
            return;
        }
        $single = pro_features::plans()[0];
        ?>
        <div class="alfb-intro">
            <span class="alfb-eyebrow"><?php esc_html_e('Compare', 'softicon-flipbook'); ?></span>
            <h2><?php esc_html_e('Free vs Pro at a glance', 'softicon-flipbook'); ?></h2>
            <p><?php
                /* translators: %s: number of features */
                printf( esc_html__('See what you get when you upgrade. %s features are only in Pro.', 'softicon-flipbook'), '<strong>' . esc_html( number_format_i18n( pro_features::pro_count() ) ) . '</strong>' );
            ?></p>
        </div>

        <div class="alfb-plans">
            <div class="alfb-plan">
                <span class="alfb-tag"><?php esc_html_e('Free', 'softicon-flipbook'); ?></span>
                <h3><?php esc_html_e('Free', 'softicon-flipbook'); ?></h3>
                <p><?php esc_html_e('Free forever, everything you need to put books on your site.', 'softicon-flipbook'); ?></p>
                <p class="alfb-price"><sup>$</sup>0<span><?php esc_html_e('forever', 'softicon-flipbook'); ?></span></p>
                <span class="alfb-have"><span class="dashicons dashicons-yes" aria-hidden="true"></span><?php esc_html_e('You already have it', 'softicon-flipbook'); ?></span>
            </div>
            <div class="alfb-plan is-pro">
                <span class="alfb-tag"><?php esc_html_e('Pro', 'softicon-flipbook'); ?></span>
                <h3><?php esc_html_e('Pro', 'softicon-flipbook'); ?></h3>
                <p><?php esc_html_e('Everything in Free, plus shelves of books, leads, reading analytics and a protected PDF.', 'softicon-flipbook'); ?></p>
                <?php self::price( $single ); ?>
                <a class="alfb-btn alfb-btn-light alfb-btn-block" href="<?php echo esc_url( pro_features::checkout( $single['licenses'] ) ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Get Pro', 'softicon-flipbook'); ?> &rarr;</a>
                <a class="alfb-more-plans" href="<?php echo esc_url( self::url( 'pricing' ) ); ?>"><?php esc_html_e('Plans for 3 or unlimited sites', 'softicon-flipbook'); ?></a>
            </div>
        </div>

        <section class="alfb-breakdown" data-alfb-filter>
            <header>
                <h3 id="alfb-breakdown-title"><?php esc_html_e('Feature breakdown', 'softicon-flipbook'); ?></h3>
                <label class="alfb-filter">
                    <span class="dashicons dashicons-search" aria-hidden="true"></span>
                    <span class="screen-reader-text"><?php esc_html_e('Filter features', 'softicon-flipbook'); ?></span>
                    <input type="search" placeholder="<?php esc_attr_e('Filter features…', 'softicon-flipbook'); ?>">
                </label>
            </header>
            <table class="alfb-compare" aria-labelledby="alfb-breakdown-title">
                <thead><tr><th scope="col"><?php esc_html_e('Feature', 'softicon-flipbook'); ?></th><th scope="col"><?php esc_html_e('Free', 'softicon-flipbook'); ?></th><th scope="col" class="is-pro"><?php esc_html_e('Pro', 'softicon-flipbook'); ?></th></tr></thead>
                <?php foreach ( pro_features::compare() as $group => $rows ) : ?>
                    <tbody>
                        <tr class="alfb-group"><th scope="rowgroup" colspan="3"><?php echo esc_html( $group ); ?></th></tr>
                        <?php foreach ( $rows as $label => $free ) : ?>
                            <tr>
                                <th scope="row"><?php echo esc_html( $label ); ?></th>
                                <td><?php self::mark( $free ); ?></td>
                                <td><?php self::mark( true ); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                <?php endforeach; ?>
                <tbody class="alfb-empty" hidden><tr><td colspan="3"><?php esc_html_e('No features match.', 'softicon-flipbook'); ?></td></tr></tbody>
            </table>
        </section>
        <?php
    }

    private static function mark( $yes ) {
        if ( $yes ) {
            echo '<span class="alfb-mark is-yes"><span class="dashicons dashicons-yes" aria-hidden="true"></span><span class="screen-reader-text">' . esc_html__('Included', 'softicon-flipbook') . '</span></span>';
        } else {
            echo '<span class="alfb-mark is-no"><span class="dashicons dashicons-no-alt" aria-hidden="true"></span><span class="screen-reader-text">' . esc_html__('Not included', 'softicon-flipbook') . '</span></span>';
        }
    }

    private function tab_help() {
        ?>
        <div class="alfb-grid">
            <div class="alfb-card alfb-links">
                <h3><?php esc_html_e('Get help', 'softicon-flipbook'); ?></h3>
                <a href="https://wordpress.org/support/plugin/softicon-flipbook/" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Support forum', 'softicon-flipbook'); ?></a>
                <a href="mailto:softiconai@gmail.com">softiconai@gmail.com</a>
                <p><?php esc_html_e('Tell us your WordPress version, the page with the flipbook and what you see.', 'softicon-flipbook'); ?></p>
            </div>
            <div class="alfb-card alfb-links">
                <h3><?php esc_html_e('Learn', 'softicon-flipbook'); ?></h3>
                <a href="https://wordpress.org/plugins/softicon-flipbook/#faq" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Frequently asked questions', 'softicon-flipbook'); ?></a>
                <a href="<?php echo esc_url( videos::PLAYLIST ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Video tutorials', 'softicon-flipbook'); ?></a>
                <a href="https://github.com/softiconai/softicon-flipbook" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Source code on GitHub', 'softicon-flipbook'); ?></a>
            </div>
            <div class="alfb-card alfb-links">
                <h3><?php esc_html_e('Like the plugin?', 'softicon-flipbook'); ?></h3>
                <a href="https://wordpress.org/support/plugin/softicon-flipbook/reviews/#new-post" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Leave a review', 'softicon-flipbook'); ?></a>
                <a href="https://wordpress.org/plugins/author/softiconai/" target="_blank" rel="noopener noreferrer"><?php esc_html_e('More plugins from SoftIcon', 'softicon-flipbook'); ?></a>
            </div>
        </div>
        <?php
    }
}
