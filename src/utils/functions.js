// The same config shape render.php builds, so the editor preview matches the front end.
export const toConfig = attributes => {
	const { source, pdfUrl, images, pageMode, bookStyle, sideArrows, showCover, startPage, startWith, bookTitle, theme, autoplay, autoplaySeconds, autoplayLoop, rtl, phoneFullscreen, maxHeight, maxHeightTablet, maxHeightPhone, showDownload, showPrint, showFullscreen, showZoom, showThumbnails, showContents, showLinks, showSearch, showShare, flipSound } = attributes;
	return {
		source: 'images' === source ? 'images' : 'pdf',
		pdf: 'images' === source ? '' : pdfUrl,
		images: 'images' === source ? images : [],
		pageMode: ['auto', 'double', 'single'].includes(pageMode) ? pageMode : 'auto',
		bookStyle: 'hardcover' === bookStyle ? 'hardcover' : 'flat',
		sideArrows: !!sideArrows,
		showCover,
		startPage: Math.max(1, parseInt(startPage, 10) || 1),
		title: (bookTitle || '').trim(),
		startWith: ['thumbnails', 'contents'].includes(startWith) ? startWith : 'book',
		theme: ['dark', 'auto'].includes(theme) ? theme : 'light',
		autoplay: !!autoplay,
		autoplaySeconds: Math.min(60, Math.max(2, parseInt(autoplaySeconds, 10) || 4)),
		autoplayLoop: false !== autoplayLoop,
		rtl: !!rtl,
		phoneFullscreen: !!phoneFullscreen,
		maxHeight: Math.min(2000, Math.max(200, parseInt(maxHeight, 10) || 700)),
		maxHeightTablet: parseInt(maxHeightTablet, 10) > 0 ? Math.min(2000, Math.max(200, parseInt(maxHeightTablet, 10))) : 0,
		maxHeightPhone: parseInt(maxHeightPhone, 10) > 0 ? Math.min(2000, Math.max(200, parseInt(maxHeightPhone, 10))) : 0,
		showDownload,
		showPrint: !!showPrint,
		showFullscreen,
		showZoom,
		showThumbnails,
		showContents,
		showLinks,
		showSearch: false !== showSearch,
		showShare: !!showShare,
		flipSound
	};
};

export const hasContent = attributes => 'images' === attributes.source ? !!attributes.images?.length : !!attributes.pdfUrl;

// media library items and fresh uploads keep the size in different places
export const toImage = media => ({
	id: media.id,
	url: media.url || media.source_url,
	alt: media.alt || media.alt_text || '',
	width: media.width || media.media_details?.width || 0,
	height: media.height || media.media_details?.height || 0
});

const colorFunctions = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'color-mix', 'var'];

// the colors block::color() keeps on the site, so the editor drops the same ones
export const safeColor = value => {
	value = 'string' === typeof value ? value.trim() : '';
	if (/^(#[0-9a-f]{3,8}|[a-z]+)$/i.test(value)) {
		return value;
	}
	if (!/^[a-z-]+\([a-z0-9\s,.%#()/-]+\)$/i.test(value)) {
		return undefined;
	}
	const names = [...value.matchAll(/([a-z-]*)\(/gi)].map(match => match[1].toLowerCase());
	return names.every(name => colorFunctions.includes(name)) ? value : undefined;
};

export const cssVars = ({ bgColor, toolbarBg, toolbarColor, coverColor }) => ({
	'--alfb-bg': safeColor(bgColor),
	'--alfb-bar-bg': safeColor(toolbarBg),
	'--alfb-bar-color': safeColor(toolbarColor),
	'--alfb-cover': safeColor(coverColor)
});
