<?php
namespace ALFB_Flipbook;
if ( !defined('ABSPATH') ) { exit;}

// ready-made flipbooks shown live in the dashboard; "Create a page" copies one into a draft page
class demos {

    const ACTION = 'alfb_create_demo';
    const MEDIA  = 'alfb_demo_media';

    public function __construct()
    {
        add_action('admin_post_' . self::ACTION, array( $this, 'create_page' ));
    }

    // the sample PDFs in assets/demo, made for the plugin (Lunora Living is a made-up brand)
    public static function files() {
        return apply_filters( 'alfb_demo_files', array(
            'spring' => array( 'file' => 'spring-catalog.pdf', 'title' => __('Lunora Spring Living 2026', 'softicon-flipbook') ),
            'guide'  => array( 'file' => 'room-guide.pdf', 'title' => __('Lunora Room Guide 2026', 'softicon-flipbook') ),
        ) );
    }

    // each demo is one or more flipbook blocks; 'pdf' names a file above, the rest are block attributes
    public static function all() {
        $demos = array(
            'classic'   => array(
                'title'  => __('Classic book', 'softicon-flipbook'),
                'text'   => __('The default look: two pages side by side, one page on phones, and the full toolbar.', 'softicon-flipbook'),
                'blocks' => array( array( 'pdf' => 'spring', 'maxHeight' => 420 ) ),
            ),
            'hardcover' => array(
                'title'  => __('Hardcover', 'softicon-flipbook'),
                'text'   => __('Pages inside a cover, with the stack of page edges, a shadow at the spine and large arrows.', 'softicon-flipbook'),
                'blocks' => array( array( 'pdf' => 'spring', 'bookStyle' => 'hardcover', 'sideArrows' => true, 'coverColor' => '#0f766e', 'maxHeight' => 420 ) ),
            ),
            'guide'     => array(
                'title'  => __('Chapters and links', 'softicon-flipbook'),
                'text'   => __('A PDF with bookmarks gets a table of contents, and the links inside it can be clicked.', 'softicon-flipbook'),
                'blocks' => array( array( 'pdf' => 'guide', 'maxHeight' => 420 ) ),
            ),
            'covers'    => array(
                'title'  => __('Covers that open a popup', 'softicon-flipbook'),
                'text'   => __('Only the covers show on the page. A click opens the book over the page, and it loads only then.', 'softicon-flipbook'),
                'row'    => true,
                'blocks' => array(
                    array( 'pdf' => 'spring', 'displayMode' => 'lightbox', 'lightboxText' => __('Spring Living 2026', 'softicon-flipbook'), 'lightboxWidth' => 170 ),
                    array( 'pdf' => 'guide', 'displayMode' => 'lightbox', 'lightboxText' => __('Room Guide 2026', 'softicon-flipbook'), 'lightboxWidth' => 170, 'bookStyle' => 'hardcover', 'sideArrows' => true ),
                ),
            ),
            'button'    => array(
                'title'  => __('A button that opens a popup', 'softicon-flipbook'),
                'text'   => __('A theme-styled button, or a plain text link, opens the book in a popup.', 'softicon-flipbook'),
                'blocks' => array( array( 'pdf' => 'guide', 'displayMode' => 'lightbox', 'lightboxTrigger' => 'button', 'lightboxText' => __('Open the room guide', 'softicon-flipbook') ) ),
            ),
        );

        // the Pro demos; SoftIcon Flipbook Pro replaces these with live ones
        foreach ( pro_features::all() as $key => $feature ) {
            if ( ! empty( $feature['demo'] ) ) {
                $demos[ 'pro-' . $key ] = array( 'title' => $feature['title'], 'text' => $feature['text'], 'pro' => true, 'icon' => $feature['icon'] );
            }
        }

        return apply_filters( 'alfb_demos', $demos );
    }

    // block markup for a demo, with the PDFs from the plugin folder or from the Media Library
    public static function markup( $demo, $pdfs ) {
        $blocks = array();
        foreach ( $demo['blocks'] as $attrs ) {
            $name = isset( $attrs['block'] ) ? $attrs['block'] : 'softicon/flipbook';
            unset( $attrs['block'] );
            if ( isset( $attrs['pdf'] ) ) {
                $pdf = $pdfs[ $attrs['pdf'] ];
                unset( $attrs['pdf'] );
                $attrs = array_merge( array( 'pdfId' => $pdf['id'], 'pdfUrl' => $pdf['url'] ), $attrs );
            }
            $blocks[] = serialize_block( array( 'blockName' => $name, 'attrs' => $attrs, 'innerBlocks' => array(), 'innerHTML' => '', 'innerContent' => array() ) );
        }
        return apply_filters( 'alfb_demo_markup', implode( "\n", $blocks ), $demo, $pdfs );
    }

    // the sample PDFs as plugin URLs, for the live previews
    public static function preview_pdfs() {
        $pdfs = array();
        foreach ( self::files() as $key => $file ) {
            $pdfs[ $key ] = array( 'id' => 0, 'url' => ALFB_PLUGIN_URL . 'assets/demo/' . $file['file'] );
        }
        return $pdfs;
    }

    public static function create_url( $key ) {
        return wp_nonce_url( admin_url( 'admin-post.php?action=' . self::ACTION . '&demo=' . rawurlencode( $key ) ), self::ACTION );
    }

    // copies the sample PDFs into the Media Library once, so a demo page keeps working without the plugin folder
    private static function media_pdfs() {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $saved = get_option( self::MEDIA, array() );
        $saved = is_array( $saved ) ? $saved : array();
        $pdfs  = array();
        foreach ( self::files() as $key => $file ) {
            $id = isset( $saved[ $key ] ) ? absint( $saved[ $key ] ) : 0;
            if ( ! $id || 'application/pdf' !== get_post_mime_type( $id ) ) {
                $tmp = wp_tempnam( $file['file'] );
                $src = ( isset( $file['path'] ) ? $file['path'] : ALFB_PLUGIN_PATH . 'assets/demo/' ) . $file['file'];
                if ( ! $tmp || ! copy( $src, $tmp ) ) {
                    wp_delete_file( $tmp );
                    return new \WP_Error( 'alfb_demo', __('The sample PDF could not be copied to the Media Library.', 'softicon-flipbook') );
                }
                $id = media_handle_sideload( array( 'name' => $file['file'], 'tmp_name' => $tmp ), 0, $file['title'] );
                if ( is_wp_error( $id ) ) {
                    wp_delete_file( $tmp );
                    return $id;
                }
                $saved[ $key ] = $id;
            }
            $pdfs[ $key ] = array( 'id' => $id, 'url' => wp_get_attachment_url( $id ) );
        }
        update_option( self::MEDIA, $saved, false );
        return $pdfs;
    }

    public function create_page() {
        check_admin_referer( self::ACTION );
        if ( ! current_user_can( 'edit_pages' ) || ! current_user_can( 'upload_files' ) ) {
            wp_die( esc_html__('You are not allowed to create pages.', 'softicon-flipbook'), '', array( 'response' => 403 ) );
        }

        $key   = isset( $_GET['demo'] ) ? sanitize_key( wp_unslash( $_GET['demo'] ) ) : '';
        $demos = self::all();
        if ( ! isset( $demos[ $key ]['blocks'] ) ) {
            wp_die( esc_html__('This demo is not available.', 'softicon-flipbook'), '', array( 'response' => 404 ) );
        }

        $pdfs = self::media_pdfs();
        if ( is_wp_error( $pdfs ) ) {
            wp_die( esc_html( $pdfs->get_error_message() ) );
        }

        $demo    = $demos[ $key ];
        $content = self::markup( $demo, $pdfs );
        if ( ! empty( $demo['row'] ) ) {
            $content = "<!-- wp:group {\"layout\":{\"type\":\"flex\",\"flexWrap\":\"wrap\",\"justifyContent\":\"center\"}} -->\n<div class=\"wp-block-group\">" . $content . "</div>\n<!-- /wp:group -->";
        }

        $id = wp_insert_post( array(
            'post_type'    => 'page',
            'post_status'  => 'draft',
            /* translators: %s: demo name */
            'post_title'   => sprintf( __('Flipbook demo: %s', 'softicon-flipbook'), $demo['title'] ),
            'post_content' => $content,
        ), true );
        if ( is_wp_error( $id ) ) {
            wp_die( esc_html( $id->get_error_message() ) );
        }

        wp_safe_redirect( admin_url( 'post.php?post=' . $id . '&action=edit' ) );
        exit;
    }
}
