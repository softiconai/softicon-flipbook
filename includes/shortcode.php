<?php
namespace ALFB_Flipbook;

if ( !defined('ABSPATH') ) { exit; }

// Books for the Classic Editor and page builders: Flipbook → Books holds one Flipbook block per book (set up in the
// block editor), and [softicon_flipbook id="123"] shows that book anywhere a shortcode works
class shortcode {

    const TYPE = 'alfb_book';

    public static function register() {
        add_action( 'init', array( __CLASS__, 'post_type' ) );
        add_shortcode( 'softicon_flipbook', array( __CLASS__, 'render' ) );
        add_filter( 'manage_' . self::TYPE . '_posts_columns', array( __CLASS__, 'columns' ) );
        add_action( 'manage_' . self::TYPE . '_posts_custom_column', array( __CLASS__, 'column' ), 10, 2 );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'copy_script' ) );
    }

    // not a page of its own on the site: a book shows only where its shortcode is
    public static function post_type() {
        register_post_type( self::TYPE, array(
            'labels'          => array(
                'name'          => __('Books', 'softicon-flipbook'),
                'singular_name' => __('Book', 'softicon-flipbook'),
                'add_new'       => __('Add a book', 'softicon-flipbook'),
                'add_new_item'  => __('Add a book', 'softicon-flipbook'),
                'edit_item'     => __('Edit book', 'softicon-flipbook'),
                'all_items'     => __('Books', 'softicon-flipbook'),
                'not_found'     => __('No books yet.', 'softicon-flipbook'),
                'not_found_in_trash' => __('No books in the trash.', 'softicon-flipbook'),
                'search_items'  => __('Search books', 'softicon-flipbook'),
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

        // the block reads its media as part of the book's own post (block::may_use())
        global $post;
        $page = $post;
        $post = $book; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- put back below
        $html = '';
        foreach ( parse_blocks( $book->post_content ) as $block ) {
            if ( 'softicon/flipbook' === $block['blockName'] ) {
                $html .= render_block( $block );
            }
        }
        $post = $page; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- the page's own post again
        return $html;
    }

    // the Books list shows each book's shortcode; a click copies it
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
