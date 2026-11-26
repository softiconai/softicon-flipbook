import { __ } from '@wordpress/i18n';
import Flipbook, { openDocument } from './Flipbook';

const closeIcon = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path fill="currentColor" d="m13.06 12 6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06z"/></svg>';

// room the popup keeps around the book: close button row, dialog and block padding, toolbar
const CHROME = 136;
const HARDCOVER = 36;

// page 1 of a PDF drawn into a canvas, for a cover without an image; config: the book's settings (Pro: remote PDFs)
export const drawCover = async (url, doc, width, config) => {
	const task = await openDocument(url, doc, config);
	try {
		const pdf = await task.promise;
		const page = await pdf.getPage(1);
		const dpr = Math.min((doc.defaultView || window).devicePixelRatio || 1, 2);
		const viewport = page.getViewport({ scale: (width * dpr) / page.getViewport({ scale: 1 }).width });
		const canvas = doc.createElement('canvas');
		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);
		await page.render({ canvas, viewport }).promise;
		return canvas;
	} finally {
		task.destroy();
	}
};

// a cover, button or link on the page; a click opens the book in a modal dialog
export default class Lightbox {
	constructor(root, config) {
		this.root = root;
		this.doc = root.ownerDocument;
		this.win = this.doc.defaultView || window;
		this.config = config;
		this.trigger = root.querySelector('.alfb_lb_trigger');
		this.page = 0;
	}

	init() {
		this.anchor = this.root.dataset.anchor || '';
		if (this.anchor) {
			this.listen();
			return;
		}
		this.trigger.addEventListener('click', event => {
			// a cover, button or link an add-on sends to a new tab (SoftIcon Flipbook Pro's "Open in a new tab")
			if ('_blank' === this.trigger.target) {
				return;
			}
			event.preventDefault();
			this.open();
		});
	}

	// "Any link": a link to #name on this page (a menu item, a theme button, a link in the text) opens the book, and so
	// does arriving with #name in the address
	listen() {
		const hash = '#' + this.anchor;
		const ours = link => {
			const href = link.getAttribute('href') || '';
			if (href === hash) {
				return true;
			}
			try {
				const url = new URL(href, this.win.location.href);
				return url.hash === hash && url.origin + url.pathname === this.win.location.origin + this.win.location.pathname;
			} catch (e) {
				return false;
			}
		};
		this.doc.addEventListener('click', event => {
			const link = event.target.closest?.('a[href*="#"]');
			if (link && ours(link) && !event.defaultPrevented && 0 === event.button && !event.metaKey && !event.ctrlKey) {
				event.preventDefault();
				this.opener = link;
				this.open();
			}
		});
		const fromAddress = () => {
			if (this.win.location.hash === hash) {
				this.open();
			}
		};
		this.win.addEventListener('hashchange', fromAddress);
		fromAddress();
	}

	// the first page as the cover, when no image was set
	async cover() {
		const box = this.root.querySelector('.alfb_lb_img');
		if (!box || 'pdf' !== this.config.source) {
			return;
		}
		try {
			const width = parseInt(this.win.getComputedStyle(this.root).getPropertyValue('--alfb-lb-width'), 10) || 260;
			box.replaceChildren(await drawCover(this.config.pdf, this.doc, width, this.config));
			this.root.classList.remove('alfb_lb_draw');
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('SoftIcon Flipbook:', error);
		}
	}

	// the book fills the window height (or the share of it the popup size gives), less the room around it
	room() {
		// a title above the book takes a line too
		const chrome = CHROME + ('hardcover' === this.config.bookStyle ? HARDCOVER : 0) + (this.config.title ? 40 : 0);
		const share = { large: 0.85, medium: 0.7 }[this.config.lightboxSize] || 1;
		return Math.max(200, Math.round(this.win.innerHeight * share) - chrome);
	}

	open(page) {
		if (this.dialog) {
			if (page) {
				this.book?.go(page - 1);
			}
			return;
		}

		const dialog = this.doc.createElement('dialog');
		dialog.className = 'alfb_dialog alfb_backdrop_' + (['light', 'blur'].includes(this.config.lightboxBackdrop) ? this.config.lightboxBackdrop : 'dark');
		dialog.setAttribute('aria-label', this.trigger.textContent.trim() || this.trigger.getAttribute('aria-label') || __('Flipbook', 'softicon-flipbook'));

		const close = this.doc.createElement('button');
		close.type = 'button';
		close.className = 'alfb_dialog_close';
		close.setAttribute('aria-label', __('Close', 'softicon-flipbook'));
		close.title = close.getAttribute('aria-label');
		close.innerHTML = closeIcon;
		close.addEventListener('click', () => this.close());

		// the block's colors and design, the book itself is the same as an inline one
		const wrapper = this.doc.createElement('div');
		wrapper.className = 'alfb_wrapper alfb_js';
		wrapper.setAttribute('tabindex', '0');
		wrapper.setAttribute('role', 'region');
		wrapper.setAttribute('aria-label', __('Flipbook', 'softicon-flipbook'));
		for (const name of ['--alfb-bg', '--alfb-bar-bg', '--alfb-bar-color', '--alfb-cover']) {
			const value = this.root.style.getPropertyValue(name);
			if (value) {
				wrapper.style.setProperty(name, value);
			}
		}
		// SoftIcon Flipbook Pro: the block's toolbar style (alfb_tb_top, alfb_tb_float) in the popup too
		[...this.root.classList].filter(name => name.startsWith('alfb_tb_')).forEach(name => wrapper.classList.add(name));
		// with a background or toolbar color of its own the book keeps its light look in the popup
		wrapper.classList.toggle('alfb_has_bg', !!(this.root.style.getPropertyValue('--alfb-bg') || this.root.style.getPropertyValue('--alfb-bar-bg')));
		wrapper.innerHTML = '<div class="alfb_stage"><div class="alfb_loading"><span class="alfb_spinner"></span></div></div>';

		dialog.append(close, wrapper);
		// a click on the empty area around the book closes it, not one on the book, its cover board or the toolbar
		const empty = event => {
			if (![dialog, wrapper, this.book?.stage].includes(event.target)) {
				return false;
			}
			const book = wrapper.querySelector('.alfb_book')?.getBoundingClientRect();
			const board = 'hardcover' === this.config.bookStyle ? HARDCOVER : 0;
			return !(book && event.clientX > book.left - board && event.clientX < book.right + board && event.clientY > book.top - board && event.clientY < book.bottom + board);
		};
		// a page dragged off the book ends in a click on the empty area too, so the press must start there as well
		let pressedEmpty = false;
		dialog.addEventListener('pointerdown', event => {
			pressedEmpty = empty(event);
		});
		dialog.addEventListener('click', event => {
			if (pressedEmpty && empty(event)) {
				this.close();
			}
			pressedEmpty = false;
		});
		// Escape; the book keeps it while zoomed or showing thumbnails
		dialog.addEventListener('cancel', event => {
			event.preventDefault();
			// in fullscreen Escape only leaves fullscreen
			if (this.doc.fullscreenElement) {
				this.doc.exitFullscreen();
			} else {
				this.close();
			}
		});

		this.doc.body.append(dialog);
		this.doc.documentElement.classList.add('alfb_lb_open');
		dialog.showModal();
		wrapper.focus();
		this.dialog = dialog;
		// straight to full screen: the click still counts as the reader's own, so the browser allows it; the book's
		// own box goes full screen (browsers refuse a modal dialog), as with its Fullscreen button; a phone without
		// element fullscreen (iPhone) keeps the popup, which already fills the window
		if (this.config.lightboxFullscreen && wrapper.requestFullscreen && this.doc.fullscreenEnabled) {
			wrapper.requestFullscreen().catch(() => {});
			// the book starts after the switch: it takes the full screen size once it is ready
			wrapper.addEventListener('alfb:ready', () => {
				if (this.doc.fullscreenElement === wrapper) {
					this.book?.setFullscreen(true);
				}
			}, { once: true });
			this.onFullscreen = () => {
				if (!this.doc.fullscreenElement && this.dialog) {
					this.close();
				}
			};
			this.doc.addEventListener('fullscreenchange', this.onFullscreen);
		}

		// the popup sizes the book to the screen, whatever the block's tablet and phone heights
		this.book = new Flipbook(wrapper, { ...this.config, fitWidth: false, maxHeight: this.room(), maxHeightTablet: 0, maxHeightPhone: 0, startPage: page || this.page || this.config.startPage });
		this.book.owner = this.root;
		this.book.init();

		let timer;
		this.onResize = () => {
			clearTimeout(timer);
			timer = setTimeout(() => this.book?.setHeight(this.room()), 120);
		};
		this.win.addEventListener('resize', this.onResize);
	}

	close() {
		if (!this.dialog) {
			return;
		}
		// open again at the same page
		if (this.book?.flip) {
			this.page = Math.min(...this.book.visible()) + 1;
		}
		if (this.doc.fullscreenElement) {
			this.doc.exitFullscreen();
		}
		this.win.removeEventListener('resize', this.onResize);
		if (this.onFullscreen) {
			this.doc.removeEventListener('fullscreenchange', this.onFullscreen);
			this.onFullscreen = null;
		}
		this.book?.destroy();
		this.book = null;
		this.dialog.close();
		this.dialog.remove();
		this.dialog = null;
		this.doc.documentElement.classList.remove('alfb_lb_open');
		(this.opener || this.trigger).focus();
		this.opener = null;
		// "Any link" opened from the address: closing takes #name away, so a reload doesn't open it again
		if (this.anchor && this.win.location.hash === '#' + this.anchor) {
			this.win.history.replaceState(null, '', this.win.location.pathname + this.win.location.search);
		}
	}
}
