import { __ } from '@wordpress/i18n';
import VideoLink from './VideoLink';
import GettingStarted from './GettingStarted';

// the editor opened for the way picked, with the steps written in the Flipbook block (src/utils/guide.js)
const withStart = (href, mode) => {
	const url = new URL(href, window.location.href);
	url.searchParams.set('alfb_start', mode);
	return url.toString();
};

// the first question: a block inside a page, or a flipbook with a shortcode for the Classic Editor and page builders.
// The one that fits the editor this site uses is marked
const Choice = ({ config }) => {
	const { start, urls } = config;
	const shortcodeSite = start.classic || start.elementor;
	const options = [
		{
			key: 'block',
			icon: 'block-default',
			title: __('Block', 'softicon-flipbook'),
			text: __('Add the flipbook right inside a page or post, in the block editor.', 'softicon-flipbook'),
			action: __('Open a new page', 'softicon-flipbook'),
			href: withStart(urls.newPage, 'block'),
			fits: !shortcodeSite
		},
		{
			key: 'shortcode',
			icon: 'shortcode',
			title: __('Shortcode', 'softicon-flipbook'),
			text: __('Make the flipbook once, then paste its shortcode in the Classic Editor, Elementor or any page builder.', 'softicon-flipbook'),
			action: __('Make a flipbook', 'softicon-flipbook'),
			href: withStart(start.newBook, 'shortcode'),
			fits: shortcodeSite
		}
	];
	return <div className='alfb-choice'>
		<h3>{__('How do you want to add your flipbook?', 'softicon-flipbook')}</h3>
		<div className='alfb-choice-cards'>
			{options.map(option => <a key={option.key} className={'alfb-choice-card' + (option.fits ? ' is-fit' : '')} href={option.href}>
				<span className={'alfb-choice-icon dashicons dashicons-' + option.icon} aria-hidden='true' />
				<strong>{option.title}{option.fits && <span className='alfb-choice-fit'>{__('Fits this site', 'softicon-flipbook')}</span>}</strong>
				<span className='alfb-choice-text'>{option.text}</span>
				<span className='alfb-choice-go'>{option.action} &rarr;</span>
			</a>)}
		</div>
		<p className='alfb-choice-more'>
			<a href={urls.newPage}>{__('Or start from a sample book', 'softicon-flipbook')}</a>
			<a href='#/demos'>{__('See the demos', 'softicon-flipbook')}</a>
		</p>
	</div>;
};

const Welcome = ({ config, play }) => <>
	<section className='alfb-hero'>
		<div>
			<h2>{__('Turn any PDF into a book people enjoy reading', 'softicon-flipbook')}</h2>
			<p>{__('Catalogs, magazines, menus and brochures that turn like real pages, on phones and big screens, right inside the block editor.', 'softicon-flipbook')}</p>
			<Choice config={config} />
		</div>
		<VideoLink className='alfb-hero-video' url={config.urls.playlist} title={__('Video tutorials', 'softicon-flipbook')} play={play}>
			<span className='dashicons dashicons-controls-play' aria-hidden='true' />
			{__('Watch the video tutorials', 'softicon-flipbook')}
		</VideoLink>
	</section>

	<GettingStarted config={config} play={play} />

	<h2 className='alfb-title' id='alfb-videos'>{__('Video tutorials', 'softicon-flipbook')}</h2>
	<div className='alfb-grid alfb-videos'>
		{config.videos.map(video => <VideoLink key={video.url} className='alfb-card alfb-video' url={video.url} title={video.title} play={play}>
			<span className='dashicons dashicons-video-alt3' aria-hidden='true' />{video.title}
		</VideoLink>)}
	</div>
</>;

export default Welcome;
