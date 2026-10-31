<?php
namespace ALFB_Flipbook;
if ( !defined('ABSPATH') ) { exit;}

// the Flipbook admin page: welcome, live demos, free vs Pro and help; Pro adds its own tabs
class dashboard {

    const PAGE     = 'softicon-flipbook';
    const PLAYLIST = 'https://www.youtube.com/playlist?list=PLJEAefIarF4g';
    const CACHE    = 'alfb_freemius';

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
        if ( false === $data && $fetch && ! self::is_pro() && function_exists( 'alfb_fs' ) && method_exists( alfb_fs(), 'pricing' ) ) {
            $data = self::parse( alfb_fs()->pricing() );
            set_transient( self::CACHE, $data, $data['error'] ? HOUR_IN_SECONDS : 12 * HOUR_IN_SECONDS );
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

    public static function checkout_url( $pro, $price ) {
        return add_query_arg( array( 'plan_id' => $pro['id'], 'licenses' => $price['licenses'], 'billing_cycle' => $price['cycle'] ), 'https://checkout.freemius.com/plugin/' . alfb_fs()->id() . '/' );
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
        if ( ! self::is_pro() ) {
            $links[] = '<a href="' . esc_url( self::url( 'pro' ) ) . '" style="color:#b45309;font-weight:600">' . esc_html__('Free vs Pro', 'softicon-flipbook') . '</a>';
        }
        return $links;
    }

    public function row_meta( $links, $file ) {
        if ( plugin_basename( ALFB_PLUGIN_PATH . 'softicon-flipbook.php' ) === $file ) {
            $links[] = '<a href="' . esc_url( self::url() . '#alfb-videos' ) . '">' . esc_html__('Video tutorials', 'softicon-flipbook') . '</a>';
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
        wp_enqueue_script( 'alfb-dashboard', ALFB_PLUGIN_URL . 'build/dashboard.js', $script['dependencies'], $script['version'], array( 'in_footer' => true, 'strategy' => 'defer' ) );
        // the Freemius checkout popup (its script is bundled in build/dashboard.js)
        if ( ! self::is_pro() && method_exists( alfb_fs(), 'public_key' ) ) {
            wp_add_inline_script( 'alfb-dashboard', 'window.alfbCheckout = ' . wp_json_encode( array(
                'product' => alfb_fs()->id(),
                'key'     => alfb_fs()->public_key(),
                'image'   => ALFB_PLUGIN_URL . 'assets/images/icon-128x128.png',
            ) ) . ';', 'before' );
        }
        // the demos are real flipbooks
        wp_enqueue_style( generate_block_asset_handle( 'softicon/flipbook', 'style' ) );
        wp_enqueue_script( generate_block_asset_handle( 'softicon/flipbook', 'viewScript' ) );
        do_action( 'alfb_dashboard_assets' );
    }

    public static function tabs() {
        $pro  = self::is_pro();
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
        $pro  = self::is_pro();
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
                <?php do_action( 'alfb_dashboard_before', $tab ); ?>
                <?php
                if ( method_exists( $this, 'tab_' . $tab ) ) {
                    call_user_func( array( $this, 'tab_' . $tab ) );
                }
                do_action( 'alfb_dashboard_' . $tab );
                ?>
            </div>

            <dialog class="alfb-video-popup" aria-label="<?php esc_attr_e('Video tutorial', 'softicon-flipbook'); ?>">
                <button type="button" class="alfb-video-close" aria-label="<?php esc_attr_e('Close', 'softicon-flipbook'); ?>"><span class="dashicons dashicons-no-alt" aria-hidden="true"></span></button>
                <div class="alfb-video-frame"></div>
            </dialog>
        </div>
        <?php
    }

    private function tab_welcome() {
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
            <a class="alfb-hero-video" href="<?php echo esc_url( self::PLAYLIST ); ?>" data-alfb-video target="_blank" rel="noopener noreferrer">
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

        <h2 class="alfb-title" id="alfb-videos"><?php esc_html_e('Video tutorials', 'softicon-flipbook'); ?></h2>
        <div class="alfb-grid alfb-videos">
            <?php foreach ( self::videos() as $url => $title ) : ?>
                <a class="alfb-card alfb-video" href="<?php echo esc_url( $url ); ?>" data-alfb-video target="_blank" rel="noopener noreferrer">
                    <span class="dashicons dashicons-video-alt3" aria-hidden="true"></span><?php echo esc_html( $title ); ?>
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

    // a price with its currency and how often it is paid
    private static function price( $price ) {
        $symbols = array( 'usd' => '$', 'eur' => '€', 'gbp' => '£', 'aud' => 'A$', 'cad' => 'C$' );
        $cycles  = array(
            'lifetime' => __('one-time', 'softicon-flipbook'),
            'annual'   => __('per year', 'softicon-flipbook'),
            'monthly'  => __('per month', 'softicon-flipbook'),
        );
        $symbol = isset( $symbols[ $price['currency'] ] ) ? $symbols[ $price['currency'] ] : strtoupper( $price['currency'] ) . ' ';
        ?>
        <p class="alfb-price"><sup><?php echo esc_html( $symbol ); ?></sup><?php echo esc_html( number_format_i18n( $price['price'], floor( $price['price'] ) == $price['price'] ? 0 : 2 ) ); ?><span><?php echo esc_html( $cycles[ $price['cycle'] ] ); ?></span></p>
        <?php
    }

    private static function sites( $licenses ) {
        /* translators: %d: number of websites */
        return 'unlimited' === $licenses ? __('Unlimited websites', 'softicon-flipbook') : sprintf( _n( '%d website', '%d websites', $licenses, 'softicon-flipbook' ), $licenses );
    }

    private static function pro_button( $pro, $price, $class ) {
        ?>
        <a class="alfb-btn alfb-btn-block <?php echo esc_attr( $class ); ?>" href="<?php echo esc_url( self::checkout_url( $pro, $price ) ); ?>" data-alfb-checkout="<?php echo esc_attr( $price['licenses'] ); ?>" data-alfb-plan="<?php echo esc_attr( $pro['id'] ); ?>" data-alfb-cycle="<?php echo esc_attr( $price['cycle'] ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Get Pro', 'softicon-flipbook'); ?> &rarr;</a>
        <?php
    }

    // shown while Freemius has no paid plan to list, or cannot be reached
    private static function no_plans( $data ) {
        ?>
        <div class="alfb-card alfb-no-plans">
            <span class="dashicons dashicons-clock" aria-hidden="true"></span>
            <p><?php echo $data['error'] ? esc_html__('The Pro plans could not be loaded right now. Please try again later.', 'softicon-flipbook') : esc_html__('SoftIcon Flipbook Pro is coming soon.', 'softicon-flipbook'); ?></p>
        </div>
        <?php
    }

    private function tab_pricing() {
        $data = self::freemius();
        $pro  = $data['pro'];
        $once = $pro && 'lifetime' === $pro['prices'][0]['cycle'];
        ?>
        <div class="alfb-intro">
            <span class="alfb-eyebrow"><?php esc_html_e('Pricing', 'softicon-flipbook'); ?></span>
            <h2><?php echo $once ? esc_html__('Pay once, use it for life', 'softicon-flipbook') : esc_html__('Pick your plan', 'softicon-flipbook'); ?></h2>
            <p><?php esc_html_e('Every plan has all Pro features; pick how many websites you need.', 'softicon-flipbook'); ?></p>
        </div>
        <?php if ( ! $pro ) : ?>
            <?php self::no_plans( $data ); ?>
        <?php else : ?>
            <div class="alfb-plans alfb-plans-3">
                <?php foreach ( $pro['prices'] as $price ) : ?>
                    <div class="alfb-plan">
                        <span class="alfb-tag"><?php echo esc_html( self::sites( $price['licenses'] ) ); ?></span>
                        <h3><?php echo esc_html( $pro['title'] ); ?></h3>
                        <?php self::price( $price ); ?>
                        <?php self::pro_button( $pro, $price, 'alfb-btn-teal' ); ?>
                        <ul class="alfb-checks">
                            <li><?php echo esc_html( self::sites( $price['licenses'] ) ); ?></li>
                            <li><?php esc_html_e('Every free feature', 'softicon-flipbook'); ?></li>
                            <?php foreach ( self::pro_only( $data ) as $feature ) : ?>
                                <li><?php echo esc_html( $feature['title'] ); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <p class="alfb-note">
            <?php if ( $data['money_back'] ) : ?>
                <?php
                /* translators: %d: number of days */
                printf( esc_html__('%d-day money-back guarantee.', 'softicon-flipbook'), absint( $data['money_back'] ) );
                ?>
            <?php endif; ?>
            <?php esc_html_e('Secure checkout by Freemius. Pro replaces the free plugin and keeps every book you made.', 'softicon-flipbook'); ?>
            <a href="<?php echo esc_url( self::url( 'pro' ) ); ?>"><?php esc_html_e('Compare Free and Pro', 'softicon-flipbook'); ?></a>
        </p>
        <?php
    }

    private function tab_pro() {
        // Pro shows its settings here instead (alfb_dashboard_pro)
        if ( self::is_pro() ) {
            return;
        }
        $data     = self::freemius();
        $pro      = $data['pro'];
        $pro_only = self::pro_only( $data );
        $sections = array(
            __('In Free and Pro', 'softicon-flipbook') => array( $data['free'], true ),
            __('Only in Pro', 'softicon-flipbook')     => array( $pro_only, false ),
        );
        ?>
        <div class="alfb-intro">
            <span class="alfb-eyebrow"><?php esc_html_e('Compare', 'softicon-flipbook'); ?></span>
            <h2><?php esc_html_e('Free vs Pro at a glance', 'softicon-flipbook'); ?></h2>
            <?php if ( $pro_only ) : ?>
                <p><?php
                    /* translators: %s: number of features */
                    printf( esc_html__('See what you get when you upgrade. %s features are only in Pro.', 'softicon-flipbook'), '<strong>' . esc_html( number_format_i18n( count( $pro_only ) ) ) . '</strong>' );
                ?></p>
            <?php endif; ?>
        </div>

        <div class="alfb-plans">
            <div class="alfb-plan">
                <span class="alfb-tag"><?php esc_html_e('Free', 'softicon-flipbook'); ?></span>
                <h3><?php esc_html_e('Free', 'softicon-flipbook'); ?></h3>
                <p><?php esc_html_e('Free forever, everything you need to put books on your site.', 'softicon-flipbook'); ?></p>
                <p class="alfb-price"><sup>$</sup>0<span><?php esc_html_e('forever', 'softicon-flipbook'); ?></span></p>
                <span class="alfb-have"><span class="dashicons dashicons-yes" aria-hidden="true"></span><?php esc_html_e('You already have it', 'softicon-flipbook'); ?></span>
            </div>
            <?php if ( $pro ) : ?>
                <div class="alfb-plan is-pro">
                    <span class="alfb-tag"><?php esc_html_e('Pro', 'softicon-flipbook'); ?></span>
                    <h3><?php echo esc_html( $pro['title'] ); ?></h3>
                    <?php if ( $pro['text'] ) : ?><p><?php echo esc_html( $pro['text'] ); ?></p><?php endif; ?>
                    <?php self::price( $pro['prices'][0] ); ?>
                    <?php self::pro_button( $pro, $pro['prices'][0], 'alfb-btn-light' ); ?>
                    <?php if ( count( $pro['prices'] ) > 1 ) : ?>
                        <a class="alfb-more-plans" href="<?php echo esc_url( self::url( 'pricing' ) ); ?>"><?php esc_html_e('Plans for more websites', 'softicon-flipbook'); ?></a>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>

        <?php if ( ! $pro ) : ?>
            <?php self::no_plans( $data ); ?>
        <?php endif; ?>

        <?php if ( $data['free'] || $pro_only ) : ?>
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
                    <?php foreach ( $sections as $group => $section ) : ?>
                        <?php if ( $section[0] ) : ?>
                            <tbody>
                                <tr class="alfb-group"><th scope="rowgroup" colspan="3"><?php echo esc_html( $group ); ?></th></tr>
                                <?php foreach ( $section[0] as $feature ) : ?>
                                    <tr>
                                        <th scope="row"><?php echo esc_html( $feature['title'] ); ?><?php if ( $feature['text'] ) : ?><small><?php echo esc_html( $feature['text'] ); ?></small><?php endif; ?></th>
                                        <td><?php self::mark( $section[1] ); ?></td>
                                        <td><?php self::mark( true ); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        <?php endif; ?>
                    <?php endforeach; ?>
                    <tbody class="alfb-empty" hidden><tr><td colspan="3"><?php esc_html_e('No features match.', 'softicon-flipbook'); ?></td></tr></tbody>
                </table>
            </section>
        <?php endif; ?>
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
                <a href="<?php echo esc_url( self::PLAYLIST ); ?>" data-alfb-video target="_blank" rel="noopener noreferrer"><?php esc_html_e('Video tutorials', 'softicon-flipbook'); ?></a>
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
