// Scroll mode: the pages in one column that scrolls, the book's height tall. It has the parts of page-flip's API the
// viewer uses (Flipbook.js, Zoom.js), so the toolbar, thumbnails, contents, search, keys and add-ons work the same:
// "flip" turns to a page by scrolling to it, and the page at the top of the view is the open one.

// a page is this many times as wide as it is at the book's full height, at most, so it stays easy to read
const WIDER = 1.6;
// the page that has passed this share of the view's height is the open one
const LINE = 0.4;

export default class ScrollView {
	constructor(el, settings) {
		this.el = el;
		this.win = el.ownerDocument.defaultView || window;
		this.settings = settings;
		this.index = Math.max(0, settings.startPage || 0);
		this.handlers = {};
		this.pages = [];
		this.pageWidth = 0;
		this.pageHeight = 0;
	}

	getSettings() {
		return this.settings;
	}

	on(name, handler) {
		(this.handlers[name] = this.handlers[name] || []).push(handler);
		return this;
	}

	emit(name, data) {
		(this.handlers[name] || []).forEach(handler => handler({ data, object: this }));
	}

	loadFromHTML(pages) {
		this.pages = pages;
		this.el.classList.add('alfb_scroll');
		this.el.replaceChildren(...pages);
		this.layout();
		this.onScroll = () => {
			if (this.frame) {
				return;
			}
			this.frame = this.win.requestAnimationFrame(() => {
				this.frame = 0;
				// a jump from a button scrolls through the pages between: only where it lands counts
				if (!this.going) {
					this.set(this.atTop());
				}
			});
		};
		this.el.addEventListener('scroll', this.onScroll, { passive: true });
		// a long jump can scroll for longer than the timer below: browsers that tell when scrolling ends end it there
		this.onScrollEnd = () => {
			this.going = false;
		};
		this.el.addEventListener('scrollend', this.onScrollEnd);
		this.jump(this.index, false);
	}

	// pages as wide as the column allows, up to WIDER times their width at the book's full height
	layout() {
		const { maxWidth, maxHeight, ratio } = this.settings;
		this.el.style.height = maxHeight + 'px';
		const room = this.el.clientWidth || maxWidth;
		this.pageWidth = Math.max(100, Math.floor(Math.min(room, maxWidth * WIDER)));
		this.pageHeight = Math.round(this.pageWidth / ratio);
		this.pages.forEach(page => {
			page.style.width = this.pageWidth + 'px';
			page.style.height = this.pageHeight + 'px';
		});
	}

	// the last page whose top has passed the line in the view
	atTop() {
		const line = this.el.scrollTop + this.el.clientHeight * LINE;
		let index = 0;
		this.pages.forEach((page, i) => {
			if (page.offsetTop <= line) {
				index = i;
			}
		});
		// scrolled to the very end: the last page, even when it is short of the line
		if (this.el.scrollTop + this.el.clientHeight >= this.el.scrollHeight - 2) {
			index = this.pages.length - 1;
		}
		return index;
	}

	set(index) {
		if (index !== this.index) {
			this.index = index;
			this.emit('flip', index);
		}
	}

	jump(index, smooth) {
		if (!this.pages.length) {
			return;
		}
		index = Math.min(this.pages.length - 1, Math.max(0, index));
		const calm = this.win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		this.going = true;
		clearTimeout(this.goingTimer);
		this.goingTimer = setTimeout(() => {
			this.going = false;
		}, smooth && !calm ? 1500 : 60);
		this.el.scrollTo({ top: this.pages[index].offsetTop - this.pages[0].offsetTop, behavior: smooth && !calm ? 'smooth' : 'auto' });
		this.set(index);
	}

	flip(index) {
		this.jump(index, true);
	}

	turnToPage(index) {
		this.jump(index, false);
	}

	flipNext() {
		this.jump(this.index + 1, true);
	}

	flipPrev() {
		this.jump(this.index - 1, true);
	}

	turnToNextPage() {
		this.jump(this.index + 1, false);
	}

	turnToPrevPage() {
		this.jump(this.index - 1, false);
	}

	// sizes again, the same page stays at the top
	update() {
		const keep = this.index;
		this.layout();
		this.jump(keep, false);
	}

	getCurrentPageIndex() {
		return this.index;
	}

	getOrientation() {
		return 'portrait';
	}

	getState() {
		return 'read';
	}

	getBoundsRect() {
		return { left: 0, top: 0, width: this.pageWidth, height: this.pageHeight, pageWidth: this.pageWidth };
	}

	getRender() {
		return { getRect: () => this.getBoundsRect() };
	}

	// no page corners to lift or drags to stop
	getFlipController() {
		return { showCorner() {} };
	}

	getUI() {
		return null;
	}

	userStop() {}

	destroy() {
		this.el.removeEventListener('scroll', this.onScroll);
		this.el.removeEventListener('scrollend', this.onScrollEnd);
		clearTimeout(this.goingTimer);
		if (this.frame) {
			this.win.cancelAnimationFrame(this.frame);
		}
	}
}
