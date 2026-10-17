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

export const designs = [
	{ label: __('Classic', 'softicon-flipbook'), value: 'flat' },
	{ label: __('Hardcover book', 'softicon-flipbook'), value: 'hardcover' }
];

export const sources = [
	{ label: __('PDF file', 'softicon-flipbook'), value: 'pdf' },
	{ label: __('Images', 'softicon-flipbook'), value: 'images' }
];
