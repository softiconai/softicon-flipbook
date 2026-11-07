import { __ } from '@wordpress/i18n';

// Autoplay: the book turns its pages by itself while it is on screen. A mouse over the book holds it; a reader who
// clicks, drags or uses a key takes over and it stops. The toolbar's play / pause button starts and stops it, so
// moving content can always be paused (WCAG 2.2.2). Readers who ask for reduced motion start it themselves.
export default class Autoplay {
	constructor(book) {
		this.book = book;
		this.seconds = Math.min(60, Math.max(2, parseInt(book.config.autoplaySeconds, 10) || 4));
		this.loop = false !== book.config.autoplayLoop;
		this.stopped = !!book.win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		this.visible = false;
		this.hover = false;
	}

	// after the toolbar exists (Flipbook.build)
	start() {
		const { book } = this;
		const stop = () => this.stop();
		// the play button's own press is not a reader taking over; its icon is swapped on click, so the event's path
		// is checked rather than the (by then detached) target
		const other = event => !event.composedPath().includes(this.button) && stop();
		book.on(book.stage, 'pointerdown', stop);
		book.on(book.root, 'keydown', other);
		book.on(book.bar, 'click', other);
		book.on(book.stage, 'mouseenter', () => this.set('hover', true));
		book.on(book.stage, 'mouseleave', () => this.set('hover', false));
		if ('IntersectionObserver' in book.win) {
			this.observer = new book.win.IntersectionObserver(entries => this.set('visible', entries[0].isIntersecting), { threshold: 0.5 });
			this.observer.observe(book.root);
		} else {
			this.visible = true;
		}
		this.update();
	}

	set(key, value) {
		this[key] = value;
		this.update();
	}

	get playing() {
		return !this.stopped && this.visible && !this.hover;
	}

	// the timer runs only while it plays; the button shows what a press does
	update() {
		clearTimeout(this.timer);
		if (this.playing) {
			this.timer = setTimeout(() => this.turn(), this.seconds * 1000);
		}
		const button = this.button;
		if (button) {
			button.innerHTML = this.book.icon(this.stopped ? 'play' : 'pause');
			const label = this.stopped ? __('Play', 'softicon-flipbook') : __('Pause', 'softicon-flipbook');
			button.title = label;
			button.setAttribute('aria-label', label);
			button.setAttribute('aria-pressed', this.stopped ? 'false' : 'true');
		}
	}

	turn() {
		const { book } = this;
		const last = Math.max(...book.visible()) >= book.count - 1;
		if (last && !this.loop) {
			this.stop();
			return;
		}
		if (last) {
			// back to the cover in one step: page-flip does not animate a turn across the whole book
			book.turnTo(0);
		} else {
			book.next();
		}
		this.update();
	}

	toggle() {
		this.stopped = !this.stopped;
		this.update();
	}

	stop() {
		if (!this.stopped) {
			this.stopped = true;
			this.update();
		}
	}

	destroy() {
		clearTimeout(this.timer);
		this.observer?.disconnect();
	}
}
