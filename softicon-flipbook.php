<?php
/*
*
* Plugin Name: SoftIcon Flipbook – PDF Flipbook & Magazine Viewer
* Description: Turn any PDF or set of images into a page-turning flipbook with a block editor block. Single page on phones, two-page spreads on desktop.
* Version: 1.4.2
* Requires at least: 6.5
* Requires PHP: 7.1
* Author: softiconai
* Author URI: https://profiles.wordpress.org/softiconai/
* License: GPLv3 or later
* License URI: https://www.gnu.org/licenses/gpl-3.0.html
* Text Domain: softicon-flipbook
* Domain Path: /languages
*
*/


if ( !defined('ABSPATH') ) { exit; }

if ( ! function_exists( 'alfb_fs' ) ) {
    // Freemius SDK: optional usage opt-in only. No plans, no license or purchase screens.
    function alfb_fs() {
        global $alfb_fs;

        if ( ! isset( $alfb_fs ) ) {
            require_once dirname( __FILE__ ) . '/vendor/freemius/start.php';

            $alfb_fs = fs_dynamic_init( array(
                'id'               => '43387',
                'slug'             => 'softicon-flipbook',
                'type'             => 'plugin',
                'public_key'       => 'pk_e1f96e9b8a918f0035345996895cd',
                'is_premium'       => false,
                'has_addons'       => false,
                'has_paid_plans'   => false,
                'is_org_compliant' => true,
                'menu'             => array(
                    'account' => false,
                    'addons'  => false,
                    'contact' => false,
                    'support' => false,
                ),
            ) );
            // the opt-in screen shows the plugin's own icon instead of downloading one
            $alfb_fs->add_filter( 'plugin_icon', function () {
                return dirname( __FILE__ ) . '/assets/images/icon-128x128.png';
            } );
        }

        return $alfb_fs;
    }

    alfb_fs();
    do_action( 'alfb_fs_loaded' );

    // the opt-in page has no menu item, so WordPress finds no title for it (a strip_tags() notice while debugging)
    add_action( 'current_screen', function ( $screen ) {
        global $title;
        if ( 'admin_page_softicon-flipbook' === $screen->id && empty( $title ) ) {
            $title = __( 'SoftIcon Flipbook', 'softicon-flipbook' ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- the page title WordPress left empty
        }
    } );
}

class ALFB_Flipbook{

    public static $instance;

    private function __construct()
    {
        $this->defined_constants();
        $this->load_classes();
    }

    public static function get_instance() {
        if( self::$instance ) {
            return self::$instance;
        }

        self::$instance = new self();
        return self::$instance;
    }

    public function defined_constants() {
        define('ALFB_PLUGIN_VERSION', '1.4.2');
        define('ALFB_PLUGIN_PATH', plugin_dir_path(__FILE__));
        define('ALFB_PLUGIN_URL', plugin_dir_url(__FILE__));
    }

    public function load_classes() {

        require_once ALFB_PLUGIN_PATH . 'includes/block.php';
        require_once ALFB_PLUGIN_PATH . 'includes/videos.php';

        new ALFB_Flipbook\block();
        new ALFB_Flipbook\videos();

        // add-ons such as SoftIcon Flipbook Pro hook in here
        do_action( 'alfb_loaded' );
    }
}
ALFB_Flipbook::get_instance();
