/* global __webpack_public_path__ */
import { __, sprintf } from '@wordpress/i18n';
import { playFlip } from './sound';
import Zoom from './Zoom';
import Thumbnails from './Thumbnails';
import Contents from './Contents';
import Search from './Search';
import Hardcover from './Hardcover';
import Autoplay from './Autoplay';
import print from './Print';
import Share from './Share';

const svg = path => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="${path}"/></svg>`;

const icons = {
	prev: svg('M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z'),
	next: svg('M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z'),
	first: svg('M18.4 16.6 13.8 12l4.6-4.6L17 6l-6 6 6 6zM6 6h2v12H6z'),
	last: svg('M5.6 7.4 10.2 12l-4.6 4.6L7 18l6-6-6-6zM16 6h2v12h-2z'),
	fullscreen: svg('M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z'),
	exitFullscreen: svg('M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z'),
	print: svg('M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3m-3 11H8v-5h8zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2m-1-9H6v4h12z'),
	download: svg('M19 9h-4V3H9v6H5l7 7zM5 18v2h14v-2z'),
	contents: svg('M3 5h2v2H3zm4 0h14v2H7zm-4 6h2v2H3zm4 0h14v2H7zm-4 6h2v2H3zm4 0h14v2H7z'),
	thumbnails: svg('M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm8-2h8v8h-8zm2 2v4h4v-4z'),
	zoomIn: svg('M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 9.5 16a6.5 6.5 0 0 0 4.2-1.6l.3.3v.8l5 5 1.5-1.5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9m2.5-4h-2v2H9v-2H7V9h2V7h1v2h2z'),
	zoomOut: svg('M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 9.5 16a6.5 6.5 0 0 0 4.2-1.6l.3.3v.8l5 5 1.5-1.5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9M7 9h5v1H7z'),
	soundOn: svg('M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4M14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6'),
	search: svg('M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 9.5 16a6.5 6.5 0 0 0 4.2-1.6l.3.3v.8l5 5 1.5-1.5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9'),
	play: svg('M8 5v14l11-7z'),
	pause: svg('M6 19h4V5H6zm8-14v14h4V5z'),
	share: svg('M18 16.1c-.8 0-1.4.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.2c.5.5 1.2.8 2 .8a3 3 0 1 0-3-3c0 .2 0 .5.1.7L8 9.8A3 3 0 1 0 8 14.2l7.1 4.2c-.1.2-.1.4-.1.6a2.9 2.9 0 1 0 3-2.9'),
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

// #page=5 is for the first book on the page, #page=5&book=2 for the second (flipbooks and lightboxes, in page order)
// only books the plugin made carry alfb-block; a look-alike in post content (kses keeps class and data-*) has none
export const BOOKS = '.alfb_wrapper[data-alfb][alfb-block], .alfb_lb[data-alfb][alfb-block]';
export const linkedBook = win => {
	const match = /(?:^#|&)book=(\d+)/.exec(win.location.hash);
	return match ? parseInt(match[1], 10) : 1;
};
export const bookNumber = el => [...el.ownerDocument.querySelectorAll(BOOKS)].indexOf(el) + 1;

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
	// -p2: the worker carries our patches (webpack.config.js: JPEG 2000 size, colour profiles), so cached older copies are not used
	pdfjs.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.js?ver=' + pdfjs.version + '-p2';

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
		// fonts are drawn without eval() / new Function(), so a PDF can never run code here
		isEvalSupported: false,
		// pdf.js warnings (missing system fonts, JS fallbacks) are not useful to site visitors
		verbosity: pdfjs.VerbosityLevel.ERRORS
	});
};

// page-flip listens for the mouse moving and letting go on the window its script runs in. The editor's book is in the
// canvas iframe, whose moves never reach that window, so a drag could not turn the page: they go to the book's window.
const moves = [['mousemove', 'onMouseMove'], ['touchmove', 'onTouchMove'], ['mouseup', 'onMouseUp'], ['touchend', 'onTouchEnd']];
const dragInWindow = (flip, win) => {
	const ui = flip.ui;
	if (win === window || 'function' !== typeof ui?.setHandlers) {
		return;
	}
	const proto = Object.getPrototypeOf(ui);
	// page-flip sets them again whenever its pages change
	ui.setHandlers = () => {
		proto.setHandlers.call(ui);
		moves.forEach(([type, name]) => {
			window.removeEventListener(type, ui[name]);
			win.addEventListener(type, ui[name], 'touchmove' === type ? { passive: false } : false);
		});
	};
	ui.removeHandlers = () => {
		proto.removeHandlers.call(ui);
		moves.forEach(([type, name]) => win.removeEventListener(type, ui[name]));
	};
	ui.setHandlers();
};

// the books on the page, for keys pressed with nothing in focus: the one clicked last while it is still in view,
// else the one with most of it in view
const books = new Set();
let lastBook = null;
const shownArea = book => {
	const box = book.root.getBoundingClientRect();
	const win = book.win;
	const width = Math.min(box.right, win.innerWidth) - Math.max(box.left, 0);
	const height = Math.min(box.bottom, win.innerHeight) - Math.max(box.top, 0);
	return width > 0 && height > 0 ? width * height : 0;
};
const bookInView = doc => {
	if (lastBook && books.has(lastBook) && lastBook.doc === doc && shownArea(lastBook) > 0) {
		return lastBook;
	}
	let best = null;
	let most = 0;
	books.forEach(book => {
		const area = book.doc === doc ? shownArea(book) : 0;
		if (area > most) {
			best = book;
			most = area;
		}
	});
	return best;
};

export default class Flipbook {
	constructor(root, config, { editor = false } = {}) {
		this.root = root;
		this.doc = root.ownerDocument;
		this.win = this.doc.defaultView || window;
		this.config = config;
		this.editor = editor;
		this.sound = !!config.flipSound;
		// readers who ask their device for less motion: pages turn without the animation
		this.calm = !!this.win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		this.pages = [];
		this.rendered = [];
		this.queue = Promise.resolve();
		this.destroyed = false;
		this.listeners = [];
	}

	async init() {
		this.stage = this.root.querySelector('.alfb_stage');
		this.root.classList.add('alfb_js');
		// dark, or dark when the reader's device is (auto); the block's own colors still win
		if (['dark', 'auto'].includes(this.config.theme)) {
			this.root.classList.add('alfb_theme_' + this.config.theme);
		}
		// the book's title above it (also in the popup and full screen)
		if (this.config.title && !this.root.querySelector(':scope > .alfb_title')) {
			const title = this.doc.createElement('div');
			title.className = 'alfb_title';
			title.textContent = this.config.title;
			this.root.prepend(title);
		}

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
		// the bookmarks for the table of contents, a PDF without them gets no button
		if (this.config.showContents) {
			const outline = await this.pdf.getOutline().catch(() => null);
			this.outline = outline?.length ? outline : null;
		}

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
		// a tablet or phone height, when the block sets one; the window is the editor canvas's own in the editor,
		// so its Tablet and Mobile previews show them too
		const screen = this.win.innerWidth;
		const device = screen < 600 ? this.config.maxHeightPhone : (screen < 1025 ? this.config.maxHeightTablet : 0);
		if (device > 0) {
			this.config.maxHeight = device;
		}
		const { pageMode, showCover, maxHeight } = this.config;
		// a #page=5 link opens its book there (a lightbox passes the page as startPage)
		const linked = !this.editor && bookNumber(this.root) === linkedBook(this.win);
		const startPage = (linked && linkedPage(this.win)) || this.config.startPage;
		const ratio = size.width / size.height;
		const maxWidth = Math.max(100, Math.floor(maxHeight * ratio));
		// right to left: page-flip gets the pages in reverse order; this.pages and every index outside page-flip stay
		// in reading order (toFlip turns one into page-flip's)
		this.rtl = !!this.config.rtl;
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
			startPage: this.toFlip(Math.min(this.count, Math.max(1, startPage || 1)) - 1),
			flippingTime: this.calm ? 1 : 700,
			maxShadowOpacity: 0.5,
			mobileScrollSupport: true,
			// in the editor a click selects the block; a drag still turns the page
			disableFlipByClick: this.editor
		});
		// the book's width before page-flip lays it out: a one page book that starts as a two page spread would open a page early
		this.fit();
		this.flip.loadFromHTML(this.rtl ? [...this.pages].reverse() : this.pages);
		dragInWindow(this.flip, this.win);

		// page-flip sets a min-width that overflows small phones
		this.book.style.minWidth = '0px';
		this.fit();

		// a page dragged over never reaches the flipping state: its sound plays when it lands (flip comes before read)
		let dragging = false;
		this.flip.on('flip', () => {
			if (dragging && this.sound) {
				playFlip();
			}
			this.onChange();
		});
		this.flip.on('changeOrientation', () => this.onChange());
		this.flip.on('changeState', event => {
			if ('flipping' === event.data && this.sound) {
				playFlip();
			}
			dragging = 'user_fold' === event.data;
			this.cover?.flipping('read' !== event.data);
		});

		if (this.config.showZoom) {
			this.zoom = new Zoom(this);
		}
		if (this.config.showThumbnails) {
			this.thumbs = new Thumbnails(this);
		}
		if (this.outline) {
			this.contents = new Contents(this, this.outline);
		}
		if (this.config.showSearch && 'pdf' === this.config.source) {
			this.search = new Search(this);
		}
		// the editor shows the same toolbar as the page; there the book only plays when Play is pressed
		if (this.config.autoplay && this.count > 1) {
			this.autoplay = new Autoplay(this);
		}
		this.toolbar();
		if (!this.editor) {
			this.autoplay?.start();
		}
		// on a phone the book can open full screen with one tap
		if (this.config.phoneFullscreen && !this.editor && this.win.matchMedia?.('(max-width: 600px)').matches) {
			this.tapToRead();
		}
		if (this.config.sideArrows) {
			this.sideArrows();
		}
		this.watch();

		this.root.classList.add('alfb_ready');
		this.pageHint();
		this.stage.querySelector('.alfb_loading')?.remove();
		// before the first alfb:page
		this.emit('ready');
		// measure again now the spinner is gone, so the first pages render at the real size
		this.refresh();
		// the reader can start from the thumbnails or the table of contents, to pick a page first
		if ('thumbnails' === this.config.startWith) {
			this.thumbs?.show(false);
		} else if ('contents' === this.config.startWith) {
			this.contents?.show(false);
		}
	}

	// alfb:ready and alfb:page on the block, for add-ons; detail.book is this book
	emit(name, detail = {}) {
		if (!this.editor) {
			this.root.dispatchEvent(new this.win.CustomEvent('alfb:' + name, { bubbles: true, detail: { book: this, ...detail } }));
		}
	}

	// page-flip shows one page when the room is under two minWidth pages; the book is then one page
	// wide, else a page as tall as the block leaves empty space above and below it
	fit() {
		const { maxWidth, minWidth } = this.flip.getSettings();
		const full = 'single' === this.config.pageMode ? maxWidth : maxWidth * 2;
		const style = this.win.getComputedStyle(this.stage);
		const room = this.stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
		const one = 'auto' === this.config.pageMode && room < minWidth * 2;
		this.book.style.maxWidth = (one ? maxWidth : full) + 'px';
		// the lightbox sizes its box to the two page book, so a one page book can grow back
		this.root.style.setProperty('--alfb-book-width', full + 'px');
	}

	// indexes of the pages currently visible, spreads paired the way page-flip pairs them
	visible() {
		const index = this.flip.getCurrentPageIndex();
		let shown;
		if ('portrait' === this.flip.getOrientation()) {
			shown = [index];
		} else if (this.config.showCover && 0 === index) {
			shown = [0];
		} else {
			const start = this.config.showCover ? index - ((index + 1) % 2) : index - (index % 2);
			shown = [start, start + 1].filter(i => i < this.count);
		}
		return this.rtl ? shown.map(i => this.toFlip(i)).sort((a, b) => a - b) : shown;
	}

	// a page index in reading order to page-flip's order and back (the same sum both ways)
	toFlip(index) {
		return this.rtl ? this.count - 1 - index : index;
	}

	// to a page without the page-turn animation
	turnTo(index) {
		this.flip.turnToPage(this.toFlip(Math.min(this.count - 1, Math.max(0, index))));
		this.onChange();
	}

	onChange() {
		const shown = this.visible();
		// one page at a time: page-flip keeps the page before it one page width to the left, see style.scss
		this.root.classList.toggle('alfb_portrait', 'portrait' === this.flip.getOrientation());
		this.counter.textContent = sprintf(
			/* translators: 1: visible page or pages, 2: total pages */
			__('%1$s / %2$s', 'softicon-flipbook'),
			shown.map(i => i + 1).join('–'),
			this.count
		);
		this.prevBtn.disabled = 0 === Math.min(...shown);
		this.nextBtn.disabled = this.count - 1 === Math.max(...shown);
		if (this.firstBtn) {
			this.firstBtn.disabled = this.prevBtn.disabled;
			this.lastBtn.disabled = this.nextBtn.disabled;
		}
		if (this.seek && !this.seeking) {
			this.seek.value = Math.min(...shown) + 1;
			this.seekFill();
			this.seek.setAttribute('aria-valuetext', sprintf(
				/* translators: 1: page number, 2: total pages */
				__('Page %1$s of %2$s', 'softicon-flipbook'), this.seek.value, this.count));
		}
		if (this.sidePrev) {
			this.sidePrev.disabled = this.prevBtn.disabled;
			this.sideNext.disabled = this.nextBtn.disabled;
			// no room beside the book: the arrows sit over the page edges as round buttons
			this.root.classList.toggle('alfb_side_over', (this.stage.clientWidth - this.book.offsetWidth) / 2 < 56);
		}
		// a button just turned off at the first or last page would drop the focus to the page, and with it the arrow keys
		const focused = this.doc.activeElement;
		if (focused?.disabled && this.root.contains(focused)) {
			this.root.focus({ preventScroll: true });
		}
		this.cover?.update();
		this.load(Math.min(...shown));
		this.zoom?.update();
		this.emit('page', { pages: shown });
	}

	// jumps to a page index, animated unless zoomed
	go(index) {
		// still loading: it opens there instead
		if (!this.flip) {
			this.config.startPage = index + 1;
			return;
		}
		index = this.toFlip(Math.min(this.count - 1, Math.max(0, index)));
		return this.zoom?.active ? this.flip.turnToPage(index) : this.flip.flip(index);
	}

	// no page-turn animation under the zoom view
	next() {
		return this.rtl ? this.back() : this.forward();
	}

	prev() {
		return this.rtl ? this.forward() : this.back();
	}

	// page-flip's own directions
	forward() {
		return this.zoom?.active ? this.flip.turnToNextPage() : this.flip.flipNext();
	}

	back() {
		return this.zoom?.active ? this.flip.turnToPrevPage() : this.flip.flipPrev();
	}

	onZoom() {
		if (this.zoomInBtn) {
			this.zoomInBtn.disabled = this.zoom.atMax;
			this.zoomOutBtn.disabled = !this.zoom.active;
		}
		this.root.classList.toggle('alfb_zoomed', this.zoom.active);
	}

	onContents() {
		this.contentsBtn.setAttribute('aria-expanded', this.contents.open ? 'true' : 'false');
		this.root.classList.toggle('alfb_contents_open', this.contents.open);
	}

	onSearch() {
		this.searchBtn.setAttribute('aria-expanded', this.search.open ? 'true' : 'false');
		this.root.classList.toggle('alfb_search_open', this.search.open);
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
				this.emit('drawn', { index, page: this.pages[index] });
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
			if (this.config.showLinks && !this.editor) {
				this.addLinks(index);
			}
			// add-ons put their own layers on the page again after each draw (alfb:drawn, detail.index and detail.page)
			this.emit('drawn', { index, page: this.pages[index] });
		}
	}

	// web, email and phone links only; a PDF can hold javascript: or file: links
	safeUrl(url) {
		try {
			const parsed = new URL(url, this.win.location.href);
			return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? parsed.href : null;
		} catch (e) {
			return null;
		}
	}

	// page index of a PDF destination (a name or [page ref, ...]), null when it points nowhere
	destPage(dest) {
		const key = JSON.stringify(dest);
		this.dests = this.dests || {};
		if (!(key in this.dests)) {
			this.dests[key] = (async () => {
				const explicit = 'string' === typeof dest ? await this.pdf.getDestination(dest) : dest;
				const ref = Array.isArray(explicit) ? explicit[0] : null;
				if (ref && 'object' === typeof ref) {
					return this.pdf.getPageIndex(ref);
				}
				return Number.isInteger(ref) && ref < this.count ? ref : null;
			})().catch(() => null);
		}
		return this.dests[key];
	}

	// the link areas of a page in percent of the page, so they follow every page size
	pageLinks(index) {
		this.links = this.links || [];
		if (!this.links[index]) {
			this.links[index] = (async () => {
				const page = await this.pdf.getPage(index + 1);
				const viewport = page.getViewport({ scale: 1 });
				const links = [];
				for (const note of await page.getAnnotations({ intent: 'display' })) {
					if ('Link' !== note.subtype) {
						continue;
					}
					const url = note.url ? this.safeUrl(note.url) : null;
					const target = url || !note.dest ? null : await this.destPage(note.dest);
					if (!url && null === target) {
						continue;
					}
					// two corners, so a rotated page works too
					const [x1, y1] = viewport.convertToViewportPoint(note.rect[0], note.rect[1]);
					const [x2, y2] = viewport.convertToViewportPoint(note.rect[2], note.rect[3]);
					links.push({
						url,
						target,
						left: (Math.min(x1, x2) / viewport.width) * 100,
						top: (Math.min(y1, y2) / viewport.height) * 100,
						width: (Math.abs(x2 - x1) / viewport.width) * 100,
						height: (Math.abs(y2 - y1) / viewport.height) * 100
					});
				}
				return links;
			})().catch(() => []);
		}
		return this.links[index];
	}

	// clickable areas over a drawn page; page-flip leaves clicks on <a> alone
	async addLinks(index) {
		const links = await this.pageLinks(index);
		const page = this.pages[index];
		if (this.destroyed || !links.length || !page.querySelector('canvas') || page.querySelector('.alfb_links')) {
			return;
		}
		const layer = this.doc.createElement('div');
		layer.className = 'alfb_links';
		for (const link of links) {
			const a = this.doc.createElement('a');
			a.className = 'alfb_link';
			Object.assign(a.style, { left: link.left + '%', top: link.top + '%', width: link.width + '%', height: link.height + '%' });
			if (link.url) {
				a.href = link.url;
				a.title = link.url.replace(/^mailto:|^tel:/, '');
				if (/^https?:/.test(link.url)) {
					a.target = '_blank';
					a.rel = 'noopener noreferrer';
				}
			} else {
				/* translators: %d: page number */
				a.title = sprintf(__('Go to page %d', 'softicon-flipbook'), link.target + 1);
				a.href = '#page=' + (link.target + 1);
				// turn this book, the address and other books on the page stay as they are
				a.addEventListener('click', event => {
					event.preventDefault();
					this.go(link.target);
				});
			}
			a.setAttribute('aria-label', a.title);
			layer.append(a);
		}
		page.append(layer);
	}

	async drawPage(index, width) {
		const page = await this.pdf.getPage(index + 1);
		const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });

		const canvas = this.doc.createElement('canvas');
		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);
		await page.render({ canvas, viewport }).promise;
		page.cleanup();
		// add-ons draw on the page itself (alfb:paint, detail.index and detail.canvas): on screen, zoomed and printed
		this.emit('paint', { index, canvas });
		return canvas;
	}

	// a toolbar icon's markup, for buttons that change their icon (Autoplay)
	icon(name) {
		return icons[name];
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

		// right to left: the next page is on the left, its arrow points left
		this.prevBtn = this.button(this.rtl ? 'next' : 'prev', __('Previous page', 'softicon-flipbook'), () => this.prev());
		this.nextBtn = this.button(this.rtl ? 'prev' : 'next', __('Next page', 'softicon-flipbook'), () => this.next());

		this.counter = this.doc.createElement('button');
		this.counter.className = 'alfb_counter';
		this.counter.setAttribute('aria-live', 'polite');
		this.counter.type = 'button';
		this.counter.title = __('Go to page', 'softicon-flipbook');
		this.counter.addEventListener('click', () => this.askPage());

		const nav = this.doc.createElement('div');
		nav.className = 'alfb_nav';
		const order = [this.prevBtn, this.counter, this.nextBtn];
		// beside the arrows, pointing the same way as them in a right to left book
		if (this.config.showFirstLast) {
			this.firstBtn = this.button(this.rtl ? 'last' : 'first', __('First page', 'softicon-flipbook'), () => this.go(0));
			this.lastBtn = this.button(this.rtl ? 'first' : 'last', __('Last page', 'softicon-flipbook'), () => this.go(this.count - 1));
			order.unshift(this.firstBtn);
			order.push(this.lastBtn);
		}
		nav.append(...(this.rtl ? order.reverse() : order));

		const tools = this.doc.createElement('div');
		tools.className = 'alfb_tools';

		if (this.autoplay) {
			this.autoplay.button = this.button('play', __('Play', 'softicon-flipbook'), () => this.autoplay.toggle());
			tools.append(this.autoplay.button);
		}

		if (this.search) {
			this.searchBtn = this.button('search', __('Search', 'softicon-flipbook'), () => this.search.toggle());
			this.searchBtn.setAttribute('aria-expanded', 'false');
			tools.append(this.searchBtn);
		}

		if (this.contents) {
			this.contentsBtn = this.button('contents', __('Table of contents', 'softicon-flipbook'), () => this.contents.toggle());
			this.contentsBtn.setAttribute('aria-expanded', 'false');
			tools.append(this.contentsBtn);
		}

		if (this.thumbs) {
			this.thumbsBtn = this.button('thumbnails', __('Thumbnails', 'softicon-flipbook'), () => this.thumbs.toggle());
			this.thumbsBtn.setAttribute('aria-expanded', 'false');
			tools.append(this.thumbsBtn);
		}

		if (this.zoom) {
			const zoom = direction => {
				this.thumbs?.close(false);
				this.contents?.close(false);
				this.search?.close(false);
				this.zoom.step(direction);
			};
			this.zoomOutBtn = this.button('zoomOut', __('Zoom out', 'softicon-flipbook'), () => zoom(-1));
			this.zoomInBtn = this.button('zoomIn', __('Zoom in', 'softicon-flipbook'), () => zoom(1));
			tools.append(this.zoomOutBtn, this.zoomInBtn);
		}

		if (this.config.flipSound) {
			const toggle = this.button(this.sound ? 'soundOn' : 'soundOff', __('Page turn sound', 'softicon-flipbook'), () => {
				this.sound = !this.sound;
				toggle.innerHTML = icons[this.sound ? 'soundOn' : 'soundOff'];
				toggle.setAttribute('aria-pressed', this.sound ? 'true' : 'false');
			});
			toggle.setAttribute('aria-pressed', 'true');
			tools.append(toggle);
		}

		if (this.config.showPrint) {
			tools.append(this.button('print', __('Print', 'softicon-flipbook'), () => print(this)));
		}

		if (this.config.showDownload && 'pdf' === this.config.source) {
			const link = this.doc.createElement('a');
			link.className = 'alfb_btn alfb_btn_download';
			link.href = this.safeUrl(this.config.pdf) || '#';
			link.download = '';
			link.target = '_blank';
			link.rel = 'noopener';
			link.title = __('Download PDF', 'softicon-flipbook');
			link.setAttribute('aria-label', link.title);
			link.innerHTML = icons.download;
			tools.append(link);
		}

		if (this.config.showShare) {
			this.shareBtn = this.button('share', __('Share this page', 'softicon-flipbook'), () => this.share());
			this.shareBtn.setAttribute('aria-haspopup', 'dialog');
			tools.append(this.shareBtn);
		}

		if (this.config.showFullscreen) {
			this.fsBtn = this.button('fullscreen', __('Fullscreen', 'softicon-flipbook'), () => this.toggleFullscreen());
			tools.append(this.fsBtn);
		}

		bar.append(nav, tools);
		if (this.config.showSeek && this.count > 2) {
			bar.prepend(this.seekBar());
		}
		this.root.appendChild(bar);
		this.bar = bar;
		if (this.zoom) {
			this.onZoom();
		}
	}

	// a row above the buttons: dragging shows the page in the counter, letting go turns to it
	seekBar() {
		const row = this.doc.createElement('div');
		row.className = 'alfb_seek';
		const input = this.doc.createElement('input');
		input.type = 'range';
		input.min = 1;
		input.max = this.count;
		input.step = 1;
		input.value = 1;
		// the next page is on the left in a right to left book
		input.dir = this.rtl ? 'rtl' : 'ltr';
		input.style.setProperty('--alfb-seek-to', this.rtl ? 'left' : 'right');
		input.setAttribute('aria-label', __('Page', 'softicon-flipbook'));
		const label = () => sprintf(
			/* translators: 1: page number, 2: total pages */
			__('Page %1$s of %2$s', 'softicon-flipbook'), input.value, this.count);
		input.addEventListener('input', () => {
			this.seeking = true;
			this.seekFill();
			this.counter.textContent = sprintf(
				/* translators: 1: visible page or pages, 2: total pages */
				__('%1$s / %2$s', 'softicon-flipbook'), input.value, this.count);
			input.setAttribute('aria-valuetext', label());
		});
		input.addEventListener('change', () => {
			this.seeking = false;
			const index = parseInt(input.value, 10) - 1;
			// a page of the spread already open: only the counter goes back
			if (this.visible().includes(index)) {
				this.onChange();
			} else {
				this.go(index);
			}
		});
		row.append(input);
		this.seek = input;
		return row;
	}

	seekFill() {
		this.seek.style.setProperty('--alfb-seek', ((this.seek.value - 1) / (this.count - 1)) * 100 + '%');
	}

	// once, when the book first comes well into view: the corner of the next page lifts and settles back, so new
	// readers see the pages turn; not in the editor, for less motion, or once the reader has clicked or pressed a key
	pageHint() {
		if (!this.config.pageHint || this.editor || this.calm || this.count < 2 || !this.win.IntersectionObserver) {
			return;
		}
		let used = false;
		this.on(this.root, 'pointerdown', () => {
			used = true;
		}, true);
		this.on(this.root, 'keydown', () => {
			used = true;
		}, true);
		const watcher = new this.win.IntersectionObserver(entries => {
			if (entries.some(entry => entry.isIntersecting)) {
				watcher.disconnect();
				this.hintTimer = setTimeout(() => this.liftCorner(() => used), 700);
			}
		}, { threshold: 0.6 });
		watcher.observe(this.root);
		this.listeners.push(() => {
			watcher.disconnect();
			clearTimeout(this.hintTimer);
		});
	}

	// page-flip's own hover fold on the bottom corner of the next page (the left one in a right to left book)
	liftCorner(used) {
		if (used() || this.zoom?.active || 'read' !== this.flip.getState() || this.visible().includes(this.count - 1)) {
			return;
		}
		const rect = this.flip.getRender().getRect();
		const controller = this.flip.getFlipController();
		controller.showCorner({ x: this.rtl ? rect.left + 2 : rect.left + rect.width - 2, y: rect.top + rect.height - 2 });
		this.hintTimer = setTimeout(() => {
			// a point off the corners lets the page settle back
			if ('fold_corner' === this.flip.getState()) {
				controller.showCorner({ x: -1000, y: -1000 });
			}
		}, 1100);
	}

	// the book's keys: from inside the book, or (outside) pressed with nothing in focus while it is the book in view
	onKey(event, outside = false) {
		// the list of keys is open: Escape or ? closes it
		if (this.keys) {
			if ('Escape' === event.key || '?' === event.key) {
				event.preventDefault();
				this.closeKeys();
			}
			return;
		}
		// the thumbnail or contents panel covers the book, only Escape acts on it
		const panel = this.thumbs?.open ? this.thumbs : this.contents?.open ? this.contents : this.search?.open && this.search;
		if (panel) {
			if ('Escape' === event.key) {
				// preventDefault keeps a lightbox around the book open
				event.preventDefault();
				panel.close(true);
			}
			return;
		}
		// the page slider and the page number box use the arrow keys themselves
		if (event.target.closest?.('input, textarea, select')) {
			return;
		}
		const zoomKey = this.zoom && !event.ctrlKey && !event.metaKey;
		// the arrow keys follow the page on screen: right to left, ← is the next page;
		// Home and End only from inside the book, on the page they scroll it
		if (!outside && ('Home' === event.key || 'End' === event.key)) {
			event.preventDefault();
			this.go('Home' === event.key ? 0 : this.count - 1);
		} else if ('?' === event.key) {
			event.preventDefault();
			this.showKeys();
		} else if ('ArrowLeft' === event.key) {
			this.back();
		} else if ('ArrowRight' === event.key) {
			this.forward();
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
	}

	// the keyboard shortcuts in a small box over the book (the ? key)
	showKeys() {
		const box = this.doc.createElement('div');
		box.className = 'alfb_keys';
		box.setAttribute('role', 'dialog');
		box.setAttribute('aria-label', __('Keyboard shortcuts', 'softicon-flipbook'));
		box.tabIndex = -1;

		const title = this.doc.createElement('p');
		title.className = 'alfb_keys_title';
		title.textContent = __('Keyboard shortcuts', 'softicon-flipbook');

		const closeBtn = this.doc.createElement('button');
		closeBtn.type = 'button';
		closeBtn.className = 'alfb_btn alfb_keys_close';
		closeBtn.setAttribute('aria-label', __('Close', 'softicon-flipbook'));
		closeBtn.textContent = '×';
		closeBtn.addEventListener('click', () => this.closeKeys());

		// each key is also a button that does the same, for a mouse or a touch screen; the list stays open for more
		const close = () => this.closeKeys();
		const rows = [
			[[['←', __('Turn the page left', 'softicon-flipbook'), () => this.back()], ['→', __('Turn the page right', 'softicon-flipbook'), () => this.forward()]], __('Turn the page', 'softicon-flipbook')],
			[[['Home', __('First page', 'softicon-flipbook'), () => this.go(0)]], __('First page', 'softicon-flipbook')],
			[[['End', __('Last page', 'softicon-flipbook'), () => this.go(this.count - 1)]], __('Last page', 'softicon-flipbook')],
			...(this.zoom ? [[[['+', __('Zoom in', 'softicon-flipbook'), () => this.zoom.step(1)], ['−', __('Zoom out', 'softicon-flipbook'), () => this.zoom.step(-1)]], __('Zoom in or out', 'softicon-flipbook')]] : []),
			[[['Esc', __('Close this list', 'softicon-flipbook'), close]], __('Close a panel, the zoom or full screen', 'softicon-flipbook')],
			[[['?', __('Close this list', 'softicon-flipbook'), close]], __('Show or hide this list', 'softicon-flipbook')]
		];
		const list = this.doc.createElement('dl');
		rows.forEach(([keys, text]) => {
			const term = this.doc.createElement('dt');
			keys.forEach(([key, label, action]) => {
				const button = this.doc.createElement('button');
				button.type = 'button';
				button.className = 'alfb_key';
				button.textContent = key;
				button.setAttribute('aria-label', label);
				button.title = label;
				button.addEventListener('click', action);
				term.append(button);
			});
			const desc = this.doc.createElement('dd');
			desc.textContent = text;
			list.append(term, desc);
		});

		box.append(title, closeBtn, list);
		this.stage.append(box);
		this.keys = box;
		box.focus({ preventScroll: true });
		// a press on the book outside the box closes it
		this.keysOutside = event => {
			if (!box.contains(event.target)) {
				this.closeKeys();
			}
		};
		this.stage.addEventListener('pointerdown', this.keysOutside, true);
	}

	closeKeys() {
		this.stage.removeEventListener('pointerdown', this.keysOutside, true);
		this.keys?.remove();
		this.keys = null;
		this.root.focus({ preventScroll: true });
	}

	// a link for keyboard users to jump past the book and its many buttons, seen only when it has the focus;
	// before the book, which takes the focus itself for its arrow keys
	skipLink() {
		const end = this.doc.createElement('span');
		end.className = 'alfb_skip_end';
		end.tabIndex = -1;
		const link = this.doc.createElement('a');
		link.className = 'alfb_skip';
		link.href = '#';
		link.textContent = __('Skip the flipbook', 'softicon-flipbook');
		link.addEventListener('click', event => {
			event.preventDefault();
			end.focus();
		});
		this.root.before(link);
		this.root.after(end);
		this.listeners.push(() => {
			link.remove();
			end.remove();
		});
	}

	// a link to the page that is open (#page=5): the phone's share sheet, or copied on a computer
	async share() {
		// the editor's canvas has no address of its own to share
		if (this.editor) {
			this.toast(__('Sharing works on the published page.', 'softicon-flipbook'));
			return;
		}
		const url = new URL(this.win.location.href);
		// the book inside a lightbox popup is linked through its lightbox (owner)
		const number = bookNumber(this.owner || this.root);
		url.hash = 'page=' + (Math.min(...this.visible()) + 1) + (number > 1 ? '&book=' + number : '');
		this.sharing = this.sharing || new Share(this);
		await this.sharing.toggle(url.toString());
	}

	// a short message over the toolbar, read out by screen readers
	toast(text) {
		const note = this.doc.createElement('span');
		note.className = 'alfb_toast';
		note.setAttribute('role', 'status');
		note.textContent = text;
		this.root.append(note);
		setTimeout(() => note.remove(), 2000);
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
		this.sidePrev = side(this.rtl ? 'next' : 'prev', __('Previous page', 'softicon-flipbook'), () => this.prev());
		this.sideNext = side(this.rtl ? 'prev' : 'next', __('Next page', 'softicon-flipbook'), () => this.next());
	}

	// "Tap to read" over the book; a tap opens it full screen, the toolbar's button closes it again
	tapToRead() {
		const tap = this.doc.createElement('button');
		tap.type = 'button';
		tap.className = 'alfb_tap';
		tap.innerHTML = `<span>${icons.fullscreen}</span>`;
		tap.querySelector('span').append(this.doc.createTextNode(__('Tap to read', 'softicon-flipbook')));
		tap.addEventListener('click', () => this.toggleFullscreen());
		this.stage.append(tap);
		this.tap = tap;
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
			const title = this.root.querySelector(':scope > .alfb_title');
			const room = this.win.innerHeight - (this.bar ? this.bar.offsetHeight : 0) - (title ? title.offsetHeight + 10 : 0) - 32;
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
		this.fit();
		this.flip.update();
		this.onChange();
	}

	on(target, type, handler, options = false) {
		target.addEventListener(type, handler, options);
		this.listeners.push(() => target.removeEventListener(type, handler, options));
	}

	watch() {
		this.on(this.doc, 'fullscreenchange', () => this.setFullscreen(this.doc.fullscreenElement === this.root));

		if (this.editor) {
			// page-flip cancels the mouse press, which would leave the block unselected: the block takes the focus
			this.on(this.stage, 'pointerdown', () => this.root.closest('[data-block]')?.focus({ preventScroll: true }), true);
		}

		if (!this.editor) {
			// page-flip cancels the mouse press, so a click on a page would leave the arrow keys elsewhere
			this.on(this.stage, 'pointerdown', () => {
				if (!this.root.contains(this.doc.activeElement)) {
					this.root.focus({ preventScroll: true });
				}
			}, true);
			this.skipLink();
			// the first time the keyboard brings the focus into the book: how to see its keys
			let hinted = false;
			this.on(this.root, 'focusin', event => {
				if (!hinted && event.target.matches?.(':focus-visible')) {
					hinted = true;
					this.toast(__('Press ? for keyboard shortcuts', 'softicon-flipbook'));
				}
			});
			this.on(this.root, 'keydown', event => this.onKey(event));
			// keys pressed with nothing in focus (as after the page opens) go to the book in view
			books.add(this);
			this.listeners.push(() => books.delete(this));
			this.on(this.root, 'pointerdown', () => {
				lastBook = this;
			}, true);
			this.on(this.doc, 'keydown', event => {
				const nowhere = !event.target || event.target === this.doc.body || event.target === this.doc.documentElement;
				if (nowhere && !event.defaultPrevented && !event.altKey && bookInView(this.doc) === this) {
					this.onKey(event, true);
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
		this.contents?.destroy();
		this.autoplay?.destroy();
		this.sharing?.close();
		this.search?.destroy();
		this.cover?.destroy();
		this.sidePrev?.remove();
		this.sideNext?.remove();
		this.tap?.remove();
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
		this.root.querySelector(':scope > .alfb_title')?.remove();
		this.root.classList.remove('alfb_theme_dark', 'alfb_theme_auto');
		this.root.classList.remove('alfb_ready', 'alfb_error', 'alfb_overlay', 'alfb_is_fullscreen', 'alfb_zoomed', 'alfb_thumbs_open', 'alfb_contents_open', 'alfb_search_open', 'alfb_side_over', 'alfb_portrait');
	}
}
