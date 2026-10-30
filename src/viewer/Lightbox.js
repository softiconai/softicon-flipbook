import { __ } from '@wordpress/i18n';
import Flipbook, { openDocument } from './Flipbook';

const closeIcon = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path fill="currentColor" d="m13.06 12 6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06z"/></svg>';

// room the popup keeps around the book: close button row, dialog and block padding, toolbar
const CHROME = 136;
const HARDCOVER = 36;

// page 1 of a PDF drawn into a canvas, for a cover without an image
export const drawCover = async (url, doc, width) => {
	const task = await openDocument(url, doc);
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
		this.trigger.addEventListener('click', event => {
			event.preventDefault();
			this.open();
		});
	}

	// the first page as the cover, when no image was set
	async cover() {
		const box = this.root.querySelector('.alfb_lb_img');
		if (!box || 'pdf' !== this.config.source) {
			return;
		}
		try {
			const width = parseInt(this.win.getComputedStyle(this.root).getPropertyValue('--alfb-lb-width'), 10) || 260;
			box.replaceChildren(await drawCover(this.config.pdf, this.doc, width));
			this.root.classList.remove('alfb_lb_draw');
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('SoftIcon Flipbook:', error);
		}
	}

	// the book fills the window height, less the room around it
	room() {
		const chrome = CHROME + ('hardcover' === this.config.bookStyle ? HARDCOVER : 0);
		return Math.max(200, this.win.innerHeight - chrome);
	}

	open(page) {
		if (this.dialog) {
			if (page) {
				this.book?.go(page - 1);
			}
			return;
		}

		const dialog = this.doc.createElement('dialog');
		dialog.className = 'alfb_dialog';
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

		this.book = new Flipbook(wrapper, { ...this.config, maxHeight: this.room(), startPage: page || this.page || this.config.startPage });
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
		this.book?.destroy();
		this.book = null;
		this.dialog.close();
		this.dialog.remove();
		this.dialog = null;
		this.doc.documentElement.classList.remove('alfb_lb_open');
		this.trigger.focus();
	}
}
