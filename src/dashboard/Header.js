import { __ } from '@wordpress/i18n';

const Header = ({ config, active }) => <header className='alfb-dash-head'>
	<a className='alfb-dash-brand' href='#/welcome'>
		<img src={config.icon} alt='' width='36' height='36' />
		<strong>{config.pro ? __('Flipbook Pro', 'softicon-flipbook') : __('Flipbook', 'softicon-flipbook')}</strong>
		<span className='alfb-version'>v{config.version}</span>
	</a>
	<nav className='alfb-dash-tabs' aria-label={__('Flipbook dashboard', 'softicon-flipbook')}>
		{config.tabs.map(tab => {
			// a Pro tab without a license still opens; it shows a notice
			const locked = config.lockedTabs.includes(tab.key);
			return <a key={tab.key} href={'#/' + tab.key} className={(tab.key === active ? 'is-active' : '') + (locked ? ' is-locked' : '') || undefined} aria-current={tab.key === active ? 'page' : undefined}>
				{tab.label}{locked && <span className='dashicons dashicons-lock' aria-label={__('Pro', 'softicon-flipbook')} />}
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
