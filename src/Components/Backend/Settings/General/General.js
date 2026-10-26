import { __ } from '@wordpress/i18n';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, TextControl } from '@wordpress/components';
import { FieldHead, HelpCards, Panel, Tiles, ToggleRow } from '../../../../vendor/softicon-tools/components/Panels';
import { helpCards, pageModes, sources } from '../../../../utils/options';

const General = ({ attributes, setAttributes, onSelectPdf, onSelectImages }) => {
	const { source, pdfId, pdfUrl, images, pageMode, showCover, startPage, showDownload, showFullscreen, showZoom, showThumbnails, flipSound } = attributes;
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
			<p className='alfbHelp'>{__('Email:', 'softicon-flipbook')} <a href='mailto:softiconai@gmail.com'>softiconai@gmail.com</a></p>
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
				<TextControl type='number' min={1} label={__('Open at page', 'softicon-flipbook')} hideLabelFromVision value={startPage} onChange={val => setAttributes({ startPage: Math.max(1, parseInt(val, 10) || 1) })} __nextHasNoMarginBottom />
			</div>
		</Panel>

		<Panel id='toolbar' title={__('Toolbar', 'softicon-flipbook')}>
			{'pdf' === source && <ToggleRow label={__('Download button', 'softicon-flipbook')} tip={__('Lets visitors save the PDF.', 'softicon-flipbook')} checked={showDownload} onChange={set('showDownload')} />}

			<ToggleRow label={__('Fullscreen button', 'softicon-flipbook')} tip={__('Fits the book to the screen and redraws the pages sharper.', 'softicon-flipbook')} checked={showFullscreen} onChange={set('showFullscreen')} />

			<ToggleRow label={__('Thumbnails', 'softicon-flipbook')} tip={__('A button that shows all pages, a click opens one.', 'softicon-flipbook')} checked={showThumbnails} onChange={set('showThumbnails')} />

			<ToggleRow label={__('Zoom', 'softicon-flipbook')} tip={__('Zoom buttons, pinch on phones and Ctrl + scroll on computers.', 'softicon-flipbook')} checked={showZoom} onChange={set('showZoom')} />

			<ToggleRow label={__('Page turn sound', 'softicon-flipbook')} tip={__('Visitors can mute it from the toolbar.', 'softicon-flipbook')} checked={flipSound} onChange={set('flipSound')} />
		</Panel>
	</>;
};

export default General;
