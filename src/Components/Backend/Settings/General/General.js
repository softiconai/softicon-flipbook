import { __ } from '@wordpress/i18n';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, ExternalLink, PanelBody, SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { pageModes, sources, videos } from '../../../../utils/options';

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
		<PanelBody title={__('Source', 'softicon-flipbook')} initialOpen={true}>
			<SelectControl label={__('Pages from', 'softicon-flipbook')} value={source} options={sources} onChange={set('source')} __nextHasNoMarginBottom />

			{'pdf' === source ? <div className='alfbMt'>
				{fileName && <p><strong>{fileName}</strong></p>}
				<MediaUploadCheck>
					<MediaUpload allowedTypes={['application/pdf']} value={pdfId} onSelect={onSelectPdf}
						render={({ open }) => <Button variant='secondary' onClick={open}>{pdfUrl ? __('Replace PDF', 'softicon-flipbook') : __('Choose PDF', 'softicon-flipbook')}</Button>} />
				</MediaUploadCheck>
				<p className='alfbHelp'>{__('PDFs from your Media Library always work. A link to a PDF on another website works only if that site allows it.', 'softicon-flipbook')}</p>
			</div> : <div className='alfbMt'>
				{!!images.length && <div className='alfbImages'>
					{images.slice(0, 8).map(image => <img key={image.id || image.url} src={image.url} alt='' />)}
				</div>}
				<MediaUploadCheck>
					<MediaUpload allowedTypes={['image']} multiple gallery value={images.map(image => image.id)} onSelect={onSelectImages}
						render={({ open }) => <Button variant='secondary' onClick={open}>{images.length ? __('Edit pages', 'softicon-flipbook') : __('Choose images', 'softicon-flipbook')}</Button>} />
				</MediaUploadCheck>
				<p className='alfbHelp'>{__('Each image is one page. Drag them in the media window to change the order.', 'softicon-flipbook')}</p>
			</div>}
		</PanelBody>

		<PanelBody title={__('Pages', 'softicon-flipbook')} initialOpen={false}>
			<SelectControl label={__('Layout', 'softicon-flipbook')} value={pageMode} options={pageModes} onChange={set('pageMode')} __nextHasNoMarginBottom />

			<ToggleControl className='alfbMt' label={__('Cover page', 'softicon-flipbook')} help={__('The first and last pages turn on their own, like a printed book.', 'softicon-flipbook')} checked={showCover} onChange={set('showCover')} __nextHasNoMarginBottom />

			<TextControl className='alfbMt' type='number' min={1} label={__('Open at page', 'softicon-flipbook')} value={startPage} onChange={val => setAttributes({ startPage: Math.max(1, parseInt(val, 10) || 1) })} __nextHasNoMarginBottom />
		</PanelBody>

		<PanelBody title={__('Toolbar', 'softicon-flipbook')} initialOpen={false}>
			{'pdf' === source && <ToggleControl label={__('Download button', 'softicon-flipbook')} checked={showDownload} onChange={set('showDownload')} __nextHasNoMarginBottom />}

			<ToggleControl className='alfbMt' label={__('Fullscreen button', 'softicon-flipbook')} checked={showFullscreen} onChange={set('showFullscreen')} __nextHasNoMarginBottom />

			<ToggleControl className='alfbMt' label={__('Thumbnails', 'softicon-flipbook')} help={__('A button that shows all pages, a click opens one.', 'softicon-flipbook')} checked={showThumbnails} onChange={set('showThumbnails')} __nextHasNoMarginBottom />

			<ToggleControl className='alfbMt' label={__('Zoom', 'softicon-flipbook')} help={__('Zoom buttons, pinch on phones and Ctrl + scroll on computers.', 'softicon-flipbook')} checked={showZoom} onChange={set('showZoom')} __nextHasNoMarginBottom />

			<ToggleControl className='alfbMt' label={__('Page turn sound', 'softicon-flipbook')} help={__('Visitors can mute it from the toolbar.', 'softicon-flipbook')} checked={flipSound} onChange={set('flipSound')} __nextHasNoMarginBottom />
		</PanelBody>

		<PanelBody title={__('Help', 'softicon-flipbook')} initialOpen={false}>
			<p className='alfbHelp alfbHelpTitle'>{__('Video tutorials, under a minute each:', 'softicon-flipbook')}</p>
			<ul className='alfbLinks'>
				<li><ExternalLink href={videos.overview}>{__('Overview', 'softicon-flipbook')}</ExternalLink></li>
				<li><ExternalLink href={videos.add}>{__('Add a flipbook', 'softicon-flipbook')}</ExternalLink></li>
				<li><ExternalLink href={videos.design}>{__('Hardcover design', 'softicon-flipbook')}</ExternalLink></li>
				<li><ExternalLink href={videos.reading}>{__('Zoom, thumbnails and page links', 'softicon-flipbook')}</ExternalLink></li>
			</ul>
			<p className='alfbHelp'>
				{__('Still stuck? Ask in the', 'softicon-flipbook')} <ExternalLink href='https://wordpress.org/support/plugin/softicon-flipbook/'>{__('support forum', 'softicon-flipbook')}</ExternalLink> {__('or email softiconai@gmail.com.', 'softicon-flipbook')}
			</p>
		</PanelBody>
	</>;
};

export default General;
