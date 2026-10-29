/* global __webpack_public_path__ */
import { __, sprintf } from '@wordpress/i18n';
import { playFlip } from './sound';
import Zoom from './Zoom';
import Thumbnails from './Thumbnails';
import Hardcover from './Hardcover';

const svg = path => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="${path}"/></svg>`;

const icons = {
	prev: svg('M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z'),
	next: svg('M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z'),
	fullscreen: svg('M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z'),
	exitFullscreen: svg('M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z'),
	download: svg('M19 9h-4V3H9v6H5l7 7zM5 18v2h14v-2z'),
	thumbnails: svg('M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm8-2h8v8h-8zm2 2v4h4v-4z'),
	zoomIn: svg('M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 9.5 16a6.5 6.5 0 0 0 4.2-1.6l.3.3v.8l5 5 1.5-1.5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9m2.5-4h-2v2H9v-2H7V9h2V7h1v2h2z'),
	zoomOut: svg('M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 9.5 16a6.5 6.5 0 0 0 4.2-1.6l.3.3v.8l5 5 1.5-1.5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9M7 9h5v1H7z'),
	soundOn: svg('M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4M14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6'),
	soundOff: svg('M16.5 12A4.5 4.5 0 0 0 14 8v2.2l2.5 2.5zm2.5 0a7 7 0 0 1-.6 2.8l1.5 1.5A9 9 0 0 0 14 3.2v2.1a7 7 0 0 1 5 6.7M4.3 3 3 4.3 7.7 9H3v6h4l5 5v-6.7l4.3 4.3a7 7 0 0 1-2.3 1.2v2.1a9 9 0 0 0 3.7-1.8l2 2 1.3-1.3-9-9zM12 4 9.9 6.1 12 8.2z')
};

// pages kept rendered on each side of the open spread
const AHEAD = 4;
const KEEP = 10;

// page number from a #page=5 link, 0 when there is none
export const linkedPage = win => {
	const match = /(?:^#|&)page=(\d+)/.exec(win.location.hash);
	return match ? parseInt(match[1], 10) : 0;
};

// pdf.js CMaps and standard fonts, stored as base64 JSON by webpack.config.js
class JsonDataFactory {
	constructor(urls) {
		this.urls = urls;
	}

	async fetch({ kind, filename }) {
		const url = this.urls[kind] + filename + '.json';
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error('Unable to load ' + url);
		}
		const binary = atob(await response.json());
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}
}

// starts loading a PDF; the task's promise gives the document (also used for the lightbox cover)
export const openDocument = async (url, doc) => {
	const base = __webpack_public_path__ + 'pdfjs/';
	const pdfjs = await import(/* webpackChunkName: "pdfjs" */ 'pdfjs-dist/legacy/build/pdf.mjs');
	pdfjs.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.js';

	return pdfjs.getDocument({
		url,
		cMapUrl: base + 'cmaps/',
		cMapPacked: true,
		standardFontDataUrl: base + 'standard_fonts/',
		BinaryDataFactory: JsonDataFactory,
		// JavaScript image decoders instead of WebAssembly
		useWasm: false,
		wasmUrl: base + 'decoders/',
		// load the PDF fonts into the document that holds the canvases (the editor canvas is an iframe)
		ownerDocument: doc,
		// big files stream in, only the pages being shown are fetched
		disableAutoFetch: true,
		// pdf.js warnings (missing system fonts, JS fallbacks) are not useful to site visitors
		verbosity: pdfjs.VerbosityLevel.ERRORS
	});
};

export default class Flipbook {
	constructor(root, config, { editor = false } = {}) {
		this.root = root;
		this.doc = root.ownerDocument;
		this.win = this.doc.defaultView || window;
		this.config = config;
		this.editor = editor;
		this.sound = !!config.flipSound && !editor;
		this.pages = [];
		this.rendered = [];
		this.queue = Promise.resolve();
		this.destroyed = false;
		this.listeners = [];
	}

	async init() {
		this.stage = this.root.querySelector('.alfb_stage');
		this.root.classList.add('alfb_js');

		try {
			const { PageFlip } = await import(/* webpackChunkName: "page-flip" */ 'page-flip/dist/js/page-flip.module.js');
			const size = 'images' === this.config.source ? this.imageSize() : await this.openPdf();
			if (this.destroyed) {
				return;
			}
			this.build(PageFlip, size);
		} catch (error) {
			if (!this.destroyed) {
				this.fail(error);
			}
		}
	}

	async openPdf() {
		this.task = await openDocument(this.config.pdf, this.doc);
		this.pdf = await this.task.promise;
		this.count = this.pdf.numPages;

		const first = await this.pdf.getPage(1);
		const { width, height } = first.getViewport({ scale: 1 });
		return { width, height };
	}

	imageSize() {
		const images = this.config.images || [];
		this.count = images.length;
		const first = images.find(image => image.width && image.height);
		return first ? { width: first.width, height: first.height } : { width: 3, height: 4 };
	}

	build(PageFlip, size) {
		const { pageMode, showCover, maxHeight } = this.config;
		// a #page=5 link opens the first flipbook on the page there (a lightbox passes the page as startPage)
		const first = this.doc.querySelector('.alfb_wrapper[data-alfb], .alfb_lb[data-alfb]') === this.root;
		const startPage = (!this.editor && first && linkedPage(this.win)) || this.config.startPage;
		const ratio = size.width / size.height;
		const maxWidth = Math.max(100, Math.floor(maxHeight * ratio));
		this.ratio = ratio;
		this.maxWidth = maxWidth;

		for (let i = 0; i < this.count; i++) {
			const page = this.doc.createElement('div');
			page.className = 'alfb_page';
			page.setAttribute('role', 'img');
			/* translators: %d: page number */
			page.setAttribute('aria-label', sprintf(__('Page %d', 'softicon-flipbook'), i + 1));
			if (showCover && (0 === i || this.count - 1 === i)) {
				page.dataset.density = 'hard';
			}
			this.pages.push(page);
			this.rendered.push(0);
		}

		this.book = this.doc.createElement('div');
		this.book.className = 'alfb_book';
		this.stage.appendChild(this.book);
		// before page-flip measures the stage, the cover adds padding around the book
		if ('hardcover' === this.config.bookStyle) {
			this.cover = new Hardcover(this);
		}

		// page-flip goes to one page when the book is narrower than two minWidth pages,
		// single mode caps the book at one page width so that is always true
		// (minWidth above maxWidth makes page-flip reset maxWidth to 2000)
		const minWidth = 'single' === pageMode ? maxWidth : Math.min(300, maxWidth);

		this.flip = new PageFlip(this.book, {
			size: 'stretch',
			width: 400,
			height: Math.round(400 / ratio),
			minWidth,
			maxWidth,
			minHeight: 100,
			maxHeight,
			usePortrait: 'double' !== pageMode,
			showCover: !!showCover,
			startPage: Math.min(this.count, Math.max(1, startPage || 1)) - 1,
			flippingTime: 700,
			maxShadowOpacity: 0.5,
			mobileScrollSupport: true,
			// the editor canvas is an iframe, page-flip listens for mouse moves on the parent window
			useMouseEvents: !this.editor,
			showPageCorners: !this.editor
		});
		this.flip.loadFromHTML(this.pages);

		// page-flip sets a min-width that overflows small phones
		this.book.style.minWidth = '0px';
		this.book.style.maxWidth = this.bookMaxWidth() + 'px';
		// the lightbox sizes its box to the book
		this.root.style.setProperty('--alfb-book-width', this.book.style.maxWidth);

		this.flip.on('flip', () => this.onChange());
		this.flip.on('changeOrientation', () => this.onChange());
		this.flip.on('changeState', event => {
			if ('flipping' === event.data && this.sound) {
				playFlip();
			}
			this.cover?.flipping('read' !== event.data);
		});

		if (this.config.showZoom && !this.editor) {
			this.zoom = new Zoom(this);
		}
		if (this.config.showThumbnails && !this.editor) {
			this.thumbs = new Thumbnails(this);
		}
		this.toolbar();
		if (this.config.sideArrows) {
			this.sideArrows();
		}
		this.watch();

		this.root.classList.add('alfb_ready');
		this.stage.querySelector('.alfb_loading')?.remove();
		// measure again now the spinner is gone, so the first pages render at the real size
		this.refresh();
	}

	bookMaxWidth() {
		const width = this.flip.getSettings().maxWidth;
		return 'single' === this.config.pageMode ? width : width * 2;
	}

	// indexes of the pages currently visible, spreads paired the way page-flip pairs them
	visible() {
		const index = this.flip.getCurrentPageIndex();
		if ('portrait' === this.flip.getOrientation()) {
			return [index];
		}
		if (this.config.showCover && 0 === index) {
			return [0];
		}
		const start = this.config.showCover ? index - ((index + 1) % 2) : index - (index % 2);
		return [start, start + 1].filter(i => i < this.count);
	}

	onChange() {
		const shown = this.visible();
		this.counter.textContent = sprintf(
			/* translators: 1: visible page or pages, 2: total pages */
			__('%1$s / %2$s', 'softicon-flipbook'),
			shown.map(i => i + 1).join('–'),
			this.count
		);
		this.prevBtn.disabled = 0 === Math.min(...shown);
		this.nextBtn.disabled = this.count - 1 === Math.max(...shown);
		if (this.sidePrev) {
			this.sidePrev.disabled = this.prevBtn.disabled;
			this.sideNext.disabled = this.nextBtn.disabled;
			// no room beside the book: the arrows sit over the page edges as round buttons
			this.root.classList.toggle('alfb_side_over', (this.stage.clientWidth - this.book.offsetWidth) / 2 < 56);
		}
		this.cover?.update();
		this.load(Math.min(...shown));
		this.zoom?.update();
	}

	// jumps to a page index, animated unless zoomed
	go(index) {
		index = Math.min(this.count - 1, Math.max(0, index));
		return this.zoom?.active ? this.flip.turnToPage(index) : this.flip.flip(index);
	}

	// no page-turn animation under the zoom view
	next() {
		return this.zoom?.active ? this.flip.turnToNextPage() : this.flip.flipNext();
	}

	prev() {
		return this.zoom?.active ? this.flip.turnToPrevPage() : this.flip.flipPrev();
	}

	onZoom() {
		if (this.zoomInBtn) {
			this.zoomInBtn.disabled = this.zoom.atMax;
			this.zoomOutBtn.disabled = !this.zoom.active;
		}
		this.root.classList.toggle('alfb_zoomed', this.zoom.active);
	}

	onThumbs() {
		this.thumbsBtn.setAttribute('aria-expanded', this.thumbs.open ? 'true' : 'false');
		this.root.classList.toggle('alfb_thumbs_open', this.thumbs.open);
	}

	// page-flip took the first finger of a pinch as the start of a tap or swipe, forget it
	// (touchPoint is page-flip's private swipe state, userStop with isSwipe ends the touch without turning)
	cancelTouch() {
		const ui = this.flip.getUI();
		if (ui) {
			ui.touchPoint = null;
		}
		this.flip.userStop({ x: 0, y: 0 }, true);
	}

	// renders pages near the open spread and frees the far ones
	load(center) {
		const order = [];
		for (let step = 0; step <= AHEAD; step++) {
			order.push(center + step);
			if (step) {
				order.push(center - step);
			}
		}
		order.filter(i => i >= 0 && i < this.count).forEach(i => this.ensure(i));

		this.pages.forEach((page, i) => {
			if (Math.abs(i - center) > KEEP && this.rendered[i]) {
				page.replaceChildren();
				this.rendered[i] = 0;
			}
		});
	}

	ensure(index) {
		if ('images' === this.config.source) {
			if (!this.rendered[index]) {
				const image = this.config.images[index];
				const img = this.doc.createElement('img');
				img.src = image.url;
				img.alt = image.alt || '';
				img.decoding = 'async';
				this.pages[index].replaceChildren(img);
				this.rendered[index] = 1;
			}
			return;
		}

		const width = this.targetWidth();
		// already sharp enough, re-render only when the page grew a lot (fullscreen)
		if (this.rendered[index] && this.rendered[index] >= width * 0.8) {
			return;
		}
		this.rendered[index] = width;
		this.queue = this.queue.then(() => this.renderPage(index, width)).catch(() => {
			this.rendered[index] = 0;
		});
	}

	targetWidth() {
		const rect = this.flip.getBoundsRect();
		const dpr = Math.min(this.win.devicePixelRatio || 1, 2);
		return Math.ceil((rect ? rect.pageWidth : 400) * dpr);
	}

	async renderPage(index, width) {
		if (this.destroyed || this.rendered[index] !== width) {
			return;
		}
		const canvas = await this.drawPage(index, width);

		// skip if the page was freed or re-queued while rendering
		if (!this.destroyed && this.rendered[index] === width) {
			this.pages[index].replaceChildren(canvas);
		}
	}

	async drawPage(index, width) {
		const page = await this.pdf.getPage(index + 1);
		const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });

		const canvas = this.doc.createElement('canvas');
		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);
		await page.render({ canvas, viewport }).promise;
		page.cleanup();
		return canvas;
	}

	button(name, label, onClick) {
		const button = this.doc.createElement('button');
		button.type = 'button';
		button.className = `alfb_btn alfb_btn_${name}`;
		button.setAttribute('aria-label', label);
		button.title = label;
		button.innerHTML = icons[name];
		button.addEventListener('click', onClick);
		return button;
	}

	toolbar() {
		const bar = this.doc.createElement('div');
		bar.className = 'alfb_toolbar';

		this.prevBtn = this.button('prev', __('Previous page', 'softicon-flipbook'), () => this.prev());
		this.nextBtn = this.button('next', __('Next page', 'softicon-flipbook'), () => this.next());

		this.counter = this.doc.createElement(this.editor ? 'span' : 'button');
		this.counter.className = 'alfb_counter';
		this.counter.setAttribute('aria-live', 'polite');
		if (!this.editor) {
			this.counter.type = 'button';
			this.counter.title = __('Go to page', 'softicon-flipbook');
			this.counter.addEventListener('click', () => this.askPage());
		}

		const nav = this.doc.createElement('div');
		nav.className = 'alfb_nav';
		nav.append(this.prevBtn, this.counter, this.nextBtn);

		const tools = this.doc.createElement('div');
		tools.className = 'alfb_tools';

		if (this.thumbs) {
			this.thumbsBtn = this.button('thumbnails', __('Thumbnails', 'softicon-flipbook'), () => this.thumbs.toggle());
			this.thumbsBtn.setAttribute('aria-expanded', 'false');
			tools.append(this.thumbsBtn);
		}

		if (this.zoom) {
			const zoom = direction => {
				this.thumbs?.close(false);
				this.zoom.step(direction);
			};
			this.zoomOutBtn = this.button('zoomOut', __('Zoom out', 'softicon-flipbook'), () => zoom(-1));
			this.zoomInBtn = this.button('zoomIn', __('Zoom in', 'softicon-flipbook'), () => zoom(1));
			tools.append(this.zoomOutBtn, this.zoomInBtn);
		}

		if (this.config.flipSound && !this.editor) {
			const toggle = this.button(this.sound ? 'soundOn' : 'soundOff', __('Page turn sound', 'softicon-flipbook'), () => {
				this.sound = !this.sound;
				toggle.innerHTML = icons[this.sound ? 'soundOn' : 'soundOff'];
				toggle.setAttribute('aria-pressed', this.sound ? 'true' : 'false');
			});
			toggle.setAttribute('aria-pressed', 'true');
			tools.append(toggle);
		}

		if (this.config.showDownload && 'pdf' === this.config.source) {
			const link = this.doc.createElement('a');
			link.className = 'alfb_btn alfb_btn_download';
			link.href = this.config.pdf;
			link.download = '';
			link.target = '_blank';
			link.rel = 'noopener';
			link.title = __('Download PDF', 'softicon-flipbook');
			link.setAttribute('aria-label', link.title);
			link.innerHTML = icons.download;
			tools.append(link);
		}

		if (this.config.showFullscreen && !this.editor) {
			this.fsBtn = this.button('fullscreen', __('Fullscreen', 'softicon-flipbook'), () => this.toggleFullscreen());
			tools.append(this.fsBtn);
		}

		bar.append(nav, tools);
		this.root.appendChild(bar);
		this.bar = bar;
		if (this.zoom) {
			this.onZoom();
		}
	}

	// the counter turns into a page number field, Enter jumps, Escape cancels
	askPage() {
		const input = this.doc.createElement('input');
		input.type = 'number';
		input.className = 'alfb_page_input';
		input.min = 1;
		input.max = this.count;
		input.value = Math.min(...this.visible()) + 1;
		input.setAttribute('aria-label', __('Page number', 'softicon-flipbook'));

		let open = true;
		const close = (jump, refocus) => {
			if (!open) {
				return;
			}
			open = false;
			const page = parseInt(input.value, 10);
			input.replaceWith(this.counter);
			if (jump && page) {
				this.go(page - 1);
			}
			if (refocus) {
				this.counter.focus();
			}
		};
		// keep the arrow, zoom and Escape keys of the book away from the field
		input.addEventListener('keydown', event => {
			event.stopPropagation();
			// preventDefault: the same Enter would otherwise click the counter that gets the focus back
			if ('Enter' === event.key) {
				event.preventDefault();
				close(true, true);
			} else if ('Escape' === event.key) {
				event.preventDefault();
				close(false, true);
			}
		});
		input.addEventListener('blur', () => close(true, false));

		this.counter.replaceWith(input);
		input.focus();
		input.select();
	}

	// large previous / next arrows on both sides of the book
	sideArrows() {
		const side = (name, label, onClick) => {
			const button = this.button(name, label, onClick);
			button.className = `alfb_side alfb_side_${name}`;
			this.stage.append(button);
			return button;
		};
		this.sidePrev = side('prev', __('Previous page', 'softicon-flipbook'), () => this.prev());
		this.sideNext = side('next', __('Next page', 'softicon-flipbook'), () => this.next());
	}

	toggleFullscreen() {
		const active = this.doc.fullscreenElement === this.root || this.root.classList.contains('alfb_overlay');
		if (active) {
			if (this.doc.fullscreenElement) {
				this.doc.exitFullscreen();
			} else {
				this.setFullscreen(false);
			}
			return;
		}

		// iPhone Safari has no element fullscreen, cover the viewport instead
		if (this.root.requestFullscreen && this.doc.fullscreenEnabled) {
			this.root.requestFullscreen().catch(() => this.setFullscreen(true));
		} else {
			this.setFullscreen(true);
		}
	}

	setFullscreen(on) {
		this.root.classList.toggle('alfb_overlay', on && !this.doc.fullscreenElement);
		this.root.classList.toggle('alfb_is_fullscreen', on);
		if (this.fsBtn) {
			this.fsBtn.innerHTML = icons[on ? 'exitFullscreen' : 'fullscreen'];
		}

		// fit the book to the screen height, then back to the block setting
		const settings = this.flip.getSettings();
		if (on) {
			const room = this.win.innerHeight - (this.bar ? this.bar.offsetHeight : 0) - 32;
			settings.maxWidth = Math.max(100, Math.floor(room * this.ratio));
			settings.maxHeight = room;
		} else {
			settings.maxWidth = this.maxWidth;
			settings.maxHeight = this.config.maxHeight;
		}
		// one page mode stays one page however wide the book gets
		if ('single' === this.config.pageMode) {
			settings.minWidth = settings.maxWidth;
		}
		this.book.style.maxWidth = this.bookMaxWidth() + 'px';
		this.root.style.setProperty('--alfb-book-width', this.book.style.maxWidth);
		this.refresh();
	}

	// a new maximum height, the lightbox fits the book to the window
	setHeight(maxHeight) {
		this.config.maxHeight = maxHeight;
		this.maxWidth = Math.max(100, Math.floor(maxHeight * this.ratio));
		if (this.flip && !this.root.classList.contains('alfb_is_fullscreen')) {
			this.setFullscreen(false);
		}
	}

	refresh() {
		this.flip.update();
		this.onChange();
	}

	on(target, type, handler, options = false) {
		target.addEventListener(type, handler, options);
		this.listeners.push(() => target.removeEventListener(type, handler, options));
	}

	watch() {
		this.on(this.doc, 'fullscreenchange', () => this.setFullscreen(this.doc.fullscreenElement === this.root));

		if (!this.editor) {
			this.on(this.root, 'keydown', event => {
				// the thumbnail panel covers the book, only Escape acts on it
				if (this.thumbs?.open) {
					if ('Escape' === event.key) {
						// preventDefault keeps a lightbox around the book open
						event.preventDefault();
						this.thumbs.close(true);
					}
					return;
				}
				const zoomKey = this.zoom && !event.ctrlKey && !event.metaKey;
				if ('ArrowLeft' === event.key) {
					this.prev();
				} else if ('ArrowRight' === event.key) {
					this.next();
				} else if (zoomKey && ('+' === event.key || '=' === event.key)) {
					this.zoom.step(1);
				} else if (zoomKey && '-' === event.key) {
					this.zoom.step(-1);
				} else if ('Escape' === event.key && this.zoom?.active) {
					event.preventDefault();
					this.zoom.set(1);
				} else if ('Escape' === event.key && this.root.classList.contains('alfb_overlay')) {
					event.preventDefault();
					this.setFullscreen(false);
				}
			});
		}

		// the block can change width without a window resize (editor sidebar, columns)
		const Observer = this.win.ResizeObserver;
		if (Observer) {
			let width = this.stage.clientWidth;
			let timer;
			this.observer = new Observer(() => {
				if (this.stage.clientWidth === width) {
					return;
				}
				width = this.stage.clientWidth;
				clearTimeout(timer);
				timer = setTimeout(() => this.refresh(), 120);
			});
			this.observer.observe(this.stage);
		}
	}

	fail(error) {
		this.root.classList.add('alfb_error');
		const message = this.doc.createElement('p');
		message.className = 'alfb_message';

		const url = this.config.pdf ? new URL(this.config.pdf, this.win.location.href) : null;
		const crossOrigin = url && url.origin !== this.win.location.origin;
		message.textContent = crossOrigin
			? __('This PDF is on another website that does not allow it to be shown here. Upload the PDF to your Media Library instead.', 'softicon-flipbook')
			: __('This flipbook could not be loaded.', 'softicon-flipbook');

		this.stage.replaceChildren(message);
		// eslint-disable-next-line no-console
		console.error('SoftIcon Flipbook:', error);
	}

	destroy() {
		this.destroyed = true;
		this.zoom?.close();
		this.thumbs?.destroy();
		this.cover?.destroy();
		this.sidePrev?.remove();
		this.sideNext?.remove();
		this.listeners.forEach(off => off());
		this.observer?.disconnect();
		try {
			this.flip?.destroy();
		} catch (e) {
			// page-flip throws if it never finished loading
		}
		this.task?.destroy();
		this.bar?.remove();
		this.book?.remove();
		this.root.classList.remove('alfb_ready', 'alfb_error', 'alfb_overlay', 'alfb_is_fullscreen', 'alfb_zoomed', 'alfb_thumbs_open', 'alfb_side_over');
	}
}
