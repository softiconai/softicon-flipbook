// Plugins page: the reason form when Flipbook is deactivated, and the Opt In / Opt Out link
const lite = window.alfbFsLite;
const modal = document.getElementById('alfb-fs-deactivate');
const row = lite && document.querySelector(`tr[data-plugin="${CSS.escape(lite.plugin)}"]`);

const post = data => fetch(lite.ajax, {
	method: 'POST',
	credentials: 'same-origin',
	body: new URLSearchParams(data)
}).then(response => response.json());

const deactivateLink = row?.querySelector('.deactivate a');

if (modal && deactivateLink) {
	const form = modal.querySelector('form');
	const submit = form.querySelector('[type="submit"]');
	let opener = null;

	const close = () => {
		modal.hidden = true;
		opener?.focus();
	};
	const leave = () => {
		window.location.href = deactivateLink.href;
	};

	deactivateLink.addEventListener('click', event => {
		event.preventDefault();
		opener = deactivateLink;
		modal.hidden = false;
		form.querySelector('input[type="radio"]').focus();
	});

	// the text box of the chosen reason only
	form.addEventListener('change', event => {
		if ('radio' !== event.target.type) {
			return;
		}
		form.querySelectorAll('input[type="text"]').forEach(input => {
			const show = input.parentElement.contains(event.target);
			input.hidden = !show;
			input.disabled = !show;
		});
		event.target.closest('li').querySelector('input[type="text"]')?.focus();
		submit.disabled = false;
	});

	form.addEventListener('submit', event => {
		event.preventDefault();
		const reason = form.querySelector('input[name="reason"]:checked');
		if (!reason) {
			return;
		}
		submit.disabled = true;
		const info = reason.closest('li').querySelector('input[type="text"]');
		post({ action: 'alfb_fs_reason', _ajax_nonce: lite.reason, reason: reason.value, info: info ? info.value : '' }).finally(leave);
	});

	modal.querySelector('.alfb-fs-skip').addEventListener('click', leave);
	modal.querySelector('.alfb-fs-cancel').addEventListener('click', close);
	modal.addEventListener('click', event => event.target === modal && close());
	modal.addEventListener('keydown', event => 'Escape' === event.key && close());
}

row?.querySelector('.alfb-fs-tracking')?.addEventListener('click', event => {
	event.preventDefault();
	const link = event.currentTarget;
	const enable = '1' === link.dataset.enable;
	if (!enable && !window.confirm(lite.optOut)) {
		return;
	}
	link.setAttribute('aria-busy', 'true');
	post({ action: 'alfb_fs_tracking', _ajax_nonce: lite.tracking, enable: enable ? '1' : '' }).then(result => {
		if (result.success && result.data?.url) {
			window.location.href = result.data.url;
		} else if (result.success) {
			window.location.reload();
		} else {
			window.alert(result.data?.message || 'Error');
			link.removeAttribute('aria-busy');
		}
	});
});
