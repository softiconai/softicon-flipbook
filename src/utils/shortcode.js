// the [softicon_flipbook] shortcode for a block's settings (includes/shortcode.php reads it back);
// only the settings that differ from the defaults, so the shortcode stays short
import metadata from '../block.json';

const defaults = Object.fromEntries(Object.entries(metadata.attributes).map(([key, value]) => [key, value.default]));

const switches = {
	showCover: 'cover', sideArrows: 'arrows', showDownload: 'download', showFullscreen: 'fullscreen', showZoom: 'zoom',
	showThumbnails: 'thumbnails', showContents: 'contents', showLinks: 'links', showSearch: 'search', showShare: 'share', flipSound: 'sound'
};
const colors = { bgColor: 'background', coverColor: 'cover_color', toolbarBg: 'toolbar_background', toolbarColor: 'toolbar_color' };

// a shortcode value cannot hold quotes or square brackets
const clean = value => String(value).replace(/["[\]]/g, '').trim();

export const toShortcode = attributes => {
	const a = { ...defaults, ...attributes };
	const parts = [];
	const add = (name, value) => parts.push(`${name}="${clean(value)}"`);

	if ('images' === a.source) {
		const ids = (a.images || []).map(image => image.id).filter(Boolean);
		if (ids.length) {
			add('images', ids.join(','));
		}
	} else if (a.pdfId) {
		add('id', a.pdfId);
	} else if (a.pdfUrl) {
		add('pdf', a.pdfUrl);
	}

	if (a.pageMode !== defaults.pageMode) {
		add('layout', a.pageMode);
	}
	if ('hardcover' === a.bookStyle) {
		add('design', 'hardcover');
	}
	if (a.startPage > 1) {
		add('start', a.startPage);
	}
	if (a.maxHeight !== defaults.maxHeight) {
		add('height', a.maxHeight);
	}
	Object.entries(switches).forEach(([key, name]) => {
		if (!!a[key] !== !!defaults[key]) {
			add(name, a[key] ? 'yes' : 'no');
		}
	});
	Object.entries(colors).forEach(([key, name]) => {
		if (a[key]) {
			add(name, a[key]);
		}
	});
	if ('lightbox' === a.displayMode) {
		add('popup', 'yes');
		if (a.lightboxTrigger !== defaults.lightboxTrigger) {
			add('popup_style', 'text' === a.lightboxTrigger ? 'link' : a.lightboxTrigger);
		}
		if (a.lightboxText) {
			add('popup_text', a.lightboxText);
		}
		if (a.lightboxImage?.id) {
			add('popup_image', a.lightboxImage.id);
		}
		if (a.lightboxWidth !== defaults.lightboxWidth) {
			add('popup_width', a.lightboxWidth);
		}
		if (a.lightboxAlign !== defaults.lightboxAlign) {
			add('popup_align', a.lightboxAlign);
		}
	}
	if (['wide', 'full'].includes(a.align)) {
		add('align', a.align);
	}

	return `[softicon_flipbook ${parts.join(' ')}]`;
};
