import { __ } from '@wordpress/i18n';
import VideoLink from './VideoLink';
import GettingStarted from './GettingStarted';

const Welcome = ({ config, play }) => <>
	<section className='alfb-hero'>
		<div>
			<h2>{__('Turn any PDF into a book people enjoy reading', 'softicon-flipbook')}</h2>
			<p>{__('Catalogs, magazines, menus and brochures that turn like real pages, on phones and big screens, right inside the block editor.', 'softicon-flipbook')}</p>
			<p className='alfb-actions'>
				<a className='alfb-btn alfb-btn-amber' href={config.urls.newPage}>{__('Create a flipbook', 'softicon-flipbook')}</a>
				<a className='alfb-btn alfb-btn-ghost' href='#/demos'>{__('See the demos', 'softicon-flipbook')}</a>
			</p>
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
