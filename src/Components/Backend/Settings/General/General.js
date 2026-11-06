import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { Button, ExternalLink, TextControl } from '@wordpress/components';
import { FieldHead, HelpCards, Panel, Tiles, ToggleRow } from '../../../../vendor/softicon-tools/components/Panels';
import { helpCards, pageModes, sources, videos } from '../../../../utils/options';
import ProNotice from '../../ProNotice';

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
	</div>;
};

const General = ({ attributes, setAttributes, onSelectPdf, onSelectImages }) => {
	const { source, pdfId, pdfUrl, images, pageMode, showCover, startPage, showDownload, showFullscreen, showZoom, showThumbnails, showContents, showLinks, showSearch, showShare, flipSound } = attributes;
	const set = key => val => setAttributes({ [key]: val });
	const fileName = (() => {
		const name = pdfUrl ? pdfUrl.split('/').pop().split('?')[0] : '';
		try {
			return decodeURIComponent(name);
		} catch (e) {
			// a pasted link can hold a stray %
			return name;
		}
	})();

	return <>
		<Panel id='help' title={__('Help', 'softicon-flipbook')}>
			<HelpCards cards={helpCards} />
			<p className='alfbHelp'><ExternalLink href={videos.settings}>{__('Every setting explained, in 2 minutes', 'softicon-flipbook')}</ExternalLink></p>
			<p className='alfbHelp'>{__('Email:', 'softicon-flipbook')} <a href='mailto:softiconai@gmail.com'>softiconai@gmail.com</a></p>
			<Shortcode />
		</Panel>

		<Panel id='source' title={__('Source', 'softicon-flipbook')}>
			<Tiles label={__('Pages from', 'softicon-flipbook')} value={source} options={sources} onChange={set('source')} />

			{'pdf' === source ? <div className='alfbStack'>
				<FieldHead label={__('PDF', 'softicon-flipbook')} tip={__('PDFs from your Media Library always work. A link to a PDF on another website works only if that site allows it.', 'softicon-flipbook')} />
				{fileName && <p className='alfbFile'>{fileName}</p>}
				<MediaUploadCheck>
					<MediaUpload allowedTypes={['application/pdf']} value={pdfId} onSelect={onSelectPdf}
						render={({ open }) => <Button variant='secondary' onClick={open}>{pdfUrl ? __('Replace PDF', 'softicon-flipbook') : __('Choose PDF', 'softicon-flipbook')}</Button>} />
				</MediaUploadCheck>
				<ToggleRow label={__('Links in the PDF', 'softicon-flipbook')} tip={__('Web, email and page links inside the PDF can be clicked. Web links open in a new tab, page links turn the book.', 'softicon-flipbook')} checked={showLinks} onChange={set('showLinks')} />
			</div> : <div className='alfbStack'>
				<FieldHead label={__('Pages', 'softicon-flipbook')} tip={__('Each image is one page. Drag them in the media window to change the order.', 'softicon-flipbook')} />
				{!!images.length && <div className='alfbImages'>
					{images.slice(0, 8).map(image => <img key={image.id || image.url} src={image.url} alt='' />)}
				</div>}
				<MediaUploadCheck>
					<MediaUpload allowedTypes={['image']} multiple gallery value={images.map(image => image.id)} onSelect={onSelectImages}
						render={({ open }) => <Button variant='secondary' onClick={open}>{images.length ? __('Edit pages', 'softicon-flipbook') : __('Choose images', 'softicon-flipbook')}</Button>} />
				</MediaUploadCheck>
			</div>}
		</Panel>

		<Panel id='pages' title={__('Pages', 'softicon-flipbook')}>
			<Tiles label={__('Layout', 'softicon-flipbook')} tip={__('Auto shows two pages side by side on wide screens and one page on phones. Or keep one layout everywhere.', 'softicon-flipbook')} value={pageMode} options={pageModes} onChange={set('pageMode')} />

			<ToggleRow label={__('Cover page', 'softicon-flipbook')} tip={__('The first and last pages turn on their own, like a printed book.', 'softicon-flipbook')} checked={showCover} onChange={set('showCover')} />

			<div>
				<FieldHead label={__('Open at page', 'softicon-flipbook')} tip={__('The book opens at this page. A link ending in #page=5 opens it at page 5.', 'softicon-flipbook')} />
				<StartPage value={startPage} onChange={val => setAttributes({ startPage: val })} />
			</div>
		</Panel>

		<Panel id='toolbar' title={__('Toolbar', 'softicon-flipbook')}>
			<p className='alfbHelp'>{__('The preview here shows only the book; the buttons work on the published page.', 'softicon-flipbook')}</p>

			{'pdf' === source && <ToggleRow label={__('Download button', 'softicon-flipbook')} tip={__('Lets visitors save the PDF.', 'softicon-flipbook')} checked={showDownload} onChange={set('showDownload')} />}

			<ToggleRow label={__('Fullscreen button', 'softicon-flipbook')} tip={__('Fits the book to the screen and redraws the pages sharper.', 'softicon-flipbook')} checked={showFullscreen} onChange={set('showFullscreen')} />

			{'pdf' === source && <ToggleRow label={__('Table of contents', 'softicon-flipbook')} tip={__("A button with the PDF's chapters (its bookmarks), a click opens one. It shows only when the PDF has bookmarks.", 'softicon-flipbook')} checked={showContents} onChange={set('showContents')} />}

			<ToggleRow label={__('Thumbnails', 'softicon-flipbook')} tip={__('A button that shows all pages, a click opens one.', 'softicon-flipbook')} checked={showThumbnails} onChange={set('showThumbnails')} />

			<ToggleRow label={__('Zoom', 'softicon-flipbook')} tip={__('Zoom buttons, pinch on phones and Ctrl + scroll on computers.', 'softicon-flipbook')} checked={showZoom} onChange={set('showZoom')} />

			{'pdf' === source && <ToggleRow label={__('Search', 'softicon-flipbook')} tip={__('A search box that lists the pages with the words, a click opens the page. PDFs only.', 'softicon-flipbook')} checked={showSearch} onChange={set('showSearch')} />}

			<ToggleRow label={__('Share', 'softicon-flipbook')} tip={__('Shares or copies a link to the page that is open.', 'softicon-flipbook')} checked={showShare} onChange={set('showShare')} />

			<ToggleRow label={__('Page turn sound', 'softicon-flipbook')} tip={__('Visitors can mute it from the toolbar.', 'softicon-flipbook')} checked={flipSound} onChange={set('flipSound')} />
		</Panel>

		{/* the Pro settings of this block, shown as notices only: the code is in Pro, which replaces these panels */}
		{!editorInfo.pro && <>
			<Panel id='buttons' title={__('Page buttons', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
				<ProNotice href={editorInfo.pricing} text={__('A button on a chosen page, such as a link or a WooCommerce product with its price, is available in Pro.', 'softicon-flipbook')} />
				<p className='alfbHelp'><ExternalLink href={videos.buttons}>{__('Watch page buttons in 45 seconds', 'softicon-flipbook')}</ExternalLink></p>
			</Panel>
			<Panel id='leads' title={__('Lead capture', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
				<ProNotice href={editorInfo.pricing} text={__('Asking readers for their email after a few pages is available in Pro. The leads are saved on your site.', 'softicon-flipbook')} />
				<p className='alfbHelp'><ExternalLink href={videos.leads}>{__('Watch lead capture in 45 seconds', 'softicon-flipbook')}</ExternalLink></p>
			</Panel>
			<Panel id='shelf' title={__('Shelf', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
				<ProNotice href={editorInfo.pricing} text={__('Showing many books on one shelf, each opening in a popup, is available in Pro.', 'softicon-flipbook')} />
				<p className='alfbHelp'><ExternalLink href={videos.shelf}>{__('Watch the shelf in 45 seconds', 'softicon-flipbook')}</ExternalLink></p>
			</Panel>
			<Panel id='protect' title={__('Protection', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
				<ProNotice href={editorInfo.pricing} text={__('Protecting the PDF (a password, no download button, no right-click, the PDF address kept out of the page) is available in Pro.', 'softicon-flipbook')} />
				<p className='alfbHelp'><ExternalLink href={videos.protect}>{__('Watch protection in 40 seconds', 'softicon-flipbook')}</ExternalLink></p>
			</Panel>
		</>}
	</>;
};

export default General;
