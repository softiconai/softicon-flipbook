// the Flipbook dashboard: the feature filter, the video popup and the Freemius checkout (bundled, MIT)
import { Checkout } from '@freemius/checkout';

// the filter box above the Free vs Pro feature table
document.querySelectorAll('[data-alfb-filter]').forEach(section => {
	const input = section.querySelector('input[type="search"]');
	const groups = [...section.querySelectorAll('tbody:not(.alfb-empty)')];
	const empty = section.querySelector('.alfb-empty');

	input?.addEventListener('input', () => {
		const words = input.value.trim().toLowerCase();
		let shown = 0;
		groups.forEach(group => {
			const title = group.querySelector('.alfb-group').textContent.toLowerCase();
			const rows = [...group.querySelectorAll('tr:not(.alfb-group)')];
			// a group name match keeps its whole group
			const all = !words || title.includes(words);
			let count = 0;
			rows.forEach(row => {
				row.hidden = !all && !row.textContent.toLowerCase().includes(words);
				count += row.hidden ? 0 : 1;
			});
			group.hidden = 0 === count;
			shown += count;
		});
		empty.hidden = 0 < shown;
	});
});

// Get Pro opens the Freemius checkout in a popup; the link opens it in a new tab if that fails
const config = window.alfbCheckout;

document.querySelectorAll('[data-alfb-checkout]').forEach(link => {
	link.addEventListener('click', event => {
		if (!config || event.metaKey || event.ctrlKey || event.shiftKey || 0 !== event.button) {
			return;
		}
		event.preventDefault();
		try {
			new Checkout({ product_id: config.product, plan_id: link.dataset.alfbPlan, public_key: config.key, image: config.image }).open({
				licenses: link.dataset.alfbCheckout,
				billing_cycle: link.dataset.alfbCycle
			});
		} catch (error) {
			window.open(link.href, '_blank', 'noopener');
		}
	});
});

// a YouTube link plays in a popup; youtube-nocookie.com, and only after the click
const popup = document.querySelector('.alfb-video-popup');

const embedUrl = href => {
	const url = new URL(href);
	const id = url.searchParams.get('v') || ('youtu.be' === url.hostname ? url.pathname.slice(1) : '');
	const list = url.searchParams.get('list');
	if (id) {
		return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
	}
	return list ? `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}&autoplay=1&rel=0` : '';
};

if (popup?.showModal) {
	const frame = popup.querySelector('.alfb-video-frame');

	document.querySelectorAll('[data-alfb-video]').forEach(link => {
		link.addEventListener('click', event => {
			const src = embedUrl(link.href);
			if (!src || event.metaKey || event.ctrlKey || event.shiftKey || 0 !== event.button) {
				return;
			}
			event.preventDefault();
			const iframe = document.createElement('iframe');
			iframe.src = src;
			iframe.title = link.textContent.trim();
			iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
			iframe.allowFullscreen = true;
			frame.replaceChildren(iframe);
			popup.showModal();
		});
	});

	// closing stops the video
	popup.addEventListener('close', () => frame.replaceChildren());
	popup.querySelector('.alfb-video-close').addEventListener('click', () => popup.close());
	popup.addEventListener('click', event => event.target === popup && popup.close());
}
