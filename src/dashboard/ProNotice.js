import { __ } from '@wordpress/i18n';

// a Pro feature without an active license: a notice on the page, no popup
const ProNotice = ({ title, text, activate }) => <div className='alfb-card alfb-pro-notice'>
	<span className='dashicons dashicons-lock' aria-hidden='true' />
	<div>
		<span className='alfb-badge'>{__('Pro feature', 'softicon-flipbook')}</span>
		<h2>{title}</h2>
		<p>{text}</p>
		<p className='alfb-pro-notice-actions'>
			<a className='alfb-btn alfb-btn-amber' href='#/pricing'>{__('Unlock with Pro', 'softicon-flipbook')}</a>
			{activate && <a href={activate}>{__('I have a license key', 'softicon-flipbook')}</a>}
		</p>
	</div>
</div>;

export default ProNotice;
