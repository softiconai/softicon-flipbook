// the Freemius opt-in; the words and the two forms come from vendor/fs-lite (card()), the buttons post to admin-post.php
const OptIn = ({ card }) => <section className='alfb-optin'>
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
		<div className='alfb-optin-actions'>
			{['allow', 'skip'].filter(button => card[button]).map(button => <form key={button} method='post' action={card.form}>
				<input type='hidden' name='action' value={card[button].action} />
				<input type='hidden' name='_wpnonce' value={card[button].nonce} />
				<button type='submit' className={'allow' === button ? 'button button-primary button-hero alfb-optin-allow' : 'button-link'}>{card[button].label}</button>
			</form>)}
		</div>
	</div>
</section>;

export default OptIn;
