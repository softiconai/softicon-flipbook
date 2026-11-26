// the Source panel: the same ways to pick the PDF or the pages as the empty block (Upload, Media Library, a link)
import { __, _n, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { MediaUpload, MediaUploadCheck, store as blockEditorStore } from '@wordpress/block-editor';
import { Button, FormFileUpload, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { icons } from '../../../../utils/icons';
import { driveId } from '../../../../utils/drive';
import ProNotice from '../../ProNotice';

const editorInfo = window.alfbEditor || {};

// the PDF's file name from its address
const nameOf = url => {
	const name = url ? url.split('/').pop().split('?')[0] : '';
	try {
		return decodeURIComponent(name);
	} catch (e) {
		// a pasted link can hold a stray %
		return name;
	}
};

const hostOf = url => {
	try {
		return new URL(url).host;
	} catch (e) {
		return '';
	}
};

// the block editor's own upload, as the empty block uses it
const useUpload = (allowedTypes, onDone) => {
	const [busy, setBusy] = useState(false);
	const mediaUpload = useSelect(select => select(blockEditorStore).getSettings().mediaUpload, []);
	const { createErrorNotice } = useDispatch('core/notices');
	const upload = files => {
		if (!mediaUpload || !files?.length) {
			return;
		}
		setBusy(true);
		mediaUpload({
			allowedTypes,
			filesList: files,
			// called with blob previews first; the book changes once every file is in the Media Library
			onFileChange: items => {
				if (items.every(item => item?.id)) {
					setBusy(false);
					onDone(items);
				}
			},
			onError: message => {
				setBusy(false);
				createErrorNotice(message, { type: 'snackbar' });
			}
		});
	};
	return { busy, upload, canUpload: !!mediaUpload };
};

const UploadButton = ({ accept, multiple, allowedTypes, onDone }) => {
	const { busy, upload, canUpload } = useUpload(allowedTypes, onDone);
	if (!canUpload) {
		return null;
	}
	return <FormFileUpload accept={accept} multiple={multiple} onChange={event => upload(event.target.files)}
		render={({ openFileDialog }) => <Button variant='primary' className='alfbSourceBtn' onClick={openFileDialog} disabled={busy} __next40pxDefaultSize>
			{busy ? <><Spinner />{__('Uploading…', 'softicon-flipbook')}</> : __('Upload', 'softicon-flipbook')}
		</Button>} />;
};

// a link typed in place, the same as the empty block's Insert from URL
const UrlForm = ({ value, onApply, onCancel }) => {
	const [url, setUrl] = useState(value || '');
	const apply = event => {
		event.preventDefault();
		if (url.trim()) {
			onApply(url.trim());
		}
	};
	return <form className='alfbSourceUrl' onSubmit={apply}>
		<input type='url' value={url} placeholder='https://…/file.pdf' aria-label={__('PDF link', 'softicon-flipbook')}
			onChange={event => setUrl(event.target.value)} autoFocus />
		<div className='alfbSourceUrlButtons'>
			<Button variant='primary' type='submit' disabled={!url.trim()} size='compact'>{__('Apply', 'softicon-flipbook')}</Button>
			<Button variant='tertiary' onClick={onCancel} size='compact'>{__('Cancel', 'softicon-flipbook')}</Button>
		</div>
	</form>;
};

export const PdfPicker = ({ pdfId, pdfUrl, onSelectPdf, onSelectPdfUrl }) => {
	const [typing, setTyping] = useState(false);
	const host = !pdfId && hostOf(pdfUrl);

	return <div className='alfbSource'>
		{pdfUrl && <div className='alfbSourceFile'>
			<span className='alfbSourceFileIcon'>{icons.pdf}</span>
			<span className='alfbSourceFileText'>
				<strong title={nameOf(pdfUrl)}>{nameOf(pdfUrl) || pdfUrl}</strong>
				<small>{pdfId ? __('In the Media Library', 'softicon-flipbook') : sprintf(
					/* translators: %s: the website the PDF link points to */
					__('Link to %s', 'softicon-flipbook'), host || __('a website', 'softicon-flipbook'))}</small>
			</span>
		</div>}

		<MediaUploadCheck>
			<div className='alfbSourceButtons'>
				<UploadButton accept='application/pdf' allowedTypes={['application/pdf']} onDone={items => onSelectPdf(items[0])} />
				<MediaUpload allowedTypes={['application/pdf']} value={pdfId} onSelect={onSelectPdf}
					render={({ open }) => <Button variant='secondary' className='alfbSourceBtn' onClick={open} __next40pxDefaultSize>{__('Media Library', 'softicon-flipbook')}</Button>} />
			</div>
		</MediaUploadCheck>

		{!editorInfo.pro && !pdfId && driveId(pdfUrl) && <ProNotice href={editorInfo.pricing} text={__('Showing a PDF from Google Drive, or from a website that does not allow it, is available in Pro.', 'softicon-flipbook')} />}

		{typing ? <UrlForm value={pdfId ? '' : pdfUrl} onCancel={() => setTyping(false)} onApply={url => {
			onSelectPdfUrl(url);
			setTyping(false);
		}} /> : <Button variant='secondary' className='alfbSourceBtn alfbSourceBtnWide' icon={icons.link} onClick={() => setTyping(true)} __next40pxDefaultSize>
			{__('Insert from URL', 'softicon-flipbook')}
		</Button>}
	</div>;
};

export const ImagesPicker = ({ images, onSelectImages }) => <div className='alfbSource'>
	{!!images.length && <>
		<div className='alfbImages'>
			{images.slice(0, 8).map(image => <img key={image.id || image.url} src={image.url} alt='' />)}
		</div>
		<p className='alfbHelp'>{sprintf(
			/* translators: %d: how many pages the book has */
			_n('%d page', '%d pages', images.length, 'softicon-flipbook'), images.length)}</p>
	</>}
	<MediaUploadCheck>
		<div className='alfbSourceButtons'>
			{/* uploaded images are added after the pages already there */}
			<UploadButton accept='image/*' multiple allowedTypes={['image']} onDone={items => onSelectImages([...images, ...items])} />
			<MediaUpload allowedTypes={['image']} multiple gallery value={images.map(image => image.id)} onSelect={onSelectImages}
				render={({ open }) => <Button variant='secondary' className='alfbSourceBtn' onClick={open} __next40pxDefaultSize>
					{images.length ? __('Edit pages', 'softicon-flipbook') : __('Media Library', 'softicon-flipbook')}
				</Button>} />
		</div>
	</MediaUploadCheck>
</div>;
