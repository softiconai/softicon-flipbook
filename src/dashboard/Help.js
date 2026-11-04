import { __ } from '@wordpress/i18n';
import VideoLink from './VideoLink';

const external = { target: '_blank', rel: 'noopener noreferrer' };

const Help = ({ config, play }) => <div className='alfb-grid'>
	<div className='alfb-card alfb-links'>
		<h3>{__('Get help', 'softicon-flipbook')}</h3>
		<a href='https://wordpress.org/support/plugin/softicon-flipbook/' {...external}>{__('Support forum', 'softicon-flipbook')}</a>
		<a href='mailto:softiconai@gmail.com'>softiconai@gmail.com</a>
		<p>{__('Free or Pro, we are glad to help with any problem, and a real person reads every email. Tell us your WordPress version, the page with the flipbook and what you see.', 'softicon-flipbook')}</p>
	</div>
	<div className='alfb-card alfb-links'>
		<h3>{__('Learn', 'softicon-flipbook')}</h3>
		<a href='https://wordpress.org/plugins/softicon-flipbook/#faq' {...external}>{__('Frequently asked questions', 'softicon-flipbook')}</a>
		<VideoLink url={config.urls.playlist} title={__('Video tutorials', 'softicon-flipbook')} play={play}>{__('Video tutorials', 'softicon-flipbook')}</VideoLink>
		<a href='https://github.com/softiconai/softicon-flipbook' {...external}>{__('Source code on GitHub', 'softicon-flipbook')}</a>
	</div>
	<div className='alfb-card alfb-links'>
		<h3>{__('Like the plugin?', 'softicon-flipbook')}</h3>
		<a href='https://wordpress.org/support/plugin/softicon-flipbook/reviews/#new-post' {...external}>{__('Leave a review', 'softicon-flipbook')}</a>
		<a href='https://wordpress.org/plugins/author/softiconai/' {...external}>{__('More plugins from SoftIcon', 'softicon-flipbook')}</a>
	</div>
</div>;

export default Help;
