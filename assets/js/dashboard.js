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

// Get Pro opens the Freemius checkout in a popup; the link opens it in a new tab if the script cannot load
const checkout = window.alfbCheckout;
let loading = null;

const loadCheckout = () => {
	loading = loading || new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = checkout.script;
		script.async = true;
		script.onload = () => (window.FS?.Checkout ? resolve(window.FS.Checkout) : reject(new Error('no checkout')));
		script.onerror = reject;
		document.head.append(script);
	}).catch(error => {
		loading = null;
		throw error;
	});
	return loading;
};

document.querySelectorAll('[data-alfb-checkout]').forEach(link => {
	link.addEventListener('click', async event => {
		if (!checkout || event.metaKey || event.ctrlKey || event.shiftKey || 0 !== event.button) {
			return;
		}
		event.preventDefault();
		link.setAttribute('aria-busy', 'true');
		try {
			const Checkout = await loadCheckout();
			new Checkout({ product_id: checkout.product, public_key: checkout.key, image: checkout.image }).open({
				licenses: link.dataset.alfbCheckout,
				billing_cycle: 'lifetime'
			});
		} catch (error) {
			window.open(link.href, '_blank', 'noopener');
		} finally {
			link.removeAttribute('aria-busy');
		}
	});
});
