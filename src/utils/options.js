import { __ } from '@wordpress/i18n';
import { icons } from './icons';
import { icons as shared } from '../vendor/softicon-tools/components/icons';

export const tabs = [
	{ name: 'general', title: __('General', 'softicon-flipbook'), className: 'general' },
	{ name: 'style', title: __('Style', 'softicon-flipbook'), className: 'style' }
];

export const pageModes = [
	{ label: __('Auto', 'softicon-flipbook'), value: 'auto', icon: icons.auto },
	{ label: __('Two pages', 'softicon-flipbook'), value: 'double', icon: icons.twoPages },
	{ label: __('One page', 'softicon-flipbook'), value: 'single', icon: icons.onePage }
];

export const sources = [
	{ label: __('PDF file', 'softicon-flipbook'), value: 'pdf', icon: icons.pdf },
	{ label: __('Images', 'softicon-flipbook'), value: 'images', icon: icons.images }
];

// tutorial videos on the SoftIcon YouTube channel (the Plugins screen links the playlist from includes/videos.php)
const LIST = '&list=PLJEAefIarF4g';
export const videos = {
	overview: 'https://www.youtube.com/watch?v=5geq69DXoN8' + LIST,
	add: 'https://www.youtube.com/watch?v=KGP_xpi8NGo' + LIST,
	design: 'https://www.youtube.com/watch?v=qqQeZQkX5ms' + LIST,
	reading: 'https://www.youtube.com/watch?v=1J7wCaUvugc' + LIST
};

export const designs = [
	{ label: __('Classic', 'softicon-flipbook'), value: 'flat', icon: icons.classic },
	{ label: __('Hardcover', 'softicon-flipbook'), value: 'hardcover', icon: icons.hardcover }
];

// the cards in the Help panel
export const helpCards = [
	{ href: 'https://www.youtube.com/playlist?list=PLJEAefIarF4g', label: __('Video tutorials', 'softicon-flipbook'), icon: shared.video },
	{ href: 'https://wordpress.org/support/plugin/softicon-flipbook/', label: __('Get support', 'softicon-flipbook'), icon: shared.support },
	{ href: 'https://wordpress.org/support/plugin/softicon-flipbook/reviews/#new-post', label: __('Rate Flipbook', 'softicon-flipbook'), icon: shared.star },
	{ href: 'https://wordpress.org/plugins/author/softiconai/', label: __('More plugins', 'softicon-flipbook'), icon: shared.plugins }
];
