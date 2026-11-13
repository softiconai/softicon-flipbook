// the free plugin's Manage pages (Analytics, Leads, Defaults, Settings): what each Pro feature does, with its video and
// the way to Pro; SoftIcon Flipbook Pro replaces them with the real pages
import { __ } from '@wordpress/i18n';
import VideoLink from './VideoLink';
import ProDemo from './ProDemo';
import { videos } from '../utils/options';

const pages = () => ({
	analytics: {
		icon: 'chart-bar', eyebrow: __('Insights', 'softicon-flipbook'), title: __('Reading analytics', 'softicon-flipbook'),
		text: __('See how many people open each book and how far they read.', 'softicon-flipbook'), video: videos.analytics,
		points: [
			__('Views, pages read and downloads for every book', 'softicon-flipbook'),
			__('A chart per day, for 7, 30 or 90 days', 'softicon-flipbook'),
			__('No cookies and nothing personal stored', 'softicon-flipbook'),
			__('Download the numbers as a CSV file', 'softicon-flipbook')
		]
	},
	leads: {
		icon: 'email-alt', eyebrow: __('Audience', 'softicon-flipbook'), title: __('Lead capture', 'softicon-flipbook'),
		text: __('Readers leave their email to keep reading after a few pages.', 'softicon-flipbook'), video: videos.leads,
		points: [
			__('Choose after how many pages the form shows', 'softicon-flipbook'),
			__('Every lead saved on your own site', 'softicon-flipbook'),
			__('An email to you for each new lead', 'softicon-flipbook'),
			__('Download your leads as a CSV file', 'softicon-flipbook')
		]
	},
	defaults: {
		icon: 'admin-appearance', eyebrow: __('Appearance', 'softicon-flipbook'), title: __('Site defaults', 'softicon-flipbook'),
		text: __('Set the toolbar, size, colors and more once, and every flipbook uses them. A book can still change any setting for itself.', 'softicon-flipbook'), video: videos.settings,
		points: [
			__('Hide the download button on every book at once', 'softicon-flipbook'),
			__('Your brand colors and height on each new book', 'softicon-flipbook'),
			__('Right to left for every book on an Arabic, Hebrew or Urdu site', 'softicon-flipbook'),
			__('A live preview before you save', 'softicon-flipbook')
		]
	},
	settings: {
		icon: 'admin-generic', eyebrow: __('Site', 'softicon-flipbook'), title: __('Settings', 'softicon-flipbook'),
		text: __('The site-wide switches for reading analytics and lead emails.', 'softicon-flipbook'),
		points: [
			__('Turn reading analytics on or off', 'softicon-flipbook'),
			__('Leave out your own visits while you work', 'softicon-flipbook'),
			__('Get an email for each new lead', 'softicon-flipbook')
		]
	}
});

const ProPage = ({ name, config, play }) => {
	const page = pages()[name];
	return <div className='alfb-pp-wrap'><div className='alfb-pp'>
		<header className='alfb-pp-hero'>
			<span className={'alfb-pp-icon dashicons dashicons-' + page.icon} aria-hidden='true' />
			<div>
				<span className='alfb-pp-eyebrow'>{page.eyebrow} <span className='alfb-badge'>{__('Pro', 'softicon-flipbook')}</span></span>
				<h2>{page.title}</h2>
				<p>{page.text}</p>
			</div>
		</header>
		<div className='alfb-pp-body'>
			<ul className='alfb-pp-points'>
				{page.points.map(point => <li key={point}><span className='dashicons dashicons-yes' aria-hidden='true' />{point}</li>)}
			</ul>
			<div className='alfb-pp-actions'>
				<a className='alfb-btn alfb-btn-amber' href='#/pricing'>{__('See Pro plans', 'softicon-flipbook')}</a>
				<a className='alfb-pp-link' href='#/compare'>{__('Compare Free and Pro', 'softicon-flipbook')}</a>
				{page.video && <VideoLink url={page.video} title={page.title} play={play} className='alfb-pp-link'>
					<span className='dashicons dashicons-controls-play' aria-hidden='true' />{__('Watch it in action', 'softicon-flipbook')}
				</VideoLink>}
			</div>
		</div>
		</div>
		<ProDemo name={name} title={page.title} config={config} />
	</div>;
};

// one component per tab, for the dashboard's tab list
export const proPages = () => Object.fromEntries(['analytics', 'leads', 'defaults', 'settings'].map(name => [name, props => <ProPage name={name} {...props} />]));

export default ProPage;
