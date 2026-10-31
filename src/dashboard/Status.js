import { __ } from '@wordpress/i18n';

// while a tab loads its data, or when it could not
const Status = ({ error }) => <div className='alfb-card alfb-status' role={error ? 'alert' : 'status'}>
	{error ? <><span className='dashicons dashicons-warning' aria-hidden='true' />{error}</> : <><span className='spinner is-active' />{__('Loading…', 'softicon-flipbook')}</>}
</div>;

export default Status;
