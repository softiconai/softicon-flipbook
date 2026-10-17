// The same config shape render.php builds, so the editor preview matches the front end.
export const toConfig = attributes => {
	const { source, pdfUrl, images, pageMode, bookStyle, sideArrows, showCover, startPage, maxHeight, showDownload, showFullscreen, showZoom, showThumbnails, flipSound } = attributes;
	return {
		source: 'images' === source ? 'images' : 'pdf',
		pdf: 'images' === source ? '' : pdfUrl,
		images: 'images' === source ? images : [],
		pageMode,
		bookStyle: 'hardcover' === bookStyle ? 'hardcover' : 'flat',
		sideArrows: !!sideArrows,
		showCover,
		startPage: Math.max(1, parseInt(startPage, 10) || 1),
		maxHeight,
		showDownload,
		showFullscreen,
		showZoom,
		showThumbnails,
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

export const cssVars = ({ bgColor, toolbarBg, toolbarColor, coverColor }) => ({
	'--alfb-bg': bgColor || undefined,
	'--alfb-bar-bg': toolbarBg || undefined,
	'--alfb-bar-color': toolbarColor || undefined,
	'--alfb-cover': coverColor || undefined
});
