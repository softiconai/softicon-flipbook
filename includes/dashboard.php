<?php
namespace ALFB_Flipbook;
if ( !defined('ABSPATH') ) { exit;}

// the Flipbook admin page; src/dashboard (React) draws it from config(), Pro adds its own tabs in PHP
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
        wp_set_script_translations( 'alfb-dashboard', 'softicon-flipbook', ALFB_PLUGIN_PATH . 'languages' );
        wp_add_inline_script( 'alfb-dashboard', 'window.alfbDashboard = ' . wp_json_encode( self::config() ) . ';', 'before' );
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

    private static function tab() {
        $tabs = self::tabs();
        $tab  = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'welcome'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only picks the tab to show
        return isset( $tabs[ $tab ] ) ? $tab : 'welcome';
    }

    // everything the React dashboard shows; the Freemius plans and the demo books only on the tabs that use them
    private static function config() {
        $tab    = self::tab();
        $tabs   = array();
        foreach ( self::tabs() as $key => $label ) {
            $tabs[] = array( 'key' => $key, 'label' => $label, 'url' => self::url( 'welcome' === $key ? '' : $key ) );
        }
        $videos = array();
        foreach ( self::videos() as $url => $title ) {
            $videos[] = array( 'url' => $url, 'title' => $title );
        }

        $config = array(
            'tab'     => $tab,
            'tabs'    => $tabs,
            'pro'     => self::is_pro(),
            'version' => ALFB_PLUGIN_VERSION,
            'icon'    => ALFB_PLUGIN_URL . 'assets/images/icon-128x128.png',
            'videos'  => $videos,
            'urls'    => array(
                'dashboard' => self::url(),
                'demos'     => self::url( 'demos' ),
                'pricing'   => self::url( 'pricing' ),
                'compare'   => self::url( 'pro' ),
                'newPage'   => admin_url( 'post-new.php?post_type=page' ),
                'playlist'  => self::PLAYLIST,
            ),
        );

        if ( ! self::is_pro() && in_array( $tab, array( 'pricing', 'pro' ), true ) ) {
            $data                 = self::freemius();
            $data['pro_only']     = self::pro_only( $data );
            $config['freemius']   = $data;
            $config['checkout']   = array(
                'product' => alfb_fs()->id(),
                'key'     => alfb_fs()->public_key(),
                'image'   => ALFB_PLUGIN_URL . 'assets/images/icon-128x128.png',
                'base'    => 'https://checkout.freemius.com/plugin/' . alfb_fs()->id() . '/',
            );
        }

        if ( 'demos' === $tab ) {
            $pdfs  = demos::preview_pdfs();
            $items = array();
            foreach ( demos::all() as $key => $demo ) {
                $item = array( 'key' => $key, 'title' => $demo['title'], 'text' => $demo['text'], 'pro' => ! empty( $demo['pro'] ), 'row' => ! empty( $demo['row'] ) );
                if ( isset( $demo['blocks'] ) ) {
                    // the block's render.php escapes everything in this markup
                    $item['html']   = do_blocks( demos::markup( $demo, $pdfs ) );
                    $item['create'] = demos::create_url( $key );
                }
                $items[] = $item;
            }
            $config['demos'] = $items;
        }

        return $config;
    }

    // React fills the two empty boxes; the opt-in card and the Pro tabs print their own HTML around the tab
    public function render() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        $tab = self::tab();
        ?>
        <div class="alfb-dash">
            <div id="alfb-dashboard-head"></div>
            <div class="wrap alfb-dash-body">
                <h1 class="screen-reader-text"><?php echo esc_html( self::is_pro() ? __('SoftIcon Flipbook Pro', 'softicon-flipbook') : __('SoftIcon Flipbook', 'softicon-flipbook') ); ?></h1>
                <hr class="wp-header-end">
                <?php do_action( 'alfb_dashboard_before', $tab ); ?>
                <div id="alfb-dashboard-tab"></div>
                <?php do_action( 'alfb_dashboard_' . $tab ); ?>
                <noscript><p><?php esc_html_e('The Flipbook dashboard needs JavaScript.', 'softicon-flipbook'); ?></p></noscript>
            </div>
        </div>
        <?php
    }
}
