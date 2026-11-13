// the Flipbook dashboard: one React page, each tab a #/route (includes/dashboard.php prints only the box and the config)
import { createRoot } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import App from './App';
import Welcome from './Welcome';
import Demos from './Demos';
import { Pricing, Compare } from './Pricing';
import Help from './Help';
import { proPages } from './ProPage';

const start = () => {
	const root = document.getElementById('alfb-dashboard');
	const config = window.alfbDashboard;
	if (!root || !config) {
		return;
	}
	// SoftIcon Flipbook Pro puts its real Analytics, Leads, Defaults and Settings pages here
	const tabs = applyFilters('alfb.dashboard.tabs', { welcome: Welcome, demos: Demos, ...proPages(), pricing: Pricing, compare: Compare, help: Help }, config);
	createRoot(root).render(<App config={config} tabs={tabs} />);
};

// after every script on the page has run, so add-ons have added their tabs
if ('loading' === document.readyState) {
	document.addEventListener('DOMContentLoaded', start);
} else {
	start();
}
