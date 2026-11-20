import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import { Button, ExternalLink, SelectControl, TextControl } from '@wordpress/components';
import { FieldHead, HelpCards, Panel, Tiles, ToggleRow } from '../../../../vendor/softicon-tools/components/Panels';
import { helpCards, pageModes, sources, videos } from '../../../../utils/options';
import ProNotice from '../../ProNotice';
import { ImagesPicker, PdfPicker } from './SourcePicker';

// the number can be emptied while typing; it becomes a page (1 or more) when the field loses focus
const StartPage = ({ value, onChange }) => {
	const [text, setText] = useState(String(value));
	useEffect(() => setText(String(value)), [value]);
	return <TextControl type='number' min={1} label={__('Open at page', 'softicon-flipbook')} hideLabelFromVision value={text}
		onChange={val => {
			setText(val);
			if (parseInt(val, 10) >= 1) {
				onChange(parseInt(val, 10));
			}
		}}
		onBlur={() => setText(String(value))} __nextHasNoMarginBottom />;
};

// set by includes/block.php
const editorInfo = window.alfbEditor || {};

// a flipbook under Flipbook → All Flipbooks (includes/shortcode.php): its shortcode, for the Classic Editor and page builders
const Shortcode = () => {
	const [copied, setCopied] = useState(false);
	const { type, id, published } = useSelect(select => {
		const editor = select('core/editor');
		return { type: editor?.getCurrentPostType(), id: editor?.getCurrentPostId(), published: 'publish' === editor?.getEditedPostAttribute('status') };
	}, []);
	if ('alfb_book' !== type || !id) {
		return null;
	}
	const code = `[softicon_flipbook id="${id}"]`;
	const copy = event => {
		const input = event.currentTarget.previousElementSibling;
		const done = () => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		};
		if (window.navigator.clipboard && window.isSecureContext) {
			window.navigator.clipboard.writeText(code).then(done);
			return;
		}
		// http sites have no clipboard API
		input.select();
		if (input.ownerDocument.execCommand('copy')) {
			done();
		}
	};
	return <div className='alfbShortcode'>
		<FieldHead label={__('Shortcode', 'softicon-flipbook')} tip={__('Paste it in the Classic Editor, Elementor or any page builder to show this flipbook there.', 'softicon-flipbook')} />
		<div className='alfbShortcodeRow'>
			<input type='text' readOnly value={code} onFocus={event => event.target.select()} aria-label={__('Shortcode', 'softicon-flipbook')} />
			<Button variant='secondary' onClick={copy}>{copied ? __('Copied', 'softicon-flipbook') : __('Copy', 'softicon-flipbook')}</Button>
		</div>
		{!published && <p className='alfbHelp'>{__('It shows the flipbook once it is published.', 'softicon-flipbook')}</p>}
		<p className='alfbHelp'><ExternalLink href={videos.shortcode}>{__('Where to paste it: the Classic Editor, Elementor and more', 'softicon-flipbook')}</ExternalLink></p>
		{/* includes/shortcode.php: any setting, by its name, for the one place the shortcode is pasted */}
		<details className='alfbShortcodeMore'>
			<summary>{__('Change a setting in one place', 'softicon-flipbook')}</summary>
			<p>{__('Add a setting to the shortcode to change it only where you paste it; this flipbook keeps its own everywhere else. For example:', 'softicon-flipbook')}</p>
			<code>{`[softicon_flipbook id="${id}" height="500" theme="dark" show_download="no"]`}</code>
			<p>{__('More:', 'softicon-flipbook')} <code>page_mode</code> (auto, double, single), <code>book_style</code> (flat, hardcover), <code>display_mode</code> (inline, lightbox), <code>start_page</code>, <code>bg_color</code>, <code>show_share</code>, <code>show_print</code>, <code>autoplay</code>, <code>rtl</code>.</p>
			<p>{__('Yes or no settings take yes, no, true, false, 1 or 0. A name or value the flipbook does not know is left out, with a note that only its editors see.', 'softicon-flipbook')}</p>
		</details>
	</div>;
};

const General = ({ attributes, setAttributes, onSelectPdf, onSelectPdfUrl, onSelectImages }) => {
	const { source, pdfId, pdfUrl, images, pageMode, showCover, startPage, startWith, autoplay, autoplaySeconds, autoplayLoop, rtl, phoneFullscreen, showDownload, showPrint, showFirstLast, showSeek, showFullscreen, showZoom, showThumbnails, showContents, showLinks, showSearch, showShare, flipSound } = attributes;
	const set = key => val => setAttributes({ [key]: val });
	// SoftIcon Flipbook Pro: under a setting, whether it follows the site default or is this book's own
	const hint = name => applyFilters('alfb.block.hint', null, { name, setAttributes });

	return <>
		<Panel id='help' title={__('Help', 'softicon-flipbook')}>
			<HelpCards cards={helpCards} />
			<p className='alfbHelp'><ExternalLink href={videos.settings}>{__('Every setting explained, in 2 minutes', 'softicon-flipbook')}</ExternalLink></p>
			<p className='alfbHelp'>{__('Email:', 'softicon-flipbook')} <a href='mailto:support@softiconai.com'>support@softiconai.com</a></p>
			<Shortcode />
		</Panel>

		<Panel id='source' title={__('Source', 'softicon-flipbook')}>
			<Tiles label={__('Pages from', 'softicon-flipbook')} value={source} options={sources} onChange={set('source')} />

			{'pdf' === source ? <div className='alfbStack'>
				<FieldHead label={__('PDF', 'softicon-flipbook')} tip={__('PDFs from your Media Library always work. A link to a PDF on another website works only if that site allows it.', 'softicon-flipbook')} />
				<PdfPicker {...{ pdfId, pdfUrl, onSelectPdf, onSelectPdfUrl }} />
				{!editorInfo.pro && <ProNotice href={editorInfo.pricing} text={__('Taking each post\'s PDF from a custom field (Meta Box, ACF), and text readers can select and copy, are available in Pro.', 'softicon-flipbook')}
					video={videos.field} videoLabel={__('Watch: each post\'s own PDF from Meta Box or ACF', 'softicon-flipbook')} />}
				<ToggleRow label={__('Links in the PDF', 'softicon-flipbook')} tip={__('Web, email and page links inside the PDF can be clicked. Web links open in a new tab, page links turn the book.', 'softicon-flipbook')} checked={showLinks} onChange={set('showLinks')} />{hint('showLinks')}
			</div> : <div className='alfbStack'>
				<FieldHead label={__('Pages', 'softicon-flipbook')} tip={__('Each image is one page. Drag them in the media window to change the order.', 'softicon-flipbook')} />
				<ImagesPicker {...{ images, onSelectImages }} />
			</div>}
		</Panel>

		<Panel id='pages' title={__('Pages', 'softicon-flipbook')}>
			<Tiles label={__('Layout', 'softicon-flipbook')} tip={__('Auto shows two pages side by side on wide screens and one page on phones. Or keep one layout everywhere.', 'softicon-flipbook')} value={pageMode} options={pageModes} onChange={set('pageMode')} />{hint('pageMode')}

			<ToggleRow label={__('Cover page', 'softicon-flipbook')} tip={__('The first and last pages turn on their own, like a printed book.', 'softicon-flipbook')} checked={showCover} onChange={set('showCover')} />{hint('showCover')}

			<div>
				<FieldHead label={__('Open at page', 'softicon-flipbook')} tip={__('The book opens at this page. A link ending in #page=5 opens it at page 5.', 'softicon-flipbook')} />
				<StartPage value={startPage} onChange={val => setAttributes({ startPage: val })} />
			</div>

			<div>
				<FieldHead label={__('Start with', 'softicon-flipbook')} tip={__('Readers first pick a page from the thumbnails or the table of contents (the PDF\'s bookmarks).', 'softicon-flipbook')} />
				<SelectControl label={__('Start with', 'softicon-flipbook')} hideLabelFromVision
					value={startWith} onChange={set('startWith')} __next40pxDefaultSize __nextHasNoMarginBottom
					options={[
						{ label: __('The book', 'softicon-flipbook'), value: 'book' },
						{ label: __('The thumbnails', 'softicon-flipbook'), value: 'thumbnails' },
						{ label: __('The table of contents', 'softicon-flipbook'), value: 'contents' }
					]} />
			</div>

			<ToggleRow label={__('Right to left', 'softicon-flipbook')} tip={__('For books read from right to left, such as Arabic, Hebrew or Urdu: the next page is on the left, and the arrows and arrow keys follow.', 'softicon-flipbook')} checked={rtl} onChange={set('rtl')} />{hint('rtl')}

			<ToggleRow label={__('Autoplay', 'softicon-flipbook')} tip={__('Turns the pages by itself while the book is on screen, on the published page. It holds while the mouse is over the book, stops when a reader takes over, and the toolbar gets a pause button.', 'softicon-flipbook')} checked={autoplay} onChange={set('autoplay')} />
			{autoplay && <>
				<div>
					<FieldHead label={__('Seconds per page', 'softicon-flipbook')} />
					<TextControl type='number' min={2} max={60} label={__('Seconds per page', 'softicon-flipbook')} hideLabelFromVision value={autoplaySeconds}
						onChange={val => setAttributes({ autoplaySeconds: Math.min(60, Math.max(2, parseInt(val, 10) || 4)) })} __next40pxDefaultSize __nextHasNoMarginBottom />{hint('autoplaySeconds')}
				</div>
				<ToggleRow label={__('Start again at the end', 'softicon-flipbook')} tip={__('After the last page the book goes back to the first one and keeps playing.', 'softicon-flipbook')} checked={autoplayLoop} onChange={set('autoplayLoop')} />{hint('autoplayLoop')}
			</>}
			<p className='alfbHelp'><ExternalLink href={videos.autoplay}>{__('Watch autoplay in 45 seconds', 'softicon-flipbook')}</ExternalLink></p>
			<p className='alfbHelp'><ExternalLink href={videos.rtl}>{__('Watch right to left and fullscreen on phones', 'softicon-flipbook')}</ExternalLink></p>
		</Panel>

		<Panel id='toolbar' title={__('Toolbar', 'softicon-flipbook')}>
			<ToggleRow label={__('First and last page', 'softicon-flipbook')} tip={__('Two more buttons beside the arrows that go straight to the first or the last page.', 'softicon-flipbook')} checked={showFirstLast} onChange={set('showFirstLast')} />{hint('showFirstLast')}

			<ToggleRow label={__('Page slider', 'softicon-flipbook')} tip={__('A slider above the buttons: drag it to any page of a long book.', 'softicon-flipbook')} checked={showSeek} onChange={set('showSeek')} />{hint('showSeek')}

			{'pdf' === source && <><ToggleRow label={__('Download button', 'softicon-flipbook')} tip={__('Lets visitors save the PDF.', 'softicon-flipbook')} checked={showDownload} onChange={set('showDownload')} />{hint('showDownload')}</>}

			<ToggleRow label={__('Print button', 'softicon-flipbook')} tip={__('Readers print the whole book. The pages are prepared in the browser first, so a long book takes a moment.', 'softicon-flipbook')} checked={showPrint} onChange={set('showPrint')} />{hint('showPrint')}

			<ToggleRow label={__('Fullscreen button', 'softicon-flipbook')} tip={__('Fits the book to the screen and redraws the pages sharper.', 'softicon-flipbook')} checked={showFullscreen} onChange={set('showFullscreen')} />{hint('showFullscreen')}

			<ToggleRow label={__('Fullscreen on phones', 'softicon-flipbook')} tip={__('On a phone the book shows "Tap to read"; one tap opens it full screen, where the pages are easier to read.', 'softicon-flipbook')} checked={phoneFullscreen} onChange={set('phoneFullscreen')} />{hint('phoneFullscreen')}

			{'pdf' === source && <><ToggleRow label={__('Table of contents', 'softicon-flipbook')} tip={__("A button with the PDF's chapters (its bookmarks), a click opens one. It shows only when the PDF has bookmarks.", 'softicon-flipbook')} checked={showContents} onChange={set('showContents')} />{hint('showContents')}</>}

			<ToggleRow label={__('Thumbnails', 'softicon-flipbook')} tip={__('A button that shows all pages, a click opens one.', 'softicon-flipbook')} checked={showThumbnails} onChange={set('showThumbnails')} />{hint('showThumbnails')}

			{!editorInfo.pro && <ProNotice href={editorInfo.pricing} text={__('Bookmarks, so readers can mark pages and come back to them, are available in Pro.', 'softicon-flipbook')}
				video={videos.bookmarks} videoLabel={__('Watch: bookmarks and selectable text', 'softicon-flipbook')} />}

			<ToggleRow label={__('Zoom', 'softicon-flipbook')} tip={__('Zoom buttons, pinch on phones and Ctrl + scroll on computers.', 'softicon-flipbook')} checked={showZoom} onChange={set('showZoom')} />{hint('showZoom')}

			{'pdf' === source && <><ToggleRow label={__('Search', 'softicon-flipbook')} tip={__('A search box that lists the pages with the words, a click opens the page. PDFs only.', 'softicon-flipbook')} checked={showSearch} onChange={set('showSearch')} />{hint('showSearch')}</>}

			<ToggleRow label={__('Share', 'softicon-flipbook')} tip={__('A link to the page that is open: on Facebook, X, LinkedIn, Pinterest, by email or copied. Phones use their own share sheet.', 'softicon-flipbook')} checked={showShare} onChange={set('showShare')} />{hint('showShare')}

			<ToggleRow label={__('Page turn sound', 'softicon-flipbook')} tip={__('Visitors can mute it from the toolbar.', 'softicon-flipbook')} checked={flipSound} onChange={set('flipSound')} />{hint('flipSound')}
		</Panel>

		{/* the Pro settings of this block, shown as notices only: the code is in Pro, which replaces these panels */}
		{!editorInfo.pro && <>
			<Panel id='buttons' title={__('Page buttons', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
				<ProNotice href={editorInfo.pricing} text={__('A button on a chosen page, such as a link or a WooCommerce product with its price, is available in Pro.', 'softicon-flipbook')}
					video={videos.buttons} videoLabel={__('Watch page buttons in 45 seconds', 'softicon-flipbook')} />
			</Panel>
			<Panel id='hotspots' title={__('Hotspots', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
				<ProNotice href={editorInfo.pricing} text={__('Clickable areas on your pages, with a link or a WooCommerce product and its price, are available in Pro.', 'softicon-flipbook')}
					video={videos.hotspots} videoLabel={__('Watch hotspots in 45 seconds', 'softicon-flipbook')} />
			</Panel>
			<Panel id='leads' title={__('Lead capture', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
				<ProNotice href={editorInfo.pricing} text={__('Asking readers for their email after a few pages is available in Pro. The leads are saved on your site.', 'softicon-flipbook')}
					video={videos.leads} videoLabel={__('Watch lead capture in 45 seconds', 'softicon-flipbook')} />
			</Panel>
			<Panel id='shelf' title={__('Shelf', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
				<ProNotice href={editorInfo.pricing} text={__('Showing many books on one shelf, each opening in a popup, is available in Pro.', 'softicon-flipbook')}
					video={videos.shelf} videoLabel={__('Watch the shelf in 45 seconds', 'softicon-flipbook')} />
			</Panel>
			<Panel id='protect' title={__('Protection', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
				<ProNotice href={editorInfo.pricing} text={__('Protecting the PDF (a password, no download button, no right-click, the PDF address kept out of the page) is available in Pro.', 'softicon-flipbook')}
					video={videos.protect} videoLabel={__('Watch protection in 40 seconds', 'softicon-flipbook')} />
			</Panel>
			<Panel id='watermark' title={__('Watermark', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
				<ProNotice href={editorInfo.pricing} text={__('Your words or logo drawn into every page, with the reader\'s name or email if you like, is available in Pro.', 'softicon-flipbook')} />
			</Panel>
		</>}
	</>;
};

export default General;
