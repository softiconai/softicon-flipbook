<?php
namespace ALFB_Flipbook;

if ( !defined('ABSPATH') ) { exit; }

// [softicon_flipbook] for the Classic Editor, Elementor and other builders: its options become the block's
// attributes and the block renders the book, so it looks and works exactly like the block (Pro features included).
// The block's own render checks every value again (media ids, colors, numbers).
class shortcode {

    const TAG = 'softicon_flipbook';

    // shortcode option => [ block attribute, accepted words => attribute value ]
    private static function choices() {
        return array(
            'layout'      => array( 'pageMode', array( 'auto' => 'auto', 'double' => 'double', 'two' => 'double', 'single' => 'single', 'one' => 'single' ) ),
            'design'      => array( 'bookStyle', array( 'classic' => 'flat', 'hardcover' => 'hardcover' ) ),
            'popup_style' => array( 'lightboxTrigger', array( 'cover' => 'cover', 'button' => 'button', 'link' => 'text' ) ),
            'popup_align' => array( 'lightboxAlign', array( 'left' => 'left', 'center' => 'center', 'right' => 'right' ) ),
            'align'       => array( 'align', array( 'wide' => 'wide', 'full' => 'full' ) ),
        );
    }

    private static function switches() {
        return array(
            'cover'      => 'showCover',
            'arrows'     => 'sideArrows',
            'download'   => 'showDownload',
            'fullscreen' => 'showFullscreen',
            'zoom'       => 'showZoom',
            'thumbnails' => 'showThumbnails',
            'contents'   => 'showContents',
            'links'      => 'showLinks',
            'search'     => 'showSearch',
            'share'      => 'showShare',
            'sound'      => 'flipSound',
        );
    }

    public static function register() {
        add_shortcode( self::TAG, array( __CLASS__, 'render' ) );
    }

    public static function render( $atts ) {
        $atts  = is_array( $atts ) ? array_change_key_case( $atts, CASE_LOWER ) : array();
        $attrs = array();

        // pages: a PDF (media id or link) or images (media ids in reading order)
        if ( ! empty( $atts['images'] ) ) {
            $attrs['source'] = 'images';
            $attrs['images'] = array_map( function ( $id ) { return array( 'id' => $id ); }, wp_parse_id_list( $atts['images'] ) );
        } else {
            if ( ! empty( $atts['id'] ) ) {
                $attrs['pdfId'] = absint( $atts['id'] );
            }
            if ( ! empty( $atts['pdf'] ) ) {
                $attrs['pdfUrl'] = esc_url_raw( $atts['pdf'], array( 'http', 'https' ) );
            }
        }
        if ( empty( $attrs['pdfId'] ) && empty( $attrs['pdfUrl'] ) && empty( $attrs['images'] ) ) {
            return '';
        }

        foreach ( self::choices() as $option => list( $attribute, $words ) ) {
            $word = isset( $atts[ $option ] ) ? strtolower( trim( (string) $atts[ $option ] ) ) : '';
            if ( isset( $words[ $word ] ) ) {
                $attrs[ $attribute ] = $words[ $word ];
            }
        }
        foreach ( self::switches() as $option => $attribute ) {
            if ( isset( $atts[ $option ] ) ) {
                $attrs[ $attribute ] = in_array( strtolower( trim( (string) $atts[ $option ] ) ), array( '1', 'yes', 'true', 'on' ), true );
            }
        }
        foreach ( array( 'start' => 'startPage', 'height' => 'maxHeight', 'popup_width' => 'lightboxWidth' ) as $option => $attribute ) {
            if ( isset( $atts[ $option ] ) && is_numeric( $atts[ $option ] ) ) {
                $attrs[ $attribute ] = absint( $atts[ $option ] );
            }
        }
        foreach ( array( 'background' => 'bgColor', 'cover_color' => 'coverColor', 'toolbar_background' => 'toolbarBg', 'toolbar_color' => 'toolbarColor' ) as $option => $attribute ) {
            if ( isset( $atts[ $option ] ) ) {
                $attrs[ $attribute ] = block::color( $atts[ $option ] );
            }
        }

        // a cover, button or text link that opens the book in a popup
        if ( isset( $atts['popup'] ) && in_array( strtolower( trim( (string) $atts['popup'] ) ), array( '1', 'yes', 'true', 'on' ), true ) ) {
            $attrs['displayMode'] = 'lightbox';
        }
        if ( isset( $atts['popup_text'] ) ) {
            $attrs['lightboxText'] = sanitize_text_field( $atts['popup_text'] );
        }
        if ( ! empty( $atts['popup_image'] ) ) {
            $attrs['lightboxImage'] = array( 'id' => absint( $atts['popup_image'] ) );
        }

        return render_block( array(
            'blockName'    => 'softicon/flipbook',
            'attrs'        => $attrs,
            'innerBlocks'  => array(),
            'innerHTML'    => '',
            'innerContent' => array(),
        ) );
    }
}
