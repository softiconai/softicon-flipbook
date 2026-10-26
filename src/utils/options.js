import { __ } from '@wordpress/i18n';

export const tabs = [
	{ name: 'general', title: __('General', 'softicon-flipbook'), className: 'general' },
	{ name: 'style', title: __('Style', 'softicon-flipbook'), className: 'style' }
];

export const pageModes = [
	{ label: __('Auto – two pages, one on phones', 'softicon-flipbook'), value: 'auto' },
	{ label: __('Always two pages', 'softicon-flipbook'), value: 'double' },
	{ label: __('Always one page', 'softicon-flipbook'), value: 'single' }
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
	{ label: __('Classic', 'softicon-flipbook'), value: 'flat' },
	{ label: __('Hardcover book', 'softicon-flipbook'), value: 'hardcover' }
];

export const sources = [
	{ label: __('PDF file', 'softicon-flipbook'), value: 'pdf' },
	{ label: __('Images', 'softicon-flipbook'), value: 'images' }
];
