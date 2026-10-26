<?php
/*
*
* Plugin Name: SoftIcon Flipbook – PDF Flipbook & Magazine Viewer
* Description: Turn any PDF or set of images into a page-turning flipbook with a block editor block. Single page on phones, two-page spreads on desktop.
* Version: 1.2.1
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
        define('ALFB_PLUGIN_VERSION', '1.2.1');
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
