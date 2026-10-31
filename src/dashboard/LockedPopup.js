import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// SoftIcon Flipbook Pro without an active license: a Pro tab or demo opens this instead
const LockedPopup = ({ open, activate, onClose }) => {
	const dialog = useRef();

	useEffect(() => {
		const el = dialog.current;
		if (open && el && !el.open) {
			el.showModal();
		} else if (!open && el?.open) {
			el.close();
		}
	}, [open]);

	return <dialog ref={dialog} className='alfb-locked-popup' aria-labelledby='alfb-locked-title' onClose={onClose}
		onClick={event => event.target === dialog.current && dialog.current.close()}>
		<span className='dashicons dashicons-lock' aria-hidden='true' />
		<h2 id='alfb-locked-title'>{__('This is a Pro feature', 'softicon-flipbook')}</h2>
		<p>{__('Activate your SoftIcon Flipbook Pro license to use it, or get a license from the Pricing page.', 'softicon-flipbook')}</p>
		<p className='alfb-locked-actions'>
			<a className='alfb-btn alfb-btn-teal' href='#/pricing' onClick={() => dialog.current.close()}>{__('See pricing', 'softicon-flipbook')}</a>
			{activate && <a className='alfb-btn alfb-btn-light-outline' href={activate}>{__('Activate license', 'softicon-flipbook')}</a>}
		</p>
		<button type='button' className='alfb-locked-close' aria-label={__('Close', 'softicon-flipbook')} onClick={() => dialog.current.close()}>
			<span className='dashicons dashicons-no-alt' aria-hidden='true' />
		</button>
	</dialog>;
};

export default LockedPopup;
