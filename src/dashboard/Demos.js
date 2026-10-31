import { useEffect, useMemo } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useApi } from './api';
import { DemoBook } from './Book';

// the sample PDFs in assets/demo (Lunora Living is a made-up brand)
const coreDemos = base => {
	const spring = { pdfUrl: base + 'spring-catalog.pdf', maxHeight: 420 };
	const guide = { pdfUrl: base + 'room-guide.pdf', maxHeight: 420 };
	return [
		{ key: 'classic', title: __('Classic book', 'softicon-flipbook'), text: __('The default look: two pages side by side, one page on phones, and the full toolbar.', 'softicon-flipbook'), books: [{ attributes: spring }] },
		{ key: 'hardcover', title: __('Hardcover', 'softicon-flipbook'), text: __('Pages inside a cover, with the stack of page edges, a shadow at the spine and large arrows.', 'softicon-flipbook'), books: [{ attributes: { ...spring, bookStyle: 'hardcover', sideArrows: true, coverColor: '#0f766e' } }] },
		{ key: 'guide', title: __('Chapters and links', 'softicon-flipbook'), text: __('A PDF with bookmarks gets a table of contents, and the links inside it can be clicked.', 'softicon-flipbook'), books: [{ attributes: guide }] },
		{
			key: 'covers', row: true, title: __('Covers that open a popup', 'softicon-flipbook'), text: __('Only the covers show on the page. A click opens the book over the page, and it loads only then.', 'softicon-flipbook'), books: [
				{ attributes: { ...spring, displayMode: 'lightbox', lightboxText: __('Spring Living 2026', 'softicon-flipbook'), lightboxWidth: 170 } },
				{ attributes: { ...guide, displayMode: 'lightbox', lightboxText: __('Room Guide 2026', 'softicon-flipbook'), lightboxWidth: 170, bookStyle: 'hardcover', sideArrows: true } }
			]
		},
		{ key: 'button', title: __('A button that opens a popup', 'softicon-flipbook'), text: __('A theme-styled button, or a plain text link, opens the book in a popup.', 'softicon-flipbook'), books: [{ attributes: { ...guide, displayMode: 'lightbox', lightboxTrigger: 'button', lightboxText: __('Open the room guide', 'softicon-flipbook') } }] }
	];
};

// the free plugin shows a locked card for each Pro feature marked "featured" in Freemius
const Locked = () => {
	const { data } = useApi('/alfb/v1/dashboard/plans');
	return (data?.pro_only || []).filter(feature => feature.featured).map(feature => <article key={feature.title} className='alfb-card alfb-demo is-pro'>
		<header>
			<h3>{feature.title} <span className='alfb-badge'>{__('Pro', 'softicon-flipbook')}</span></h3>
			<p>{feature.text}</p>
		</header>
		<div className='alfb-demo-locked'><span className='dashicons dashicons-lock' aria-hidden='true' /></div>
		<footer><a className='alfb-btn alfb-btn-amber' href='#/compare'>{__('Available in Pro', 'softicon-flipbook')}</a></footer>
	</article>);
};

const Demos = ({ config }) => {
	// SoftIcon Flipbook Pro adds its own live demos here
	const demos = useMemo(() => applyFilters('alfb.dashboard.demos', coreDemos(config.urls.demo), config), [config]);

	// the books are real flipbooks; the viewer starts them once they are on the page
	useEffect(() => {
		window.dispatchEvent(new window.Event('alfb:boot'));
	}, []);

	return <>
		<p className='alfb-lead'>{__('These are real flipbooks, try them. Add one to any page with the Flipbook block.', 'softicon-flipbook')}</p>
		<div className='alfb-demos'>
			{demos.map(demo => <article key={demo.key} className={'alfb-card alfb-demo' + (demo.pro ? ' is-pro' : '')}>
				<header>
					<h3>{demo.title}{demo.pro && <> <span className='alfb-badge'>{__('Pro', 'softicon-flipbook')}</span></>}</h3>
					<p>{demo.text}</p>
				</header>
				<div className={'alfb-demo-view' + (demo.row ? ' is-row' : '')}>
					{demo.books.map((book, i) => <DemoBook key={i} book={book} />)}
				</div>
			</article>)}
			{!config.pro && <Locked />}
		</div>
	</>;
};

export default Demos;
