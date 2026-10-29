<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

$alfb_config = ALFB_Flipbook\block::config( $attributes );

if ( ( 'pdf' === $alfb_config['source'] && ! $alfb_config['pdf'] ) || ( 'images' === $alfb_config['source'] && ! $alfb_config['images'] ) ) {
    return;
}

// colors become css variables so the stylesheet keeps the fallbacks
$alfb_style = '';
foreach ( array( 'bgColor' => '--alfb-bg', 'toolbarBg' => '--alfb-bar-bg', 'toolbarColor' => '--alfb-bar-color', 'coverColor' => '--alfb-cover' ) as $alfb_attr => $alfb_var ) {
    $alfb_color = ALFB_Flipbook\block::color( $attributes[ $alfb_attr ] ?? '' );
    if ( $alfb_color ) {
        $alfb_style .= $alfb_var . ':' . $alfb_color . ';';
    }
}

// lightbox: only a cover, button or link on the page, view.js opens the book in a popup
if ( isset( $attributes['displayMode'] ) && 'lightbox' === $attributes['displayMode'] ) {
    $alfb_lb    = ALFB_Flipbook\block::lightbox( $attributes, $alfb_config );
    $alfb_label = '' !== $alfb_lb['text'] ? $alfb_lb['text'] : __( 'Read the flipbook', 'softicon-flipbook' );
    $alfb_class = 'alfb_lb alfb_lb_' . $alfb_lb['align'] . ( 'cover' === $alfb_lb['trigger'] && ! $alfb_lb['image'] ? ' alfb_lb_draw' : '' );

    $alfb_wrapper = get_block_wrapper_attributes( array(
        'class'     => $alfb_class,
        'style'     => $alfb_style . ( 'cover' === $alfb_lb['trigger'] ? '--alfb-lb-width:' . $alfb_lb['width'] . 'px;' : '' ),
        'data-alfb' => wp_json_encode( $alfb_config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ),
    ) );
    ?>
    <div <?php echo $alfb_wrapper; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() escapes ?>>
        <?php if ( 'cover' === $alfb_lb['trigger'] ) : ?>
            <a class="alfb_lb_trigger alfb_lb_cover" href="<?php echo esc_url( $alfb_lb['href'] ); ?>" aria-haspopup="dialog"<?php echo '' === $alfb_lb['text'] ? ' aria-label="' . esc_attr( $alfb_label ) . '"' : ''; ?>>
                <span class="alfb_lb_img">
                    <?php if ( $alfb_lb['image'] ) : ?>
                        <img src="<?php echo esc_url( $alfb_lb['image'] ); ?>" alt="<?php echo esc_attr( $alfb_lb['alt'] ); ?>" loading="lazy" decoding="async">
                    <?php endif; ?>
                </span>
                <?php if ( '' !== $alfb_lb['text'] ) : ?>
                    <span class="alfb_lb_caption"><?php echo esc_html( $alfb_lb['text'] ); ?></span>
                <?php endif; ?>
            </a>
        <?php else : ?>
            <a class="alfb_lb_trigger <?php echo 'button' === $alfb_lb['trigger'] ? 'alfb_lb_button wp-element-button' : 'alfb_lb_link'; ?>" href="<?php echo esc_url( $alfb_lb['href'] ); ?>" aria-haspopup="dialog"><?php echo esc_html( $alfb_label ); ?></a>
        <?php endif; ?>
    </div>
    <?php
    return;
}

$alfb_wrapper = get_block_wrapper_attributes( array(
    'class'      => 'alfb_wrapper',
    'style'      => $alfb_style,
    // hex flags keep quotes and ampersands from breaking the attribute or JSON.parse
    'data-alfb'  => wp_json_encode( $alfb_config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ),
    'tabindex'   => '0',
    'role'       => 'region',
    'aria-label' => __( 'Flipbook', 'softicon-flipbook' ),
) );
?>
<div <?php echo $alfb_wrapper; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() escapes ?>>
    <div class="alfb_stage">
        <div class="alfb_loading"><span class="alfb_spinner"></span></div>
    </div>
    <?php if ( 'pdf' === $alfb_config['source'] ) : ?>
        <a class="alfb_fallback" href="<?php echo esc_url( $alfb_config['pdf'] ); ?>"><?php esc_html_e( 'Open the PDF', 'softicon-flipbook' ); ?></a>
    <?php endif; ?>
</div>
