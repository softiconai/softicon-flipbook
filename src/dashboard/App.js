import { useEffect, useState } from '@wordpress/element';
import Header from './Header';
import OptIn from './OptIn';
import VideoPopup from './VideoPopup';
import useRoute from './useRoute';

const keys = config => config.tabs.map(tab => tab.key);

const App = ({ config, tabs }) => {
	const [allKeys] = useState(() => keys(config));
	const route = useRoute(allKeys);
	const [video, setVideo] = useState(null);

	// '#/videos' is the video list on the Welcome tab
	const key = 'videos' === route ? 'welcome' : route;
	const tab = allKeys.includes(key) && tabs[key] ? key : allKeys[0];
	const Content = tabs[tab];

	useEffect(() => {
		if ('videos' === route) {
			document.getElementById('alfb-videos')?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [route]);

	return <>
		<Header config={config} active={tab} />
		<div className='alfb-dash-body'>
			{config.notice && <div className={'notice inline alfb-notice notice-' + config.notice.type} role='status'><p>{config.notice.text}</p></div>}
			{config.optIn && <OptIn card={config.optIn} />}
			<Content config={config} play={setVideo} />
		</div>
		<VideoPopup video={video} onClose={() => setVideo(null)} />
	</>;
};

export default App;
