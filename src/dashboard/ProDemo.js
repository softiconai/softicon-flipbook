// the free plugin's Manage pages: a working demo of each Pro screen with sample data (src/dashboard/ProPage.js);
// it can be clicked and changed, nothing is saved or sent
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Flipbook, bookConfig } from './Book';

// the same numbers on every visit: a small seeded generator
const seeded = seed => () => {
	seed = (seed * 9301 + 49297) % 233280;
	return seed / 233280;
};

const Switch = ({ checked, onChange, label }) => <button type='button' role='switch' aria-checked={checked} aria-label={label}
	className={'alfb-try-switch' + (checked ? ' is-on' : '')} onClick={() => onChange(!checked)}><span /></button>;

const Seg = ({ value, options, onChange, label }) => <div className='alfb-try-seg' role='radiogroup' aria-label={label}>
	{options.map(([key, text]) => <button type='button' key={key} role='radio' aria-checked={key === value} className={key === value ? 'is-on' : ''} onClick={() => onChange(key)}>{text}</button>)}
</div>;

const AnalyticsDemo = () => {
	const [days, setDays] = useState(30);
	const data = useMemo(() => {
		const random = seeded(days);
		const bars = Array.from({ length: days }, (_, i) => Math.round(18 + random() * 40 + Math.sin(i / 3) * 10));
		const views = bars.reduce((sum, n) => sum + n, 0);
		const pages = Math.round(views * 7.4);
		return { bars, views, pages, downloads: Math.round(views * 0.08), leads: Math.round(views * 0.03) };
	}, [days]);
	const top = Math.max(...data.bars);
	const books = [
		[__('Spring catalog', 'softicon-flipbook'), 0.46],
		[__('Room guide', 'softicon-flipbook'), 0.31],
		[__('Price list', 'softicon-flipbook'), 0.23]
	];

	return <>
		<div className='alfb-try-row'>
			<Seg label={__('Period', 'softicon-flipbook')} value={days} onChange={setDays}
				options={[[7, __('7 days', 'softicon-flipbook')], [30, __('30 days', 'softicon-flipbook')], [90, __('90 days', 'softicon-flipbook')]]} />
		</div>
		<div className='alfb-try-stats'>
			{[[__('Views', 'softicon-flipbook'), data.views], [__('Pages read', 'softicon-flipbook'), data.pages], [__('Pages per view', 'softicon-flipbook'), (data.pages / data.views).toFixed(1)], [__('Downloads', 'softicon-flipbook'), data.downloads], [__('Leads', 'softicon-flipbook'), data.leads]]
				.map(([label, value]) => <div key={label}><small>{label}</small><strong>{Number(value).toLocaleString()}</strong></div>)}
		</div>
		<div className='alfb-try-chart' aria-label={__('Views per day', 'softicon-flipbook')} role='img'>
			{data.bars.map((n, i) => <i key={i} style={{ height: (n / top * 100) + '%' }} title={String(n)} />)}
		</div>
		<table className='alfb-try-table'>
			<thead><tr><th>{__('Book', 'softicon-flipbook')}</th><th>{__('Views', 'softicon-flipbook')}</th><th>{__('Pages read', 'softicon-flipbook')}</th></tr></thead>
			<tbody>{books.map(([name, share]) => <tr key={name}><td>{name}</td><td>{Math.round(data.views * share).toLocaleString()}</td><td>{Math.round(data.pages * share).toLocaleString()}</td></tr>)}</tbody>
		</table>
	</>;
};

const LeadsDemo = () => {
	const [query, setQuery] = useState('');
	const leads = [
		['Amira Hassan', 'am***@example.com', __('Spring catalog', 'softicon-flipbook'), 3, __('Today', 'softicon-flipbook')],
		['Jonas Weber', 'jo***@example.com', __('Room guide', 'softicon-flipbook'), 5, __('Yesterday', 'softicon-flipbook')],
		['Priya Nair', 'pr***@example.com', __('Spring catalog', 'softicon-flipbook'), 3, __('2 days ago', 'softicon-flipbook')],
		['Lucas Martin', 'lu***@example.com', __('Price list', 'softicon-flipbook'), 2, __('3 days ago', 'softicon-flipbook')]
	].filter(row => !query || row.join(' ').toLowerCase().includes(query.toLowerCase()));

	return <>
		<div className='alfb-try-row'>
			<input type='search' className='alfb-try-input' value={query} onChange={event => setQuery(event.target.value)} placeholder={__('Search leads', 'softicon-flipbook')} aria-label={__('Search leads', 'softicon-flipbook')} />
			<span className='alfb-try-locked'><span className='dashicons dashicons-lock' aria-hidden='true' />{__('Download CSV', 'softicon-flipbook')}</span>
		</div>
		<table className='alfb-try-table'>
			<thead><tr><th>{__('Name', 'softicon-flipbook')}</th><th>{__('Email', 'softicon-flipbook')}</th><th>{__('Book', 'softicon-flipbook')}</th><th>{__('Asked at page', 'softicon-flipbook')}</th><th>{__('When', 'softicon-flipbook')}</th></tr></thead>
			<tbody>{leads.map(row => <tr key={row[1]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody>
		</table>
		{!leads.length && <p className='alfb-try-empty'>{__('No sample lead matches.', 'softicon-flipbook')}</p>}
	</>;
};

const swatches = ['', '#f6f7f7', '#1f2937', '#0f766e', '#7a1f1f'];
const buttons = () => [
	['showDownload', 'download', __('Download', 'softicon-flipbook')],
	['showPrint', 'printer', __('Print', 'softicon-flipbook')],
	['showThumbnails', 'grid-view', __('Thumbnails', 'softicon-flipbook')],
	['showSearch', 'search', __('Search', 'softicon-flipbook')],
	['showShare', 'share', __('Share', 'softicon-flipbook')],
	['flipSound', 'controls-volumeon', __('Sound', 'softicon-flipbook')]
];

const DefaultsDemo = ({ config }) => {
	const [values, setValues] = useState({ showDownload: true, showPrint: false, showThumbnails: true, showSearch: true, showShare: false, flipSound: true, theme: 'light', bgColor: '', bookStyle: 'flat' });
	const set = (key, value) => setValues(previous => ({ ...previous, [key]: value }));
	const attributes = { ...values, sideArrows: 'hardcover' === values.bookStyle, pdfUrl: config.urls.demo + 'spring-catalog.pdf', maxHeight: 380 };
	const key = JSON.stringify(values);
	const host = useRef();

	// each change draws a new sample book; view.js starts it, and the one it replaces is stopped
	useEffect(() => {
		window.dispatchEvent(new window.Event('alfb:boot'));
		const el = host.current?.querySelector('[data-alfb]');
		return () => el?.alfb?.destroy?.();
	}, [key]);

	return <div className='alfb-try-split'>
		<div className='alfb-try-controls'>
			<span className='alfb-try-label'>{__('Toolbar on every book', 'softicon-flipbook')}</span>
			<div className='alfb-try-chips'>
				{buttons().map(([name, icon, label]) => <button type='button' key={name} role='switch' aria-checked={!!values[name]} className={'alfb-try-chip' + (values[name] ? ' is-on' : '')} onClick={() => set(name, !values[name])}>
					<span className={'dashicons dashicons-' + icon} aria-hidden='true' />{label}
				</button>)}
			</div>
			<span className='alfb-try-label'>{__('Design', 'softicon-flipbook')}</span>
			<Seg label={__('Design', 'softicon-flipbook')} value={values.bookStyle} onChange={value => set('bookStyle', value)} options={[['flat', __('Classic', 'softicon-flipbook')], ['hardcover', __('Hardcover', 'softicon-flipbook')]]} />
			<span className='alfb-try-label'>{__('Theme', 'softicon-flipbook')}</span>
			<Seg label={__('Theme', 'softicon-flipbook')} value={values.theme} onChange={value => set('theme', value)} options={[['light', __('Light', 'softicon-flipbook')], ['dark', __('Dark', 'softicon-flipbook')]]} />
			<span className='alfb-try-label'>{__('Background', 'softicon-flipbook')}</span>
			<div className='alfb-try-swatches'>
				{swatches.map(color => <button type='button' key={color || 'none'} className={'alfb-try-swatch' + (color === values.bgColor ? ' is-on' : '') + (color ? '' : ' is-none')}
					style={color ? { background: color } : undefined} onClick={() => set('bgColor', color)} aria-label={color || __('Theme color', 'softicon-flipbook')} />)}
			</div>
		</div>
		<div className='alfb-try-book' ref={host}>
			<Flipbook key={key} attributes={attributes} config={bookConfig(attributes)} />
		</div>
	</div>;
};

const SettingsDemo = () => {
	const [values, setValues] = useState({ analytics: true, skipEditors: true, leadEmail: false, gaEvents: false });
	const rows = [
		['analytics', __('Count opens and pages read', 'softicon-flipbook'), __('Reading analytics for every book. Nothing personal is stored and no cookies are set.', 'softicon-flipbook')],
		['skipEditors', __('Do not count logged-in editors', 'softicon-flipbook'), __('Your own visits while you work on the site are left out.', 'softicon-flipbook')],
		['leadEmail', __('Email me each new lead', 'softicon-flipbook'), __('Sent to the site admin email.', 'softicon-flipbook')],
		['gaEvents', __('Send events to Google Analytics', 'softicon-flipbook'), __('When the site already has Google Analytics or Tag Manager: opens, pages read, finished books and downloads.', 'softicon-flipbook')]
	];
	return <>
		{rows.map(([name, label, help]) => <div className='alfb-try-setting' key={name}>
			<div><strong>{label}</strong><small>{help}</small></div>
			<Switch label={label} checked={values[name]} onChange={value => setValues({ ...values, [name]: value })} />
		</div>)}
		<p className='alfb-try-row'><span className='alfb-try-locked'><span className='dashicons dashicons-lock' aria-hidden='true' />{__('Save settings', 'softicon-flipbook')}</span></p>
	</>;
};

const demos = { analytics: AnalyticsDemo, leads: LeadsDemo, defaults: DefaultsDemo, settings: SettingsDemo };

const ProDemo = ({ name, title, config }) => {
	const Demo = demos[name];
	return <section className='alfb-try'>
		<header>
			<span className='alfb-try-badge'><span className='dashicons dashicons-visibility' aria-hidden='true' />{__('Try it', 'softicon-flipbook')}</span>
			<p>{sprintf(
				/* translators: %s: the Pro feature, such as Reading analytics */
				__('A working demo of %s with sample data. Click around; nothing is saved.', 'softicon-flipbook'), title)}</p>
		</header>
		<div className='alfb-try-body'><Demo config={config} /></div>
	</section>;
};

export default ProDemo;
