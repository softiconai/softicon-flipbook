<?php
namespace ALFB_Flipbook;
if ( !defined('ABSPATH') ) { exit;}

// what SoftIcon Flipbook Pro adds; the free plugin only lists these, the code is in Pro
class pro_features {

    const CHECKOUT = 'https://checkout.freemius.com/plugin/43387/?billing_cycle=lifetime&licenses=1';

    public static function active() {
        return defined( 'ALFB_IS_PRO' ) && ALFB_IS_PRO;
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
