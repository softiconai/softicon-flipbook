<?php
namespace ALFB_Flipbook;
if ( !defined('ABSPATH') ) { exit;}

// "Video tutorials" next to the plugin on the Plugins screen; the editor links the same videos (src/utils/options.js)
class videos {

    const PLAYLIST = 'https://www.youtube.com/playlist?list=PLJEAefIarF4g';

    public function __construct()
    {
        add_filter('plugin_row_meta', array( $this, 'row_meta' ), 10, 2);
    }

    public function row_meta($links, $file) {
        if ( plugin_basename( ALFB_PLUGIN_PATH . 'softicon-flipbook.php' ) === $file ) {
            $links[] = '<a href="' . esc_url( self::PLAYLIST ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__('Video tutorials', 'softicon-flipbook') . '</a>';
        }
        return $links;
    }
}
