<?php
namespace ALFB_Flipbook;
if ( !defined('ABSPATH') ) { exit;}

// what SoftIcon Flipbook Pro adds; the free plugin only lists these, the code is in Pro
class pro_features {

    // the Freemius product, public values only
    const PRODUCT    = '43387';
    const PUBLIC_KEY = 'pk_e1f96e9b8a918f0035345996895cd';

    public static function active() {
        return defined( 'ALFB_IS_PRO' ) && ALFB_IS_PRO;
    }

    public static function checkout( $licenses = 1 ) {
        return add_query_arg( array( 'billing_cycle' => 'lifetime', 'licenses' => $licenses ), 'https://checkout.freemius.com/plugin/' . self::PRODUCT . '/' );
    }

    // lifetime licenses, as set in Freemius
    public static function plans() {
        return array(
            array( 'licenses' => 1, 'price' => '14.99', 'title' => __('Single site', 'softicon-flipbook'), 'sites' => __('1 website', 'softicon-flipbook') ),
            array( 'licenses' => 3, 'price' => '44.99', 'title' => __('Three sites', 'softicon-flipbook'), 'sites' => __('3 websites', 'softicon-flipbook') ),
            array( 'licenses' => 'unlimited', 'price' => '199.99', 'title' => __('Unlimited', 'softicon-flipbook'), 'sites' => __('Unlimited websites', 'softicon-flipbook') ),
        );
    }

    // the feature breakdown on the Free vs Pro tab: true when the free plugin has it too
    public static function compare() {
        return array(
            __('Books and reading', 'softicon-flipbook') => array(
                __('PDF or images as pages', 'softicon-flipbook') => true,
                __('Two pages on wide screens, one page on phones', 'softicon-flipbook') => true,
                __('Classic and Hardcover designs', 'softicon-flipbook') => true,
                __('Lightbox: a cover, button or link opens the book in a popup', 'softicon-flipbook') => true,
                __('Zoom, thumbnails, table of contents and fullscreen', 'softicon-flipbook') => true,
                __('Clickable links inside the PDF', 'softicon-flipbook') => true,
                __('Links that open a page (#page=5)', 'softicon-flipbook') => true,
                __('Page turn sound and your own colors', 'softicon-flipbook') => true,
            ),
            __('Bookshelf', 'softicon-flipbook') => array(
                __('Bookshelf block with many books', 'softicon-flipbook') => false,
                __('Wood, light or no shelf', 'softicon-flipbook') => false,
                __('Your own cover image, or page 1 as the cover', 'softicon-flipbook') => false,
                __('Each book opens in a popup', 'softicon-flipbook') => false,
            ),
            __('Lead capture', 'softicon-flipbook') => array(
                __('Ask for a name and email after the pages you choose', 'softicon-flipbook') => false,
                __('Leads saved on your own site', 'softicon-flipbook') => false,
                __('Download the leads as a CSV file', 'softicon-flipbook') => false,
                __('An email for each new lead', 'softicon-flipbook') => false,
            ),
            __('Reading analytics', 'softicon-flipbook') => array(
                __('How often each book is opened', 'softicon-flipbook') => false,
                __('Which pages are read most', 'softicon-flipbook') => false,
                __('Daily chart for 7, 30 or 90 days', 'softicon-flipbook') => false,
                __('No cookies, and your own visits left out', 'softicon-flipbook') => false,
            ),
            __('PDF protection', 'softicon-flipbook') => array(
                __('No right-click, dragging or saving from the pages', 'softicon-flipbook') => false,
                __('The PDF address is kept out of the page', 'softicon-flipbook') => false,
                __('The PDF opens only on your own site', 'softicon-flipbook') => false,
            ),
        );
    }

    public static function pro_count() {
        $count = 0;
        foreach ( self::compare() as $rows ) {
            $count += count( array_filter( $rows, function ( $free ) { return ! $free; } ) );
        }
        return $count;
    }

    public static function all() {
        return array(
            'bookshelf' => array(
                'title' => __('Bookshelf block', 'softicon-flipbook'),
                'text'  => __('Many books on a wooden or light shelf. A click on a cover opens that book in a popup.', 'softicon-flipbook'),
                'icon'  => 'dashicons-book',
                'demo'  => true,
            ),
            'leads'     => array(
                'title' => __('Lead capture', 'softicon-flipbook'),
                'text'  => __('Ask for a name and email after a few pages. The leads are saved on your site and download as a CSV file.', 'softicon-flipbook'),
                'icon'  => 'dashicons-email-alt',
                'demo'  => true,
            ),
            'analytics' => array(
                'title' => __('Reading analytics', 'softicon-flipbook'),
                'text'  => __('How often each book is opened and which pages are read most, kept on your own site, with no cookies.', 'softicon-flipbook'),
                'icon'  => 'dashicons-chart-bar',
                'demo'  => false,
            ),
            'protect'   => array(
                'title' => __('PDF protection', 'softicon-flipbook'),
                'text'  => __('No download button, no right-click on the pages, and the PDF address is kept out of the page.', 'softicon-flipbook'),
                'icon'  => 'dashicons-lock',
                'demo'  => true,
            ),
        );
    }
}
