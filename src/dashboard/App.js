import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import Header, { groupOf } from './Header';
import VideoPopup from './VideoPopup';
import useRoute from './useRoute';

const keys = config => config.tabs.map(tab => tab.key);

// the message after an opt-in shows once: ?alfb_fs=… leaves the address so a reload does not bring it back,
// another tab or ✕ closes it; the "check your email" one stays until the email is confirmed
const Notice = ({ notice, tab }) => {
	const [open, setOpen] = useState(true);
	const [firstTab] = useState(tab);
	const once = 'warning' !== notice.type;
	useEffect(() => {
		if (once && tab !== firstTab) {
			setOpen(false);
		}
	}, [once, tab, firstTab]);
	useEffect(() => {
		const url = new URL(window.location.href);
		if (url.searchParams.has('alfb_fs')) {
			url.searchParams.delete('alfb_fs');
			window.history.replaceState(window.history.state, '', url.toString());
		}
	}, []);
	if (!open) {
		return null;
	}
	return <div className={'notice inline alfb-notice notice-' + notice.type + (once ? ' is-dismissible' : '')} role='status'>
		<p>{notice.text}</p>
		{once && <button type='button' className='notice-dismiss' onClick={() => setOpen(false)}>
			<span className='screen-reader-text'>{__('Dismiss this notice.', 'softicon-flipbook')}</span>
		</button>}
	</div>;
};

// a short review request (includes/dashboard.php review()); any answer hides it, "later" for 30 days
const Review = ({ review }) => {
	const [open, setOpen] = useState(true);
	if (!open) {
		return null;
	}
	const answer = value => {
		setOpen(false);
		apiFetch({ path: '/alfb/v1/dashboard/review', method: 'POST', data: { answer: value } }).catch(() => {});
	};
	return <div className='notice inline alfb-notice alfb-review notice-info' role='status'>
		<p><strong>{__('Enjoying SoftIcon Flipbook?', 'softicon-flipbook')}</strong> {__('A quick review on WordPress.org helps other people find it, and it means a lot to our small team.', 'softicon-flipbook')}</p>
		<p className='alfb-review-actions'>
			<a className='button button-primary' href={review.url} target='_blank' rel='noopener noreferrer' onClick={() => answer('done')}>{__('Leave a review', 'softicon-flipbook')}</a>
			<button type='button' className='button' onClick={() => answer('later')}>{__('Maybe later', 'softicon-flipbook')}</button>
			<button type='button' className='button-link' onClick={() => answer('done')}>{__('I already did', 'softicon-flipbook')}</button>
		</p>
	</div>;
};

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

	// the group's tab opens this page again next time
	const group = groupOf(config, tab);
	useEffect(() => {
		if (group) {
			try {
				window.localStorage.setItem('alfb-group-' + group.key, tab);
			} catch (e) {
				// storage can be blocked
			}
		}
	}, [group, tab]);

	useEffect(() => {
		if ('videos' === route) {
			document.getElementById('alfb-videos')?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [route]);

	const page = isLocked ? <div className='alfb-card alfb-status'><span className='dashicons dashicons-lock' aria-hidden='true' />{__('This is a Pro feature.', 'softicon-flipbook')}</div>
		: <Content config={config} play={setVideo} unlock={unlock} />;

	return <>
		<Header config={config} active={tab} unlock={unlock} />
		<div className='alfb-dash-body'>
			{config.notice && <Notice notice={config.notice} tab={tab} />}
			{config.review && <Review review={config.review} />}
			{group ? <div className='alfb-group'>
				<nav className='alfb-group-nav' aria-label={group.label}>
					<span className='alfb-group-title'>{group.label}</span>
					{group.items.map(item => {
						const locked = config.lockedTabs.includes(item.key);
						return <a key={item.key} href={'#/' + item.key} className={item.key === tab ? 'is-active' : undefined} aria-current={item.key === tab ? 'page' : undefined}
							onClick={locked ? event => {
								event.preventDefault();
								unlock();
							} : undefined}>
							<span className={'alfb-group-icon dashicons dashicons-' + (item.icon || 'admin-generic')} aria-hidden='true' />
							<span><strong>{item.label}{locked && <span className='dashicons dashicons-lock' aria-label={__('Locked', 'softicon-flipbook')} />}{!config.pro && <span className='alfb-badge'>{__('Pro', 'softicon-flipbook')}</span>}</strong>{item.text && <small>{item.text}</small>}</span>
						</a>;
					})}
				</nav>
				<div className='alfb-group-main'>{page}</div>
			</div> : page}
		</div>
		<VideoPopup video={video} onClose={() => setVideo(null)} />
		{/* SoftIcon Flipbook Pro without a license adds its popup here */}
		{applyFilters('alfb.dashboard.popup', null, { open: lockedOpen, onClose: () => setLockedOpen(false), config })}
	</>;
};

export default App;
