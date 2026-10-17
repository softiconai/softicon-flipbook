import './public-path';
import Flipbook, { linkedPage } from './viewer/Flipbook';

const start = el => {
	if (el.alfb) {
		return;
	}
	try {
		el.alfb = new Flipbook(el, JSON.parse(el.dataset.alfb || '{}'));
		el.alfb.init();
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('SoftIcon Flipbook:', e);
	}
};

const boot = () => {
	const books = document.querySelectorAll('.alfb_wrapper[data-alfb]');
	if (!books.length) {
		return;
	}
	// shows the spinner, a page without JavaScript keeps only the PDF link
	books.forEach(el => el.classList.add('alfb_js'));

	// a #page=5 link: bring the first flipbook into view, it opens at that page when it starts,
	// later links on the same page turn it there
	if (linkedPage(window)) {
		books[0].scrollIntoView({ block: 'center' });
	}
	window.addEventListener('hashchange', () => {
		const page = linkedPage(window);
		if (page) {
			books[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
			if (books[0].alfb?.flip) {
				books[0].alfb.go(page - 1);
			}
		}
	});

	// pdf.js and the page-flip engine load only when a flipbook gets near the screen
	if (!('IntersectionObserver' in window)) {
		books.forEach(start);
		return;
	}
	const observer = new IntersectionObserver(entries => entries.forEach(entry => {
		if (entry.isIntersecting) {
			observer.unobserve(entry.target);
			start(entry.target);
		}
	}), { rootMargin: '300px 0px' });
	books.forEach(el => observer.observe(el));
};

if ('loading' === document.readyState) {
	document.addEventListener('DOMContentLoaded', boot);
} else {
	boot();
}
