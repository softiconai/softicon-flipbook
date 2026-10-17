// toolbar steps, pinch and Ctrl + scroll zoom freely between 1 and MAX
const STEPS = [1, 1.5, 2, 3, 4];
const MAX = 4;
// iOS Safari draws nothing on canvases above about 16.7 million pixels
const MAX_PIXELS = 16e6;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = touches => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
const middle = touches => ({ x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 });

// a scrollable, sharper copy of the open pages laid over the book
export default class Zoom {
	constructor(book) {
		this.book = book;
		this.doc = book.doc;
		this.level = 1;
		this.view = null;
		this.pinch = null;
		this.timer = 0;
		this.token = 0;
		this.attach();
	}

	get active() {
		return !!this.view;
	}

	get atMax() {
		return this.level >= MAX - 0.01;
	}

	step(direction) {
		const next = direction > 0
			? STEPS.find(step => step > this.level + 0.01)
			: [...STEPS].reverse().find(step => step < this.level - 0.01);
		this.set(next || (direction > 0 ? MAX : 1));
	}

	// focus is the screen point that stays in place, the middle of the view by default
	set(level, focus) {
		level = clamp(level, 1, MAX);
		if (level < 1.02) {
			this.close();
			return;
		}

		let fraction = null;
		if (!this.view) {
			fraction = this.pagesFraction(focus);
			this.open();
		}
		const { view, inner } = this;
		const box = view.getBoundingClientRect();
		const x = focus ? focus.x - box.left : view.clientWidth / 2;
		const y = focus ? focus.y - box.top : view.clientHeight / 2;
		fraction = fraction || {
			x: (view.scrollLeft + x - inner.offsetLeft) / inner.offsetWidth,
			y: (view.scrollTop + y - inner.offsetTop) / inner.offsetHeight
		};

		this.level = level;
		this.layout();
		view.scrollLeft = inner.offsetLeft + fraction.x * inner.offsetWidth - x;
		view.scrollTop = inner.offsetTop + fraction.y * inner.offsetHeight - y;
		this.schedule();
		this.book.onZoom();
	}

	// where the focus point falls on the open pages, 0 to 1 each way
	pagesFraction(focus) {
		if (!focus) {
			return { x: 0.5, y: 0.5 };
		}
		const rects = this.book.visible().map(index => this.book.pages[index].getBoundingClientRect());
		const left = Math.min(...rects.map(rect => rect.left));
		const right = Math.max(...rects.map(rect => rect.right));
		const top = Math.min(...rects.map(rect => rect.top));
		const bottom = Math.max(...rects.map(rect => rect.bottom));
		return {
			x: clamp((focus.x - left) / (right - left || 1), 0, 1),
			y: clamp((focus.y - top) / (bottom - top || 1), 0, 1)
		};
	}

	open() {
		this.view = this.doc.createElement('div');
		this.view.className = 'alfb_zoom';
		this.inner = this.doc.createElement('div');
		this.inner.className = 'alfb_zoom_inner';
		this.view.append(this.inner);
		this.book.stage.append(this.view);
		this.fill();
		this.drag();
		this.view.addEventListener('dblclick', () => this.set(1));
	}

	// copies of the open pages, blurry until render() draws them sharp
	fill() {
		this.shown = this.book.visible();
		this.sharp = this.shown.map(() => 0);
		this.inner.replaceChildren(...this.shown.map(index => {
			const page = this.doc.createElement('div');
			page.className = 'alfb_zoom_page';
			page.setAttribute('role', 'img');
			page.setAttribute('aria-label', this.book.pages[index].getAttribute('aria-label'));
			page.append(this.copy(index));
			return page;
		}));
	}

	copy(index) {
		if ('images' === this.book.config.source) {
			const image = this.book.config.images[index];
			const img = this.doc.createElement('img');
			img.src = image.url;
			img.alt = image.alt || '';
			return img;
		}
		const canvas = this.doc.createElement('canvas');
		const source = this.book.pages[index].querySelector('canvas');
		if (source) {
			canvas.width = source.width;
			canvas.height = source.height;
			canvas.getContext('2d').drawImage(source, 0, 0);
		}
		return canvas;
	}

	layout() {
		const rect = this.book.flip.getBoundsRect();
		const width = Math.round(rect.pageWidth * this.level);
		const height = Math.round(rect.height * this.level);
		this.inner.style.width = width * this.shown.length + 'px';
		this.inner.style.height = height + 'px';
		[...this.inner.children].forEach(page => {
			page.style.width = width + 'px';
			page.style.height = height + 'px';
		});
	}

	schedule() {
		clearTimeout(this.timer);
		this.timer = setTimeout(() => this.render(), 150);
	}

	// redraws the PDF pages at the zoomed size once the level stops changing
	async render() {
		if (!this.view || 'images' === this.book.config.source) {
			return;
		}
		const token = ++this.token;
		const rect = this.book.flip.getBoundsRect();
		const dpr = Math.min(this.book.win.devicePixelRatio || 1, 2);
		const width = Math.min(Math.ceil(rect.pageWidth * this.level * dpr), Math.floor(Math.sqrt(MAX_PIXELS * this.book.ratio)));

		for (let k = 0; k < this.shown.length; k++) {
			if (this.sharp[k] >= width) {
				continue;
			}
			const canvas = await this.book.drawPage(this.shown[k], width).catch(() => null);
			if (token !== this.token || !this.view) {
				return;
			}
			if (canvas) {
				this.inner.children[k].replaceChildren(canvas);
				this.sharp[k] = width;
			}
		}
	}

	// the book turned a page or changed size
	update() {
		if (!this.view) {
			return;
		}
		if (this.book.visible().join() === this.shown.join()) {
			this.set(this.level);
			return;
		}
		this.token++;
		this.fill();
		this.layout();
		this.view.scrollTop = 0;
		this.view.scrollLeft = 0;
		this.schedule();
	}

	close() {
		clearTimeout(this.timer);
		this.token++;
		this.view?.remove();
		this.view = null;
		this.level = 1;
		this.book.onZoom();
	}

	// mouse drag pans, touch scrolls natively
	drag() {
		const { view } = this;
		let start = null;
		view.addEventListener('pointerdown', event => {
			if ('mouse' !== event.pointerType || 0 !== event.button) {
				return;
			}
			start = { x: event.clientX, y: event.clientY, left: view.scrollLeft, top: view.scrollTop };
			view.setPointerCapture(event.pointerId);
			view.classList.add('alfb_dragging');
		});
		view.addEventListener('pointermove', event => {
			if (start) {
				view.scrollLeft = start.left - (event.clientX - start.x);
				view.scrollTop = start.top - (event.clientY - start.y);
			}
		});
		const end = () => {
			start = null;
			view.classList.remove('alfb_dragging');
		};
		view.addEventListener('pointerup', end);
		view.addEventListener('pointercancel', end);
	}

	attach() {
		const { book } = this;
		const { stage } = book;
		// capture on the stage runs before page-flip's own touch listeners inside it
		const options = { capture: true, passive: false };

		book.on(stage, 'touchstart', event => {
			if (2 !== event.touches.length || book.thumbs?.open) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			book.cancelTouch();
			this.pinch = { distance: distance(event.touches), level: this.level };
		}, options);

		book.on(stage, 'touchmove', event => {
			if (!this.pinch) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			if (2 === event.touches.length) {
				this.set(this.pinch.level * distance(event.touches) / this.pinch.distance, middle(event.touches));
			}
		}, options);

		const end = event => {
			if (this.pinch && !event.touches.length) {
				this.pinch = null;
			}
		};
		book.on(stage, 'touchend', end, options);
		book.on(stage, 'touchcancel', end, options);

		// trackpad pinch and Ctrl + mouse wheel
		book.on(stage, 'wheel', event => {
			if (!event.ctrlKey || book.thumbs?.open) {
				return;
			}
			event.preventDefault();
			this.set(this.level * Math.exp(-event.deltaY / 100), { x: event.clientX, y: event.clientY });
		}, options);

		// Safari on a Mac sends trackpad pinch as gesture events, iPhones also send them next to the touches
		let gestureStart = 1;
		book.on(stage, 'gesturestart', event => {
			event.preventDefault();
			gestureStart = this.level;
		}, options);
		book.on(stage, 'gesturechange', event => {
			event.preventDefault();
			if (!this.pinch && !book.thumbs?.open) {
				this.set(gestureStart * event.scale, { x: event.clientX, y: event.clientY });
			}
		}, options);
	}
}
