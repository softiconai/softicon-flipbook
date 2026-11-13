// the Help tab: the ways to get help, quick answers (from readme.txt's FAQ) and the site details a support ticket needs
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import VideoLink from './VideoLink';
import { videos } from '../utils/options';

const external = { target: '_blank', rel: 'noopener noreferrer' };
const SITE = 'https://softiconai.com/';
const EMAIL = 'support@softiconai.com';

const answers = () => [
	{
		q: __('How do I add a flipbook?', 'softicon-flipbook'),
		a: __('Edit a page, open the block inserter, search for Flipbook and add the block. Pick a PDF from your Media Library or upload one, and the book appears right away.', 'softicon-flipbook'),
		video: videos.add
	},
	{
		q: __('Does it work with the Classic Editor, Elementor or other page builders?', 'softicon-flipbook'),
		a: __('Yes. Go to Flipbook → All Flipbooks, add a flipbook, set it up and publish it. The list shows its shortcode, such as [softicon_flipbook id="123"]; paste it where the flipbook should be.', 'softicon-flipbook'),
		video: videos.shortcode
	},
	{
		q: __('My PDF from another website does not load', 'softicon-flipbook'),
		a: __('Browsers only read a PDF from another website when that site allows it (CORS). Upload the PDF to your Media Library and it always works.', 'softicon-flipbook')
	},
	{
		q: __('Can the flipbook open in a popup?', 'softicon-flipbook'),
		a: __('Yes. Select the flipbook, open the Style tab and turn on Open in a lightbox under Display. A cover, a button or a text link shows on the page, and a click opens the book.', 'softicon-flipbook'),
		video: videos.lightbox
	},
	{
		q: __('How do I link to a page of the book?', 'softicon-flipbook'),
		a: __('Add #page= and the number to the page address, for example example.com/catalog/#page=12. Links like <a href="#page=8"> on the same page turn the book there.', 'softicon-flipbook'),
		video: videos.reading
	},
	{
		q: __('How do I hide the download button?', 'softicon-flipbook'),
		a: __('Select the flipbook and turn off Download button in the Toolbar panel of the General tab.', 'softicon-flipbook')
	},
	{
		q: __('Does it work with caching and minify plugins?', 'softicon-flipbook'),
		a: __('Yes. The block tells its script where the plugin\'s files are, so combining or moving scripts does not break the flipbook. After an update, clear your cache once.', 'softicon-flipbook')
	},
	{
		q: __('Does it slow down my pages?', 'softicon-flipbook'),
		a: __('The page gets a 35 KB script (12 KB compressed). The PDF engine loads only when a flipbook comes near the screen, or when a lightbox is opened.', 'softicon-flipbook')
	}
];

// the details a support ticket asks for, copied to paste into it; nothing is sent anywhere
const siteDetails = config => [
	[__('Plugin', 'softicon-flipbook'), (config.pro ? 'SoftIcon Flipbook Pro ' : 'SoftIcon Flipbook ') + config.version + (config.pro && config.locked ? ' (' + __('no license', 'softicon-flipbook') + ')' : '')],
	['WordPress', config.site?.wp || ''],
	['PHP', config.site?.php || ''],
	[__('Theme', 'softicon-flipbook'), config.site?.theme || ''],
	[__('Browser', 'softicon-flipbook'), window.navigator.userAgent.replace(/^Mozilla\/5\.0 /, '')]
];

const copyText = (text, done) => {
	if (window.navigator.clipboard && window.isSecureContext) {
		window.navigator.clipboard.writeText(text).then(done);
		return;
	}
	// http sites have no clipboard API
	const area = document.createElement('textarea');
	area.value = text;
	document.body.appendChild(area);
	area.select();
	if (document.execCommand('copy')) {
		done();
	}
	area.remove();
};

const Help = ({ config, play }) => {
	const [query, setQuery] = useState('');
	const [open, setOpen] = useState(0);
	const [copied, setCopied] = useState(false);
	const pro = config.pro && !config.locked;
	const details = siteDetails(config);

	const words = query.trim().toLowerCase();
	const found = answers().filter(item => !words || (item.q + ' ' + item.a).toLowerCase().includes(words));

	const copy = () => copyText(details.map(([name, value]) => name + ': ' + value).join('\n'), () => {
		setCopied(true);
		setTimeout(() => setCopied(false), 1800);
	});

	const ways = [
		{
			icon: 'tickets-alt', title: __('Open a support ticket', 'softicon-flipbook'), href: SITE + 'support/', main: true,
			text: pro ? __('Use the email you bought Pro with, and the developers answer you.', 'softicon-flipbook') : __('Tell us what happened; the people who build the plugin answer.', 'softicon-flipbook'),
			cta: __('Write to us', 'softicon-flipbook')
		},
		{ icon: 'book', title: __('Documentation', 'softicon-flipbook'), href: SITE + 'docs/flipbook/', text: __('Guides for every setting, step by step.', 'softicon-flipbook'), cta: __('Read the docs', 'softicon-flipbook') },
		{ icon: 'video-alt3', title: __('Video tutorials', 'softicon-flipbook'), video: true, text: __('Short videos, most under a minute.', 'softicon-flipbook'), cta: __('Watch here', 'softicon-flipbook') },
		{ icon: 'groups', title: __('Community forum', 'softicon-flipbook'), href: 'https://wordpress.org/support/plugin/softicon-flipbook/', text: __('Ask in public on WordPress.org, and search past answers.', 'softicon-flipbook'), cta: __('Visit the forum', 'softicon-flipbook') }
	];

	const card = way => <>
		<span className={'alfb-hp-icon dashicons dashicons-' + way.icon} aria-hidden='true' />
		<strong>{way.title}{way.main && <em>{__('Fastest', 'softicon-flipbook')}</em>}</strong>
		<small>{way.text}</small>
		<b>{way.cta} {!way.video && <span aria-hidden='true'>↗</span>}</b>
	</>;

	return <div className='alfb-hp'>
		<header className='alfb-hp-hero'>
			<div>
				<span className='alfb-hp-eyebrow'>{__('Support', 'softicon-flipbook')}</span>
				<h2>{__('How can we help?', 'softicon-flipbook')}</h2>
				<p>{__('Free or Pro, a real person reads every message: the developers who build SoftIcon Flipbook.', 'softicon-flipbook')}</p>
			</div>
			<label className='alfb-hp-search'>
				<span className='dashicons dashicons-search' aria-hidden='true' />
				<input type='search' value={query} onChange={event => {
					setQuery(event.target.value);
					setOpen(0);
				}} placeholder={__('Search the answers', 'softicon-flipbook')} aria-label={__('Search the answers', 'softicon-flipbook')} />
			</label>
		</header>

		<div className='alfb-hp-ways'>
			{ways.map(way => way.video
				? <VideoLink key={way.title} className='alfb-hp-way' url={config.urls.playlist} title={way.title} play={play}>{card(way)}</VideoLink>
				: <a key={way.title} className={'alfb-hp-way' + (way.main ? ' is-main' : '')} href={way.href} {...external}>{card(way)}</a>)}
		</div>

		<div className='alfb-hp-body'>
			<section className='alfb-hp-panel'>
				<header>
					<h3>{__('Quick answers', 'softicon-flipbook')}</h3>
					<span>{words ? sprintf(
						/* translators: %d: the number of answers that match the search */
						__('%d found', 'softicon-flipbook'), found.length) : __('The questions people ask most', 'softicon-flipbook')}</span>
				</header>
				{found.map((item, index) => <div className={'alfb-hp-qa' + (open === index ? ' is-open' : '')} key={item.q}>
					<button type='button' aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}>
						<span>{item.q}</span><span className='alfb-hp-chev dashicons dashicons-arrow-down-alt2' aria-hidden='true' />
					</button>
					{open === index && <div className='alfb-hp-answer'>
						<p>{item.a}</p>
						{item.video && <VideoLink url={item.video} title={item.q} play={play} className='alfb-hp-watch'>
							<span className='dashicons dashicons-controls-play' aria-hidden='true' />{__('Watch how', 'softicon-flipbook')}
						</VideoLink>}
					</div>}
				</div>)}
				{!found.length && <p className='alfb-hp-none'>{__('No quick answer for that.', 'softicon-flipbook')} <a href={SITE + 'support/'} {...external}>{__('Ask us instead', 'softicon-flipbook')} ↗</a></p>}
				<p className='alfb-hp-more'><a href='https://wordpress.org/plugins/softicon-flipbook/#faq' {...external}>{__('All questions and answers', 'softicon-flipbook')} ↗</a></p>
			</section>

			<aside className='alfb-hp-side'>
				<section className='alfb-hp-panel'>
					<header>
						<h3>{__('Your site details', 'softicon-flipbook')}</h3>
						<button type='button' className={'alfb-hp-copy' + (copied ? ' is-done' : '')} onClick={copy}>
							<span className={'dashicons dashicons-' + (copied ? 'yes' : 'clipboard')} aria-hidden='true' />{copied ? __('Copied', 'softicon-flipbook') : __('Copy', 'softicon-flipbook')}
						</button>
					</header>
					<dl className='alfb-hp-details'>
						{details.map(([name, value]) => <div key={name}><dt>{name}</dt><dd title={value}>{value}</dd></div>)}
					</dl>
					<p className='alfb-hp-note'>{__('Paste these into your ticket with the address of the page and what you see. They are only copied, never sent.', 'softicon-flipbook')}</p>
				</section>

				<section className='alfb-hp-panel alfb-hp-contact'>
					<a href={'mailto:' + EMAIL}><span className='dashicons dashicons-email-alt' aria-hidden='true' /><span><strong>{__('Email', 'softicon-flipbook')}</strong><small>{EMAIL}</small></span></a>
					{pro ? <>
						<a href={SITE + 'account/'} {...external}><span className='dashicons dashicons-admin-network' aria-hidden='true' /><span><strong>{__('Licenses and downloads', 'softicon-flipbook')}</strong><small>{__('Your account', 'softicon-flipbook')}</small></span></a>
						<a href={SITE + 'contact/'} {...external}><span className='dashicons dashicons-cart' aria-hidden='true' /><span><strong>{__('Sales and billing', 'softicon-flipbook')}</strong><small>{__('14-day money-back on Pro', 'softicon-flipbook')}</small></span></a>
					</> : <a href='#/pricing'><span className='dashicons dashicons-star-filled' aria-hidden='true' /><span><strong>{__('Pro plans', 'softicon-flipbook')}</strong><small>{__('14-day money-back on Pro', 'softicon-flipbook')}</small></span></a>}
				</section>
			</aside>
		</div>

		<div className='alfb-hp-love'>
			<span className='alfb-hp-stars' aria-hidden='true'>★★★★★</span>
			<div>
				<strong>{__('Enjoying SoftIcon Flipbook?', 'softicon-flipbook')}</strong>
				<small>{__('A review helps other people find it and keeps it free.', 'softicon-flipbook')}</small>
			</div>
			<a className='alfb-hp-btn' href='https://wordpress.org/support/plugin/softicon-flipbook/reviews/#new-post' {...external}>{__('Leave a review', 'softicon-flipbook')}</a>
			<a href='https://wordpress.org/plugins/author/softiconai/' {...external}>{__('More plugins', 'softicon-flipbook')}</a>
			<a href='https://github.com/softiconai/softicon-flipbook' {...external}>{__('Source on GitHub', 'softicon-flipbook')}</a>
		</div>
	</div>;
};

export default Help;
