import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import Header from './Header';
import VideoPopup from './VideoPopup';
import useRoute from './useRoute';

const keys = config => config.tabs.map(tab => tab.key);

const App = ({ config, tabs }) => {
	const [allKeys] = useState(() => keys(config));
	const route = useRoute(allKeys);
	const [video, setVideo] = useState(null);
	const [lockedOpen, setLockedOpen] = useState(false);
	const unlock = () => setLockedOpen(true);

	// '#/videos' is the video list on the Welcome tab
	const key = 'videos' === route ? 'welcome' : route;
	const tab = allKeys.includes(key) && tabs[key] ? key : allKeys[0];
	const Content = tabs[tab];
	// a locked Pro tab reached by its address shows a short note and the popup
	const isLocked = config.lockedTabs.includes(tab);

	useEffect(() => {
		if (isLocked) {
			setLockedOpen(true);
		}
	}, [isLocked]);

	useEffect(() => {
		if ('videos' === route) {
			document.getElementById('alfb-videos')?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [route]);

	return <>
		<Header config={config} active={tab} unlock={unlock} />
		<div className='alfb-dash-body'>
			{config.notice && <div className={'notice inline alfb-notice notice-' + config.notice.type} role='status'><p>{config.notice.text}</p></div>}
			{isLocked ? <div className='alfb-card alfb-status'><span className='dashicons dashicons-lock' aria-hidden='true' />{__('This is a Pro feature.', 'softicon-flipbook')}</div>
				: <Content config={config} play={setVideo} unlock={unlock} />}
		</div>
		<VideoPopup video={video} onClose={() => setVideo(null)} />
		{/* SoftIcon Flipbook Pro without a license adds its popup here */}
		{applyFilters('alfb.dashboard.popup', null, { open: lockedOpen, onClose: () => setLockedOpen(false), config })}
	</>;
};

export default App;
