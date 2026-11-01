import { __, _n, sprintf } from '@wordpress/i18n';

// the first pages that contain the words, enough to read at a glance
const MAX_RESULTS = 50;

// search box over the book: the pages that contain the words, with a short excerpt; a click turns there
export default class Search {
	constructor(book) {
		this.book = book;
		this.doc = book.doc;
		this.panel = null;
		this.texts = [];
		this.round = 0;
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

	// a page's text, read once from the PDF
	text(index) {
		if (!this.texts[index]) {
			this.texts[index] = this.book.pdf.getPage(index + 1)
				.then(page => page.getTextContent())
				.then(content => content.items.map(item => item.str).join(' ').replace(/\s+/g, ' '))
				.catch(() => '');
		}
		return this.texts[index];
	}

	show() {
		const { book, doc } = this;
		book.zoom?.close();
		book.thumbs?.close(false);
		book.contents?.close(false);

		this.panel = doc.createElement('div');
		this.panel.className = 'alfb_search';
		this.panel.setAttribute('role', 'search');

		this.input = doc.createElement('input');
		this.input.type = 'search';
		this.input.className = 'alfb_search_input';
		this.input.placeholder = __('Search in this book', 'softicon-flipbook');
		this.input.setAttribute('aria-label', this.input.placeholder);
		this.input.value = this.query || '';

		this.status = doc.createElement('p');
		this.status.className = 'alfb_search_status';
		this.status.setAttribute('aria-live', 'polite');

		this.list = doc.createElement('ul');

		// typing stays in the box: no page turns or zoom; Escape closes
		this.input.addEventListener('keydown', event => {
			event.stopPropagation();
			if ('Escape' === event.key) {
				event.preventDefault();
				this.close(true);
			}
		});
		let timer;
		this.input.addEventListener('input', () => {
			clearTimeout(timer);
			timer = setTimeout(() => this.run(), 250);
		});

		this.panel.append(this.input, this.status, this.list);
		book.stage.append(this.panel);
		this.input.focus({ preventScroll: true });
		book.onSearch();
		if (this.input.value) {
			this.run();
		}
	}

	async run() {
		const words = this.input.value.trim();
		const query = words.toLowerCase();
		const round = ++this.round;
		this.query = words;
		this.list.replaceChildren();
		if (query.length < 2) {
			this.status.textContent = '';
			return;
		}
		this.status.textContent = __('Searching…', 'softicon-flipbook');
		let found = 0;
		for (let index = 0; index < this.book.count && found < MAX_RESULTS; index++) {
			const text = await this.text(index);
			// a newer search started, or the box was closed
			if (round !== this.round || !this.panel) {
				return;
			}
			const at = text.toLowerCase().indexOf(query);
			if (at >= 0) {
				found++;
				this.list.append(this.entry(index, text, at, query.length));
			}
		}
		this.status.textContent = found
			/* translators: %s: number of pages */
			? sprintf(_n('Found on %s page', 'Found on %s pages', found, 'softicon-flipbook'), found)
			: __('No pages found.', 'softicon-flipbook');
	}

	// the words in their sentence, with the match marked; all text, no HTML from the PDF
	entry(index, text, at, length) {
		const { book, doc } = this;
		const li = doc.createElement('li');
		const button = doc.createElement('button');
		button.type = 'button';
		button.className = 'alfb_entry';

		const excerpt = doc.createElement('span');
		excerpt.className = 'alfb_entry_title';
		const start = Math.max(0, at - 40);
		const end = Math.min(text.length, at + length + 60);
		const mark = doc.createElement('mark');
		mark.textContent = text.slice(at, at + length);
		excerpt.append((start > 0 ? '…' : '') + text.slice(start, at), mark, text.slice(at + length, end) + (end < text.length ? '…' : ''));

		const number = doc.createElement('span');
		number.className = 'alfb_entry_num';
		number.textContent = index + 1;

		button.append(excerpt, number);
		button.addEventListener('click', () => {
			this.close(false);
			book.go(index);
			book.searchBtn.focus();
		});
		li.append(button);
		return li;
	}

	close(refocus) {
		if (!this.panel) {
			return;
		}
		this.round++;
		this.panel.remove();
		this.panel = null;
		this.book.onSearch();
		if (refocus) {
			this.book.searchBtn.focus();
		}
	}

	destroy() {
		this.close(false);
	}
}
