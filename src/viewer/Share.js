import { __ } from '@wordpress/i18n';

// The share button: a phone opens its own share sheet; elsewhere a small menu with the social networks, email and
// Copy link. The link opens this book at the page that is open (#page=5).
const networks = () => [
	['facebook', 'Facebook', (url, title) => `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`],
	['x', 'X', (url, title) => `https://x.com/intent/post?url=${url}&text=${title}`],
	['linkedin', 'LinkedIn', url => `https://www.linkedin.com/sharing/share-offsite/?url=${url}`],
	['pinterest', 'Pinterest', (url, title) => `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`],
	['email', __('Email', 'softicon-flipbook'), (url, title) => `mailto:?subject=${title}&body=${url}`]
];

export default class Share {
	constructor(book) {
		this.book = book;
		this.close = this.close.bind(this);
	}

	async toggle(link) {
		const { win } = this.book;
		const nav = win.navigator;
		// phones and tablets: the system share sheet
		if (nav.share && win.matchMedia?.('(pointer: coarse)').matches) {
			try {
				await nav.share({ title: this.book.doc.title, url: link });
			} catch (e) {
				// closed without sharing
			}
			return;
		}
		if (this.menu) {
			this.close();
			return;
		}
		this.open(link);
	}

	open(link) {
		const { doc, root } = this.book;
		const url = encodeURIComponent(link);
		const title = encodeURIComponent(doc.title);
		const menu = doc.createElement('div');
		menu.className = 'alfb_share_menu';
		menu.setAttribute('role', 'dialog');
		menu.setAttribute('aria-label', __('Share this page', 'softicon-flipbook'));
		networks().forEach(([key, label, href]) => {
			const a = doc.createElement('a');
			a.className = 'alfb_share_' + key;
			a.href = href(url, title);
			if ('email' !== key) {
				a.target = '_blank';
				a.rel = 'noopener noreferrer';
			}
			a.textContent = label;
			a.addEventListener('click', () => setTimeout(this.close));
			menu.append(a);
		});
		const copy = doc.createElement('button');
		copy.type = 'button';
		copy.className = 'alfb_share_copy';
		copy.textContent = __('Copy link', 'softicon-flipbook');
		copy.addEventListener('click', async () => {
			this.close();
			try {
				await this.book.win.navigator.clipboard.writeText(link);
				this.book.toast(__('Link copied', 'softicon-flipbook'));
			} catch (e) {
				this.book.win.prompt(__('Copy this link', 'softicon-flipbook'), link);
			}
		});
		menu.append(copy);
		// typing in the menu must not turn pages
		menu.addEventListener('keydown', event => {
			event.stopPropagation();
			if ('Escape' === event.key) {
				event.preventDefault();
				this.close();
				this.book.shareBtn?.focus();
			}
		});
		root.append(menu);
		this.menu = menu;
		this.book.shareBtn?.setAttribute('aria-expanded', 'true');
		menu.querySelector('a').focus({ preventScroll: true });
		setTimeout(() => doc.addEventListener('click', this.outside = event => !menu.contains(event.target) && !this.book.shareBtn?.contains(event.target) && this.close()));
	}

	close() {
		this.menu?.remove();
		this.menu = null;
		this.book.shareBtn?.setAttribute('aria-expanded', 'false');
		if (this.outside) {
			this.book.doc.removeEventListener('click', this.outside);
			this.outside = null;
		}
	}
}
