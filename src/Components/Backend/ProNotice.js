// the free plugin: where a Pro setting would be, a short card that it is in Pro, a link to the dashboard and its video
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { SVG, Path } from '@wordpress/primitives';
import { icons } from '../../utils/icons';

const crown = <SVG viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' focusable='false'>
	<Path d='M3 7.5l4.5 3.5L12 4.5l4.5 6.5L21 7.5l-2 10.5H5zm2.6 12h12.8V21H5.6z' />
</SVG>;

const ProNotice = ({ text, href, video, videoLabel }) => <div className='alfbProNotice'>
	<p className='alfbProNoticeHead'>
		<span className='alfbProNoticeCrown'>{crown}</span>
		{__('Pro feature', 'softicon-flipbook')}
	</p>
	<p className='alfbProNoticeText'>{text}</p>
	{/* a new tab, so nothing in the editor is lost; editors who cannot open the dashboard get no link */}
	{href && <ExternalLink href={href} className='alfbProNoticeLink'>{__('Unlock with Pro', 'softicon-flipbook')}</ExternalLink>}
	{video && <ExternalLink href={video} className='alfbProNoticeVideo'>
		<span className='alfbPlaceholderPlay'>{icons.play}</span>
		{videoLabel}
	</ExternalLink>}
</div>;

export default ProNotice;
