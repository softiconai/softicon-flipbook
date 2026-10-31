// the free plugin: where a Pro setting would be, a short notice that it is in Pro and a link to the dashboard
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

const ProNotice = ({ text, href }) => <div className='alfbProNotice'>
	<p><span className='dashicons dashicons-lock' aria-hidden='true' /> {text}</p>
	{/* a new tab, so nothing in the editor is lost */}
	<ExternalLink href={href} className='alfbProNoticeLink'>{__('Unlock with Pro', 'softicon-flipbook')}</ExternalLink>
</div>;

export default ProNotice;
