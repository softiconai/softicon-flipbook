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
