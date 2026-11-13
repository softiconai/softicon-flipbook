import { __ } from '@wordpress/i18n';

// the group a tab is in (config.groups, set by an add-on such as SoftIcon Flipbook Pro): its tabs show as one
export const groupOf = (config, key) => (config.groups || []).find(group => group.items.some(item => item.key === key));

// the group's tab opens the page last seen in it, else its first one that is not locked
const groupHref = (config, group) => {
	let last = '';
	try {
		last = window.localStorage.getItem('alfb-group-' + group.key) || '';
	} catch (e) {
		// storage can be blocked
	}
	const keys = group.items.map(item => item.key);
	const open = keys.filter(key => !config.lockedTabs.includes(key));
	return '#/' + (keys.includes(last) && open.includes(last) ? last : (open[0] || keys[0]));
};

const Header = ({ config, active, unlock }) => <header className='alfb-dash-head'>
	<a className='alfb-dash-brand' href='#/welcome'>
		<img src={config.icon} alt='' width='36' height='36' />
		<strong>{config.pro ? __('Flipbook Pro', 'softicon-flipbook') : __('Flipbook', 'softicon-flipbook')}</strong>
		<span className='alfb-version'>v{config.version}</span>
	</a>
	<nav className='alfb-dash-tabs' aria-label={__('Flipbook dashboard', 'softicon-flipbook')}>
		{config.tabs.map((tab, index) => {
			const group = groupOf(config, tab.key);
			if (group) {
				// only where its first tab is
				if (config.tabs.findIndex(other => groupOf(config, other.key) === group) !== index) {
					return null;
				}
				const on = !!group.items.find(item => item.key === active);
				const locked = group.items.every(item => config.lockedTabs.includes(item.key));
				return <a key={group.key} href={groupHref(config, group)} className={(on ? 'is-active' : '') + (locked ? ' is-locked' : '') || undefined} aria-current={on ? 'page' : undefined}
					onClick={locked ? event => {
						event.preventDefault();
						unlock();
					} : undefined}>
					{group.label}{locked && <span className='dashicons dashicons-lock' aria-label={__('Locked', 'softicon-flipbook')} />}
				</a>;
			}
			// a locked Pro tab opens the popup and stays where it is
			const locked = config.lockedTabs.includes(tab.key);
			return <a key={tab.key} href={'#/' + tab.key} className={(tab.key === active ? 'is-active' : '') + (locked ? ' is-locked' : '') || undefined} aria-current={tab.key === active ? 'page' : undefined}
				onClick={locked ? event => {
					event.preventDefault();
					unlock();
				} : undefined}>
				{tab.label}{locked && <span className='dashicons dashicons-lock' aria-label={__('Locked', 'softicon-flipbook')} />}
			</a>;
		})}
	</nav>
	<div className='alfb-dash-end'>
		<a className='alfb-dash-more' href='https://wordpress.org/plugins/author/softiconai/' target='_blank' rel='noopener noreferrer'>{__('Our plugins', 'softicon-flipbook')}</a>
		{config.pro && !config.locked
			? <span className='alfb-pro-on'><span className='dashicons dashicons-yes-alt' aria-hidden='true' />{__('Pro active', 'softicon-flipbook')}</span>
			: <a className='alfb-btn alfb-btn-amber alfb-upgrade' href='#/pricing'><span className='dashicons dashicons-unlock' aria-hidden='true' />{__('Upgrade to Pro', 'softicon-flipbook')}</a>}
	</div>
</header>;

export default Header;
