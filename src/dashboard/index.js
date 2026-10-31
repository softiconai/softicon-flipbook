// the Flipbook dashboard, drawn from window.alfbDashboard (includes/dashboard.php)
import { createRoot, useState } from '@wordpress/element';
import Header from './Header';
import Welcome from './Welcome';
import Demos from './Demos';
import { Pricing, Compare } from './Pricing';
import Help from './Help';
import VideoPopup from './VideoPopup';

const config = window.alfbDashboard;

const tabs = { welcome: Welcome, demos: Demos, pricing: Pricing, pro: Compare, help: Help };

const Tab = () => {
	const [video, setVideo] = useState(null);
	// Pro's own tabs (Analytics, Leads, Settings) are printed by PHP next to this box
	const Content = tabs[config.tab];
	if (!Content || (config.pro && 'pro' === config.tab)) {
		return null;
	}
	return <>
		<Content config={config} play={setVideo} />
		<VideoPopup video={video} onClose={() => setVideo(null)} />
	</>;
};

const head = document.getElementById('alfb-dashboard-head');
const tab = document.getElementById('alfb-dashboard-tab');
if (config && head && tab) {
	createRoot(head).render(<Header config={config} />);
	createRoot(tab).render(<Tab />);
}
