// CSS pixels, drawn at up to twice that for sharp screens
const THUMB_WIDTH = 160;

// a grid of all pages over the book, a click turns to that page
export default class Thumbnails {
	constructor(book) {
		this.book = book;
		this.doc = book.doc;
		this.panel = null;
		this.items = [];
		// JPEG object URLs of drawn PDF pages, kept until the book is destroyed
		this.urls = [];
		this.queue = Promise.resolve();
	}

	get open() {
		return !!this.panel;
	}

	toggle() {
		if (this.panel) {
			this.close(true);
		} else {
			this.show();
		}
	}

	show() {
		const { book } = this;
		book.zoom?.close();
		book.contents?.close(false);
		const current = book.visible();

		this.panel = this.doc.createElement('div');
		this.panel.className = 'alfb_thumbs';
		this.panel.setAttribute('role', 'region');
		this.panel.setAttribute('aria-label', book.thumbsBtn.title);

		this.items = book.pages.map((page, index) => {
			const item = this.doc.createElement('button');
			item.type = 'button';
			item.className = 'alfb_thumb';
			item.setAttribute('aria-label', page.getAttribute('aria-label'));
			if (current.includes(index)) {
				item.classList.add('alfb_current');
				item.setAttribute('aria-current', 'page');
			}

			const box = this.doc.createElement('span');
			box.className = 'alfb_thumb_img';
			box.style.aspectRatio = String(book.ratio);
			const number = this.doc.createElement('span');
			number.className = 'alfb_thumb_num';
			number.setAttribute('aria-hidden', 'true');
			number.textContent = index + 1;
			item.append(box, number);

			item.addEventListener('click', () => {
				this.close(false);
				book.go(index);
				book.thumbsBtn.focus();
			});
			return item;
		});
		this.panel.append(...this.items);
		book.stage.append(this.panel);

		// draw only the thumbnails scrolled near the view
		this.observer = new book.win.IntersectionObserver(entries => entries.forEach(entry => {
			if (entry.isIntersecting) {
				this.observer.unobserve(entry.target);
				this.draw(this.items.indexOf(entry.target));
			}
		}), { root: this.panel, rootMargin: '200px 0px' });
		this.items.forEach(item => this.observer.observe(item));

		// the open page in the middle of the panel, without scrolling the window
		const active = this.items[current[0]] || this.items[0];
		this.panel.scrollTop = active.offsetTop - (this.panel.clientHeight - active.offsetHeight) / 2;
		active.focus({ preventScroll: true });
		book.onThumbs();
	}

	draw(index) {
		if (this.urls[index]) {
			this.place(index, this.urls[index]);
			return;
		}
		if ('images' === this.book.config.source) {
			const image = this.book.config.images[index];
			this.place(index, image.thumb || image.url);
			return;
		}
		this.queue = this.queue.then(() => this.render(index)).catch(() => {});
	}

	async render(index) {
		if (!this.panel || this.urls[index]) {
			return;
		}
		const width = Math.round(THUMB_WIDTH * Math.min(this.book.win.devicePixelRatio || 1, 2));
		const source = this.book.pages[index].querySelector('canvas');
		let canvas;
		if (source && source.width >= width) {
			// the page is already drawn in the book, shrink that instead of rendering again
			canvas = this.doc.createElement('canvas');
			canvas.width = width;
			canvas.height = Math.round(width * source.height / source.width);
			canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
		} else {
			canvas = await this.book.drawPage(index, width);
		}

		const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
		if (blob && !this.book.destroyed) {
			this.urls[index] = URL.createObjectURL(blob);
			this.place(index, this.urls[index]);
		}
	}

	place(index, url) {
		const box = this.items[index]?.firstChild;
		if (!this.panel || !box || box.firstChild) {
			return;
		}
		const img = this.doc.createElement('img');
		img.src = url;
		img.alt = '';
		img.decoding = 'async';
		box.append(img);
	}

	close(refocus) {
		if (!this.panel) {
			return;
		}
		this.observer.disconnect();
		this.panel.remove();
		this.panel = null;
		this.items = [];
		this.book.onThumbs();
		if (refocus) {
			this.book.thumbsBtn.focus();
		}
	}

	destroy() {
		this.close(false);
		this.urls.forEach(url => url && URL.revokeObjectURL(url));
		this.urls = [];
	}
}
