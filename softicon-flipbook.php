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

// the Freemius opt-in; also needed when WordPress deletes this copy while Pro is active
if ( ! class_exists( 'ALFB_Flipbook\fs_lite' ) ) {
    require_once __DIR__ . '/vendor/fs-lite/fs-lite.php';
}

if ( function_exists( 'alfb_fs' ) ) {
    // SoftIcon Flipbook Pro (or another copy) is already loaded; activating this one switches the other off
    register_activation_hook( __FILE__, function () {
        foreach ( array( 'softicon-flipbook/softicon-flipbook.php', 'softicon-flipbook-pro/softicon-flipbook.php' ) as $alfb_plugin ) {
            if ( plugin_basename( __FILE__ ) !== $alfb_plugin && is_plugin_active( $alfb_plugin ) ) {
                deactivate_plugins( $alfb_plugin );
            }
        }
    } );
} else {
    // Freemius: optional usage opt-in only, through the small client in vendor/fs-lite instead of the full SDK
    function alfb_fs() {
        global $alfb_fs;

        if ( ! isset( $alfb_fs ) ) {
            $alfb_fs = new ALFB_Flipbook\fs_lite( __FILE__, array(
                'id'         => '43387',
                'slug'       => 'softicon-flipbook',
                'public_key' => 'pk_e1f96e9b8a918f0035345996895cd',
                // the Flipbook dashboard, where the opt-in card shows
                'page'       => 'softicon-flipbook',
                'card_hook'  => 'alfb_dashboard_before',
                'icon'       => plugins_url( 'assets/images/icon-128x128.png', __FILE__ ),
            ) );
        }

        return $alfb_fs;
    }

    alfb_fs();
    do_action( 'alfb_fs_loaded' );

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
            require_once ALFB_PLUGIN_PATH . 'includes/demos.php';
            require_once ALFB_PLUGIN_PATH . 'includes/dashboard.php';

            new ALFB_Flipbook\block();
            if ( is_admin() ) {
                new ALFB_Flipbook\demos();
                new ALFB_Flipbook\dashboard();
            }

            // add-ons hook in here
            do_action( 'alfb_loaded' );
        }
    }
    ALFB_Flipbook::get_instance();
}
