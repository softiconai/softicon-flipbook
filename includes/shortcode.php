<?php
namespace ALFB_Flipbook;

if ( !defined('ABSPATH') ) { exit; }

// Flipbooks for the Classic Editor and page builders: Flipbook → All Flipbooks holds one Flipbook block per flipbook (set up
// in the block editor), and [softicon_flipbook id="123"] shows it anywhere a shortcode works, with any of its settings
// changed for that place (options()). The post type stays alfb_book
class shortcode {

    const TYPE = 'alfb_book';

    public static function register() {
        add_action( 'init', array( __CLASS__, 'post_type' ) );
        add_shortcode( 'softicon_flipbook', array( __CLASS__, 'render' ) );
        add_filter( 'manage_' . self::TYPE . '_posts_columns', array( __CLASS__, 'columns' ) );
        add_action( 'manage_' . self::TYPE . '_posts_custom_column', array( __CLASS__, 'column' ), 10, 2 );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'copy_script' ) );
        // Elementor's editor preview: the flipbook script and styles from the start, so a Shortcode widget draws its book at once
        add_action( 'elementor/preview/enqueue_styles', array( __CLASS__, 'builder_preview' ) );
        // a flipbook is set up in its block, so it always opens in the block editor, even where the Classic Editor
        // plugin (priority 100) switches every other post type to the classic one
        add_filter( 'use_block_editor_for_post_type', array( __CLASS__, 'block_editor' ), 200, 2 );
    }

    public static function block_editor( $use, $type ) {
        return self::TYPE === $type ? true : $use;
    }

    public static function builder_preview() {
        wp_enqueue_script( generate_block_asset_handle( 'softicon/flipbook', 'viewScript' ) );
        wp_enqueue_style( generate_block_asset_handle( 'softicon/flipbook', 'style' ) );
    }

    // not a page of its own on the site: a book shows only where its shortcode is
    public static function post_type() {
        register_post_type( self::TYPE, array(
            'labels'          => array(
                'name'          => __('Flipbooks', 'softicon-flipbook'),
                'singular_name' => __('Flipbook', 'softicon-flipbook'),
                'add_new'       => __('Add a flipbook', 'softicon-flipbook'),
                'add_new_item'  => __('Add a flipbook', 'softicon-flipbook'),
                'edit_item'     => __('Edit flipbook', 'softicon-flipbook'),
                'all_items'     => __('All Flipbooks', 'softicon-flipbook'),
                'not_found'     => __('No flipbooks yet.', 'softicon-flipbook'),
                'not_found_in_trash' => __('No flipbooks in the trash.', 'softicon-flipbook'),
                'search_items'  => __('Search flipbooks', 'softicon-flipbook'),
            ),
            'public'          => false,
            'show_ui'         => true,
            'show_in_menu'    => 'softicon-flipbook',
            'show_in_rest'    => true,
            'capability_type' => 'page',
            'map_meta_cap'    => true,
            'supports'        => array( 'title', 'editor' ),
            'template'        => array( array( 'softicon/flipbook' ) ),
            'template_lock'   => 'all',
        ) );
    }

    public static function render( $atts ) {
        $id   = is_array( $atts ) && isset( $atts['id'] ) ? absint( $atts['id'] ) : 0;
        $book = $id ? get_post( $id ) : null;
        // only a published book, never another post or a draft
        if ( ! $book || self::TYPE !== $book->post_type || 'publish' !== $book->post_status ) {
            return '';
        }

        list( $options, $wrong ) = self::options( $atts );

        // the block reads its media as part of the book's own post (block::may_use())
        global $post;
        $page = $post;
        $post = $book; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- put back below
        $html = '';
        foreach ( parse_blocks( $book->post_content ) as $block ) {
            if ( 'softicon/flipbook' === $block['blockName'] ) {
                $block['attrs'] = array_merge( is_array( $block['attrs'] ) ? $block['attrs'] : array(), $options );
                $html .= render_block( $block );
            }
        }
        $post = $page; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- the page's own post again

        // a name or value that does nothing is told to whoever can edit the book, never to readers
        if ( $wrong && '' !== $html && current_user_can( 'edit_post', $book->ID ) ) {
            /* translators: %s: the shortcode options that were left out, such as "heigth, theme=blue" */
            $html = '<p class="alfb-shortcode-note" style="margin:0 0 8px;padding:8px 12px;border-left:3px solid #d97706;background:#fffbeb;color:#1e1e1e;font-size:14px">' . esc_html( sprintf( __('Flipbook shortcode: left out %s (a setting the shortcode cannot change, or a value it cannot take). Only people who can edit this flipbook see this note.', 'softicon-flipbook'), implode( ', ', $wrong ) ) ) . '</p>' . $html;
        }
        return $html;
    }

    // [softicon_flipbook id="123" height="500" theme="dark" show_download="no"]: the book's settings changed for this one
    // place, by their block names in any case, with or without _ or - (WordPress lowercases them); a bare name turns one on.
    // Not the PDF or the images, and an add-on takes out the settings that keep a book safe (alfb_shortcode_attributes)
    public static function options( $atts ) {
        $type  = \WP_Block_Type_Registry::get_instance()->get_registered( 'softicon/flipbook' );
        $names = array( 'height' => 'maxHeight', 'title' => 'bookTitle' );
        foreach ( $type ? $type->attributes : array() as $name => $schema ) {
            if ( isset( $schema['type'] ) && in_array( $schema['type'], array( 'boolean', 'number', 'string' ), true ) && ! in_array( $name, array( 'source', 'pdfId', 'pdfUrl' ), true ) ) {
                $names[ self::key( $name ) ] = $name;
            }
        }
        $names   = apply_filters( 'alfb_shortcode_attributes', $names );
        $options = array();
        $wrong   = array();
        foreach ( is_array( $atts ) ? $atts : array() as $key => $value ) {
            if ( is_int( $key ) ) {
                list( $key, $value ) = array( $value, 'true' );
            }
            $name = isset( $names[ self::key( $key ) ] ) ? $names[ self::key( $key ) ] : '';
            $kind = $name && isset( $type->attributes[ $name ]['type'] ) ? $type->attributes[ $name ]['type'] : '';
            $bool = filter_var( $value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );
            if ( 'boolean' === $kind && null !== $bool ) {
                $options[ $name ] = $bool;
            } elseif ( 'number' === $kind && is_numeric( $value ) ) {
                $options[ $name ] = $value + 0;
            } elseif ( 'string' === $kind ) {
                $options[ $name ] = (string) $value;
            } elseif ( 'id' !== $key ) {
                $wrong[] = $name ? $key . '=' . $value : $key;
            }
        }
        return array( $options, $wrong );
    }

    private static function key( $name ) {
        return strtolower( str_replace( array( '_', '-' ), '', (string) $name ) );
    }

    // the All Flipbooks list shows each flipbook's shortcode; a click copies it
    public static function columns( $columns ) {
        $date = isset( $columns['date'] ) ? array( 'date' => $columns['date'] ) : array();
        unset( $columns['date'] );
        return $columns + array( 'alfb_shortcode' => __('Shortcode', 'softicon-flipbook') ) + $date;
    }

    public static function column( $column, $id ) {
        if ( 'alfb_shortcode' === $column ) {
            printf( '<input type="text" class="alfb-shortcode" readonly value="%s" aria-label="%s" title="%s">', esc_attr( '[softicon_flipbook id="' . $id . '"]' ), esc_attr__('Shortcode', 'softicon-flipbook'), esc_attr__('Click to copy', 'softicon-flipbook') );
        }
    }

    public static function copy_script( $hook ) {
        $screen = get_current_screen();
        if ( 'edit.php' !== $hook || ! $screen || self::TYPE !== $screen->post_type ) {
            return;
        }
        wp_add_inline_style( 'common', '.column-alfb_shortcode input{width:100%;max-width:260px;font-family:Menlo,Consolas,monospace;font-size:12px;cursor:copy}' );
        wp_add_inline_script( 'common', 'document.addEventListener("click",function(e){var i=e.target.closest&&e.target.closest(".alfb-shortcode");if(!i){return;}i.select();var done=function(){i.title=' . wp_json_encode( __('Copied', 'softicon-flipbook') ) . ';};if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(i.value).then(done);}else if(document.execCommand("copy")){done();}});' );
    }
}
