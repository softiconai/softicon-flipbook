import './public-path';
import Flipbook, { linkedPage } from './viewer/Flipbook';
import Lightbox from './viewer/Lightbox';

const start = el => {
	if (el.alfb) {
		return;
	}
	try {
		const config = JSON.parse(el.dataset.alfb || '{}');
		el.alfb = el.classList.contains('alfb_lb') ? new Lightbox(el, config) : new Flipbook(el, config);
		el.alfb.init();
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('SoftIcon Flipbook:', e);
	}
};

// pdf.js and the page-flip engine load only when a flipbook gets near the screen,
// for a lightbox only to draw a cover that has no image
const whenNear = (elements, callback) => {
	if (!('IntersectionObserver' in window)) {
		elements.forEach(callback);
		return;
	}
	const observer = new IntersectionObserver(entries => entries.forEach(entry => {
		if (entry.isIntersecting) {
			observer.unobserve(entry.target);
			callback(entry.target);
		}
	}), { rootMargin: '300px 0px' });
	elements.forEach(el => observer.observe(el));
};

const boot = () => {
	const all = [...document.querySelectorAll('.alfb_wrapper[data-alfb], .alfb_lb[data-alfb]')];
	if (!all.length) {
		return;
	}
	const books = all.filter(el => !el.classList.contains('alfb_lb'));
	const boxes = all.filter(el => el.classList.contains('alfb_lb'));

	// shows the spinner, a page without JavaScript keeps only the PDF link
	books.forEach(el => el.classList.add('alfb_js'));
	// a lightbox only waits for clicks
	boxes.forEach(start);
	whenNear(boxes.filter(el => el.classList.contains('alfb_lb_draw')), el => el.alfb?.cover());

	// a #page=5 link: bring the first flipbook into view, it opens at that page when it starts,
	// later links on the same page turn it there; a lightbox opens at that page
	const first = all[0];
	const toPage = page => {
		if (first.alfb instanceof Lightbox) {
			first.alfb.open(page);
			return;
		}
		first.scrollIntoView({ block: 'center', behavior: 'smooth' });
		if (first.alfb?.flip) {
			first.alfb.go(page - 1);
		}
	};
	if (linkedPage(window)) {
		if (first.alfb instanceof Lightbox) {
			first.alfb.open(linkedPage(window));
		} else {
			first.scrollIntoView({ block: 'center' });
		}
	}
	window.addEventListener('hashchange', () => {
		const page = linkedPage(window);
		if (page) {
			toPage(page);
		}
	});

	whenNear(books, start);
};

if ('loading' === document.readyState) {
	document.addEventListener('DOMContentLoaded', boot);
} else {
	boot();
}
