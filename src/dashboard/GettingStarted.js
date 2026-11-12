// Getting started on the Welcome tab: how to add a flipbook in the block editor, the Classic Editor, Elementor and
// other page builders, or a theme. It opens on the editor this site uses, and lists the site's own flipbooks with their shortcodes.
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import VideoLink from './VideoLink';
import { videos } from '../utils/options';

const KEY = 'alfb_start_tab';

const shortcode = id => `[softicon_flipbook id="${id}"]`;

// the clipboard API needs https; local http sites copy through a hidden text box
const copyText = text => {
	if (window.navigator.clipboard && window.isSecureContext) {
		return window.navigator.clipboard.writeText(text);
	}
	const box = document.createElement('textarea');
	box.value = text;
	box.setAttribute('readonly', '');
	box.style.position = 'fixed';
	box.style.opacity = '0';
	document.body.append(box);
	box.select();
	const done = document.execCommand('copy');
	box.remove();
	return done ? Promise.resolve() : Promise.reject();
};

const Copy = ({ text, label }) => {
	const [copied, setCopied] = useState(false);
	return <button type='button' className={'alfb-copy' + (copied ? ' is-copied' : '')} aria-label={label}
		onClick={() => copyText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		}).catch(() => {})}>
		<span className={'dashicons ' + (copied ? 'dashicons-yes' : 'dashicons-admin-page')} aria-hidden='true' />
		{copied ? __('Copied', 'softicon-flipbook') : __('Copy', 'softicon-flipbook')}
	</button>;
};

const Code = ({ text, label }) => <div className='alfb-code'>
	<code>{text}</code>
	<Copy text={text} label={label} />
</div>;

// the site's newest flipbooks, each with its shortcode to copy
const Books = ({ start }) => <div className='alfb-start-books'>
	<h4>{__('Your flipbooks', 'softicon-flipbook')}</h4>
	{start.books.length ? <>
		<ul>
			{start.books.map(book => <li key={book.id}>
				<a className='alfb-start-book' href={book.edit}>{book.title}</a>
				<Code text={shortcode(book.id)} label={sprintf(
					/* translators: %s: flipbook title */
					__('Copy the shortcode of %s', 'softicon-flipbook'),
					book.title
				)} />
			</li>)}
		</ul>
		<p className='alfb-start-more'>
			{start.total > start.books.length && <a href={start.allBooks}>{sprintf(
				/* translators: %d: number of flipbooks */
				_n('See all %d flipbook', 'See all %d flipbooks', start.total, 'softicon-flipbook'),
				start.total
			)}</a>}
			<a href={start.newBook}>{__('Add a flipbook', 'softicon-flipbook')}</a>
		</p>
	</> : <div className='alfb-start-empty'>
		<p>{__('No flipbooks yet. Make one and its shortcode shows up here, ready to copy.', 'softicon-flipbook')}</p>
		<a className='alfb-btn alfb-btn-teal' href={start.newBook}>{__('Add a flipbook', 'softicon-flipbook')}</a>
	</div>}
</div>;

const Video = ({ url, title, play }) => <VideoLink className='alfb-start-video' url={url} title={title} play={play}>
	<span className='dashicons dashicons-controls-play' aria-hidden='true' />
	<span>{title}</span>
</VideoLink>;

const Step = ({ n, title, children, action }) => <li className='alfb-start-step'>
	<span className='alfb-step'>{n}</span>
	<div>
		<h3>{title}</h3>
		{children}
		{action}
	</div>
</li>;

// the same two first steps for the Classic Editor and page builders
const makeSteps = start => <>
	<Step n={1} title={__('Make the flipbook', 'softicon-flipbook')}
		action={<a className='alfb-start-link' href={start.newBook}>{__('Add a flipbook', 'softicon-flipbook')} &rarr;</a>}>
		<p>{__('Go to Flipbook → All Flipbooks → Add a flipbook. It opens with the Flipbook block: pick the PDF and the look, then publish.', 'softicon-flipbook')}</p>
	</Step>
	<Step n={2} title={__('Copy its shortcode', 'softicon-flipbook')}>
		<p>{__('Every flipbook has a shortcode in the All Flipbooks list and in the block\'s Help panel. Your flipbooks are listed here too.', 'softicon-flipbook')}</p>
	</Step>
</>;

const tabs = start => [
	{
		key: 'block',
		icon: 'block-default',
		label: __('Block editor', 'softicon-flipbook'),
		on: !start.classic,
		steps: <>
			<Step n={1} title={__('Add the Flipbook block', 'softicon-flipbook')}
				action={<a className='alfb-start-link' href={start.newPage}>{__('Create a flipbook page', 'softicon-flipbook')} &rarr;</a>}>
				<p>{createInterpolateElement(__('In any page or post, click <b>+</b> and search for <b>Flipbook</b>, or type <code>/flipbook</code> in an empty line.', 'softicon-flipbook'), { b: <strong />, code: <code /> })}</p>
			</Step>
			<Step n={2} title={__('Pick a PDF or images', 'softicon-flipbook')}>
				<p>{__('Upload a PDF, choose one from the Media Library, paste a link, or build the book from your own images.', 'softicon-flipbook')}</p>
			</Step>
			<Step n={3} title={__('Choose the look and publish', 'softicon-flipbook')}>
				<p>{__('Classic or Hardcover, on the page or in a popup: every setting is in the block\'s sidebar, and the editor shows the finished book.', 'softicon-flipbook')}</p>
			</Step>
		</>,
		video: [videos.add, __('Add a flipbook in 36 seconds', 'softicon-flipbook')]
	},
	{
		key: 'classic',
		icon: 'editor-paste-text',
		label: __('Classic editor', 'softicon-flipbook'),
		on: start.classic,
		books: true,
		steps: <>
			{makeSteps(start)}
			<Step n={3} title={__('Paste it in the Classic Editor', 'softicon-flipbook')}>
				<p>{__('Paste the shortcode where the book goes, in the Visual or the Text tab, then update the page. It works in text widgets too.', 'softicon-flipbook')}</p>
				<Code text={shortcode(start.books[0]?.id || 123)} label={__('Copy the shortcode', 'softicon-flipbook')} />
			</Step>
		</>,
		video: [videos.shortcode, __('Where to paste the shortcode', 'softicon-flipbook')]
	},
	{
		key: 'builders',
		icon: 'layout',
		label: __('Elementor & builders', 'softicon-flipbook'),
		on: start.elementor,
		books: true,
		steps: <>
			{makeSteps(start)}
			<Step n={3} title={__('Add a Shortcode widget', 'softicon-flipbook')}>
				<p>{createInterpolateElement(__('In <b>Elementor</b>, drag the <b>Shortcode</b> widget onto the page and paste the shortcode; the book shows in Elementor\'s preview too. Other builders work the same way:', 'softicon-flipbook'), { b: <strong /> })}</p>
				<ul className='alfb-start-builders'>
					<li><strong>Divi</strong> – {__('Code module', 'softicon-flipbook')}</li>
					<li><strong>Beaver Builder</strong> – {__('HTML or Text Editor module', 'softicon-flipbook')}</li>
					<li><strong>WPBakery</strong> – {__('Text Block', 'softicon-flipbook')}</li>
					<li><strong>Bricks, Oxygen</strong> – {__('Shortcode element', 'softicon-flipbook')}</li>
				</ul>
			</Step>
		</>,
		video: [videos.shortcode, __('The shortcode in Elementor and more', 'softicon-flipbook')]
	},
	{
		key: 'theme',
		icon: 'editor-code',
		label: __('Theme / PHP', 'softicon-flipbook'),
		on: false,
		books: true,
		steps: <>
			{start.blockTheme && <Step n={1} title={__('Block theme: add the block to a template', 'softicon-flipbook')}
				action={<a className='alfb-start-link' href={start.siteEditor}>{__('Open the Site Editor', 'softicon-flipbook')} &rarr;</a>}>
				<p>{__('Your theme is a block theme. In Appearance → Editor → Templates, open a template and add the Flipbook block like on any page.', 'softicon-flipbook')}</p>
			</Step>}
			<Step n={start.blockTheme ? 2 : 1} title={__('Any theme: print the shortcode', 'softicon-flipbook')}>
				<p>{createInterpolateElement(__('Make the flipbook under All Flipbooks, then show it from a template file, such as <code>single.php</code>, with:', 'softicon-flipbook'), { code: <code /> })}</p>
				<Code text={`<?php echo do_shortcode( '${shortcode(start.books[0]?.id || 123)}' ); ?>`} label={__('Copy the PHP code', 'softicon-flipbook')} />
			</Step>
			<Step n={start.blockTheme ? 3 : 2} title={__('One book for every post', 'softicon-flipbook')}>
				{start.pro ?
					<p>{__('Keep each post\'s PDF in a Meta Box or ACF field, put one flipbook in the template, and turn on "PDF from a custom field" in its Source panel: every post shows its own book.', 'softicon-flipbook')}</p> :
					<p>{createInterpolateElement(__('With Pro, one flipbook in a template shows each post\'s own PDF from a Meta Box or ACF field. <a>See Pro</a>', 'softicon-flipbook'), { a: <a href='#/pricing' /> })}</p>}
			</Step>
		</>,
		video: [videos.shortcode, __('Where to paste the shortcode', 'softicon-flipbook')]
	}
];

const remembered = () => {
	try {
		return window.localStorage.getItem(KEY);
	} catch (e) {
		return null;
	}
};

const GettingStarted = ({ config, play }) => {
	const start = { ...config.start, newPage: config.urls.newPage, pro: config.pro };
	const list = tabs(start);
	// the tab picked last time, else the editor this site uses (Classic Editor, then Elementor), else the block editor
	const [tab, setTab] = useState(() => {
		const saved = remembered();
		if (list.some(item => item.key === saved)) {
			return saved;
		}
		return start.classic ? 'classic' : start.elementor ? 'builders' : 'block';
	});
	const pick = key => {
		setTab(key);
		try {
			window.localStorage.setItem(KEY, key);
		} catch (e) {
			// private mode: the tab is not remembered
		}
	};
	const current = list.find(item => item.key === tab) || list[0];

	// arrow keys move between the tabs, as in any tab list
	const onKey = event => {
		const at = list.findIndex(item => item.key === tab);
		const next = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: list.length - 1 }[event.key];
		if (undefined === next) {
			return;
		}
		event.preventDefault();
		const key = list[(next + list.length) % list.length].key;
		pick(key);
		event.currentTarget.querySelector(`[data-tab="${key}"]`)?.focus();
	};

	return <section className='alfb-start'>
		<header className='alfb-start-head'>
			<div>
				<h2>{__('Getting started', 'softicon-flipbook')}</h2>
				<p>{__('Pick where you build your pages; the steps follow.', 'softicon-flipbook')}</p>
			</div>
		</header>

		<div className='alfb-start-tabs' role='tablist' aria-label={__('Where you build your pages', 'softicon-flipbook')} onKeyDown={onKey}>
			{list.map(item => <button key={item.key} type='button' role='tab' id={'alfb-start-tab-' + item.key} data-tab={item.key}
				aria-selected={item.key === tab} aria-controls='alfb-start-panel' tabIndex={item.key === tab ? 0 : -1}
				className={item.key === tab ? 'is-active' : ''} onClick={() => pick(item.key)}>
				<span className={'dashicons dashicons-' + item.icon} aria-hidden='true' />
				<span>{item.label}</span>
				{item.on && 'block' !== item.key && <span className='alfb-start-on'>{__('On this site', 'softicon-flipbook')}</span>}
			</button>)}
		</div>

		<div className='alfb-start-body' role='tabpanel' id='alfb-start-panel' aria-labelledby={'alfb-start-tab-' + current.key}>
			<ol className='alfb-start-steps'>{current.steps}</ol>
			<aside className='alfb-start-side'>
				{current.books ? <Books start={start} /> : <div className='alfb-start-books'>
					<h4>{__('Fastest start', 'softicon-flipbook')}</h4>
					<p>{__('A new page opens with a sample book already in place; swap in your own PDF.', 'softicon-flipbook')}</p>
					<a className='alfb-btn alfb-btn-teal' href={start.newPage}>{__('Create a flipbook', 'softicon-flipbook')}</a>
				</div>}
				<Video url={current.video[0]} title={current.video[1]} play={play} />
			</aside>
		</div>
	</section>;
};

export default GettingStarted;
