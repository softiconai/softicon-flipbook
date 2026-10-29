import { __ } from '@wordpress/i18n';

// deeper bookmark levels keep this indent
const MAX_LEVEL = 3;

// the PDF's bookmarks as a list over the book, a click turns to that page
export default class Contents {
	constructor(book, outline) {
		this.book = book;
		this.doc = book.doc;
		this.outline = outline;
		this.panel = null;
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
		book.thumbs?.close(false);

		this.panel = this.doc.createElement('nav');
		this.panel.className = 'alfb_contents';
		this.panel.setAttribute('aria-label', book.contentsBtn.title);
		const list = this.doc.createElement('ul');
		this.add(list, this.outline, 0);
		this.panel.append(list);
		book.stage.append(this.panel);

		list.querySelector('a, button')?.focus({ preventScroll: true });
		book.onContents();
	}

	add(list, items, level) {
		for (const item of items) {
			const li = this.doc.createElement('li');
			li.append(this.entry(item, level));
			list.append(li);
			if (item.items?.length) {
				this.add(list, item.items, level + 1);
			}
		}
	}

	entry(item, level) {
		const { book } = this;
		const title = (item.title || '').trim() || __('Untitled', 'softicon-flipbook');
		const url = item.url ? book.safeUrl(item.url) : null;
		const el = this.doc.createElement(url ? 'a' : 'button');
		el.className = 'alfb_entry';
		el.style.paddingLeft = 12 + Math.min(level, MAX_LEVEL) * 16 + 'px';
		const name = this.doc.createElement('span');
		name.className = 'alfb_entry_title';
		name.textContent = title;
		const number = this.doc.createElement('span');
		number.className = 'alfb_entry_num';
		el.append(name, number);

		if (url) {
			el.href = url;
			el.target = '_blank';
			el.rel = 'noopener noreferrer';
			return el;
		}
		el.type = 'button';
		// the page number fills in once pdf.js has looked up the bookmark's target
		const page = book.destPage(item.dest);
		page.then(index => {
			if (null === index) {
				el.disabled = true;
				return;
			}
			number.textContent = index + 1;
		});
		el.addEventListener('click', async () => {
			const index = await page;
			if (null !== index) {
				this.close(false);
				book.go(index);
				book.contentsBtn.focus();
			}
		});
		return el;
	}

	close(refocus) {
		if (!this.panel) {
			return;
		}
		this.panel.remove();
		this.panel = null;
		this.book.onContents();
		if (refocus) {
			this.book.contentsBtn.focus();
		}
	}

	destroy() {
		this.close(false);
	}
}
