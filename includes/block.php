<?php
namespace ALFB_Flipbook;
if ( !defined('ABSPATH') ) { exit;}

class block {

    public function __construct()
    {
        add_action('init', array( $this, 'register' ));
        add_filter('block_editor_settings_all', array( $this, 'no_inspector_tabs' ));
    }

    // the block has its own General and Style tabs; without this WordPress adds its Settings/Styles tabs above them for the margin control
    public function no_inspector_tabs( $settings ) {
        $tabs = isset( $settings['blockInspectorTabs'] ) && is_array( $settings['blockInspectorTabs'] ) ? $settings['blockInspectorTabs'] : array();
        $tabs['softicon/flipbook'] = false;
        $settings['blockInspectorTabs'] = $tabs;
        return $settings;
    }

    public function register() {
        register_block_type( ALFB_PLUGIN_PATH . 'build' );

        // the real build url for the lazy chunks and pdf.js files, JS combine plugins move view.js elsewhere
        $build_url = 'window.alfbBuildUrl = ' . wp_json_encode( ALFB_PLUGIN_URL . 'build/' ) . ';';
        foreach ( array( 'viewScript', 'editorScript' ) as $field ) {
            wp_add_inline_script( generate_block_asset_handle( 'softicon/flipbook', $field ), $build_url, 'before' );
        }
    }

    // the PDF url, preferring the media library file so a changed site url still works
    public static function pdf_url( $attributes ) {
        $id = isset( $attributes['pdfId'] ) ? absint( $attributes['pdfId'] ) : 0;
        if ( $id && 'application/pdf' === get_post_mime_type( $id ) ) {
            $url = wp_get_attachment_url( $id );
            if ( $url ) {
                return $url;
            }
        }

        return isset( $attributes['pdfUrl'] ) ? esc_url_raw( $attributes['pdfUrl'] ) : '';
    }

    public static function images( $attributes ) {
        $images = array();
        $items  = isset( $attributes['images'] ) && is_array( $attributes['images'] ) ? $attributes['images'] : array();

        // one query for every page's alt text instead of one per image
        $ids = array_filter( array_map( function ( $item ) { return isset( $item['id'] ) ? absint( $item['id'] ) : 0; }, $items ) );
        if ( $ids ) {
            update_meta_cache( 'post', $ids );
        }

        foreach ( $items as $item ) {
            $id = isset( $item['id'] ) ? absint( $item['id'] ) : 0;
            if ( $id && wp_attachment_is_image( $id ) ) {
                $src = wp_get_attachment_image_src( $id, 'full' );
                if ( $src ) {
                    // smaller copy for the thumbnail panel
                    $thumb    = wp_get_attachment_image_src( $id, 'medium' );
                    $images[] = array(
                        'url'    => $src[0],
                        'thumb'  => $thumb ? $thumb[0] : $src[0],
                        'width'  => (int) $src[1],
                        'height' => (int) $src[2],
                        'alt'    => (string) get_post_meta( $id, '_wp_attachment_image_alt', true ),
                    );
                }
                continue;
            }

            if ( ! empty( $item['url'] ) ) {
                $images[] = array(
                    'url'    => esc_url_raw( $item['url'] ),
                    'width'  => isset( $item['width'] ) ? absint( $item['width'] ) : 0,
                    'height' => isset( $item['height'] ) ? absint( $item['height'] ) : 0,
                    'alt'    => isset( $item['alt'] ) ? sanitize_text_field( $item['alt'] ) : '',
                );
            }
        }

        return $images;
    }

    // hex, rgb(a), hsl(a) or a preset var(), anything else is dropped
    public static function color( $value ) {
        $value = is_string( $value ) ? trim( $value ) : '';
        if ( preg_match( '/^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([0-9.,%\s\/]+\)|var\(--[a-z0-9-]+\))$/i', $value ) ) {
            return $value;
        }
        return '';
    }

    // settings read by view.js, the same shape the editor preview builds in JS
    public static function config( $attributes ) {
        $source = ( isset( $attributes['source'] ) && 'images' === $attributes['source'] ) ? 'images' : 'pdf';
        $style  = isset( $attributes['bookStyle'] ) && 'hardcover' === $attributes['bookStyle'] ? 'hardcover' : 'flat';
        $mode   = isset( $attributes['pageMode'] ) && in_array( $attributes['pageMode'], array( 'auto', 'double', 'single' ), true ) ? $attributes['pageMode'] : 'auto';

        $config = array(
            'source'         => $source,
            'pdf'            => 'pdf' === $source ? self::pdf_url( $attributes ) : '',
            'images'         => 'images' === $source ? self::images( $attributes ) : array(),
            'pageMode'       => $mode,
            'bookStyle'      => $style,
            'sideArrows'     => ! empty( $attributes['sideArrows'] ),
            'showCover'      => ! isset( $attributes['showCover'] ) || (bool) $attributes['showCover'],
            'startPage'      => isset( $attributes['startPage'] ) ? max( 1, absint( $attributes['startPage'] ) ) : 1,
            'maxHeight'      => isset( $attributes['maxHeight'] ) ? min( 2000, max( 200, absint( $attributes['maxHeight'] ) ) ) : 700,
            'showDownload'   => ! isset( $attributes['showDownload'] ) || (bool) $attributes['showDownload'],
            'showFullscreen' => ! isset( $attributes['showFullscreen'] ) || (bool) $attributes['showFullscreen'],
            'showZoom'       => ! isset( $attributes['showZoom'] ) || (bool) $attributes['showZoom'],
            'showThumbnails' => ! isset( $attributes['showThumbnails'] ) || (bool) $attributes['showThumbnails'],
            'flipSound'      => ! isset( $attributes['flipSound'] ) || (bool) $attributes['flipSound'],
        );

        return apply_filters( 'alfb_config', $config, $attributes );
    }

    // what opens the lightbox; the cover is the chosen image, else WordPress's preview of the PDF
    // (servers with Imagick make one on upload), else the first page image, else view.js draws page 1
    public static function lightbox( $attributes, $config ) {
        $trigger = isset( $attributes['lightboxTrigger'] ) && in_array( $attributes['lightboxTrigger'], array( 'cover', 'button', 'text' ), true ) ? $attributes['lightboxTrigger'] : 'cover';
        $align   = isset( $attributes['lightboxAlign'] ) && in_array( $attributes['lightboxAlign'], array( 'left', 'center', 'right' ), true ) ? $attributes['lightboxAlign'] : 'center';
        $text    = isset( $attributes['lightboxText'] ) ? trim( sanitize_text_field( $attributes['lightboxText'] ) ) : '';

        $image = '';
        $alt   = '';
        if ( 'cover' === $trigger ) {
            $chosen = isset( $attributes['lightboxImage'] ) && is_array( $attributes['lightboxImage'] ) ? $attributes['lightboxImage'] : array();
            $id     = isset( $chosen['id'] ) ? absint( $chosen['id'] ) : 0;
            if ( $id && wp_attachment_is_image( $id ) ) {
                $src   = wp_get_attachment_image_src( $id, 'large' );
                $image = $src ? $src[0] : '';
                $alt   = (string) get_post_meta( $id, '_wp_attachment_image_alt', true );
            } elseif ( ! empty( $chosen['url'] ) ) {
                $image = esc_url_raw( $chosen['url'] );
            } elseif ( 'pdf' === $config['source'] && ! empty( $attributes['pdfId'] ) ) {
                $src   = wp_get_attachment_image_src( absint( $attributes['pdfId'] ), 'large' );
                $image = $src ? $src[0] : '';
            } elseif ( 'images' === $config['source'] ) {
                $image = $config['images'][0]['url'];
                $alt   = $config['images'][0]['alt'];
            }
        }

        return array(
            'trigger' => $trigger,
            'align'   => $align,
            'text'    => $text,
            'image'   => $image,
            'alt'     => $alt,
            'width'   => isset( $attributes['lightboxWidth'] ) ? min( 600, max( 120, absint( $attributes['lightboxWidth'] ) ) ) : 260,
            // without JavaScript the trigger still opens the PDF or the first page
            'href'    => 'pdf' === $config['source'] ? $config['pdf'] : $config['images'][0]['url'],
        );
    }
}
