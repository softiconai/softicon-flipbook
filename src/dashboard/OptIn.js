import { useState } from '@wordpress/element';

// the Freemius opt-in; the words come from vendor/fs-lite (card()).
// Allow asks the server to send the opt-in; if the host blocks that, the browser posts the same fields to
// wp.freemius.com itself and Freemius sends it back to this page. Skip is a form to admin-post.php.
const sendFromBrowser = ({ action, fields }) => {
	const form = document.createElement('form');
	form.method = 'post';
	form.action = action;
	Object.entries(fields).forEach(([name, value]) => {
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = name;
		input.value = 'boolean' === typeof value ? (value ? '1' : '0') : String(value ?? '');
		form.append(input);
	});
	document.body.append(form);
	form.submit();
};

const OptIn = ({ card }) => {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');

	const allow = () => {
		setBusy(true);
		setError('');
		fetch(card.ajax, { method: 'POST', credentials: 'same-origin', body: new URLSearchParams({ action: card.allow.action, _ajax_nonce: card.allow.nonce }) })
			.then(response => response.json())
			.then(result => {
				if (result.success && result.data.browser) {
					sendFromBrowser(result.data.browser);
				} else if (result.success) {
					window.location.href = result.data.next;
				} else {
					throw new Error();
				}
			})
			.catch(() => {
				setBusy(false);
				setError(card.allow.error);
			});
	};

	return <section className='alfb-optin'>
		{card.icon && <img src={card.icon} alt='' width='56' height='56' />}
		<div className='alfb-optin-body'>
			<h2>{card.title}</h2>
			<p>{card.text}</p>
			<details>
				<summary>{card.shared}</summary>
				<ul>
					{card.permissions.map(item => <li key={item.title}>
						<span className={'dashicons dashicons-' + item.icon} aria-hidden='true' /><strong>{item.title}</strong> {item.text}
					</li>)}
				</ul>
				<p>{card.note} <a href={card.privacy.url} target='_blank' rel='noopener noreferrer'>{card.privacy.label}</a></p>
			</details>
			{error && <p className='alfb-optin-error' role='alert'>{error}</p>}
			<div className='alfb-optin-actions'>
				<button type='button' className='button button-primary button-hero alfb-optin-allow' onClick={allow} disabled={busy} aria-busy={busy}>{busy ? card.allow.busy : card.allow.label}</button>
				{card.skip && <form method='post' action={card.form}>
					<input type='hidden' name='action' value={card.skip.action} />
					<input type='hidden' name='_wpnonce' value={card.skip.nonce} />
					<button type='submit' className='button-link'>{card.skip.label}</button>
				</form>}
			</div>
		</div>
	</section>;
};

export default OptIn;
