import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { BlockControls, MediaPlaceholder, MediaReplaceFlow, MediaUpload, MediaUploadCheck, useBlockProps } from '@wordpress/block-editor';
import { Button, ExternalLink, ToolbarButton } from '@wordpress/components';
// copied from the shared softicon-tools folder by `npm run tools` (prebuild), edit it there
import useIframeAssets from '../../vendor/softicon-tools/hooks/useIframeAssets';
import Settings from './Settings/Settings';
import Flipbook from '../../viewer/Flipbook';
import { blockIcon } from '../../utils/icons';
import { cssVars, hasContent, toConfig, toImage } from '../../utils/functions';
import { videos } from '../../utils/options';

// waits for the user to stop dragging a slider before the preview reloads the PDF
const useDebounced = (value, delay) => {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
};

const Edit = (props) => {
	const { attributes, setAttributes } = props;
	const { source, pdfId, pdfUrl, images } = attributes;
	const host = useRef();
	const root = useRef();
	// a block installed from the inserter's search gets these only in the top window
	const assetsRef = useIframeAssets(['softicon-flipbook-style-css', 'softicon-flipbook-editor-style-css']);

	const onSelectPdf = media => setAttributes({ pdfId: media.id || 0, pdfUrl: media.url || media.source_url || '' });
	const onSelectPdfUrl = url => setAttributes({ pdfId: 0, pdfUrl: url });
	const onSelectImages = items => setAttributes({ images: items.map(toImage) });

	const ready = hasContent(attributes);
	const configKey = useDebounced(JSON.stringify(toConfig(attributes)), 400);

	useEffect(() => {
		const el = host.current;
		const config = JSON.parse(configKey);
		// the debounced config can still be the empty one right after a file is picked
		if (!ready || !el || !('images' === config.source ? config.images.length : config.pdf)) {
			return;
		}
		const doc = el.ownerDocument;
		const wrapper = doc.createElement('div');
		wrapper.className = 'alfb_wrapper';
		wrapper.innerHTML = '<div class="alfb_stage"><div class="alfb_loading"><span class="alfb_spinner"></span></div></div>';
		el.replaceChildren(wrapper);
		root.current = wrapper;
		applyColors();

		const book = new Flipbook(wrapper, config, { editor: true });
		book.init();

		return () => {
			book.destroy();
			el.replaceChildren();
			root.current = null;
		};
	}, [configKey, ready]);

	// colors change live, no need to reload the book
	const applyColors = () => {
		if (!root.current) {
			return;
		}
		Object.entries(cssVars(attributes)).forEach(([name, value]) => value ? root.current.style.setProperty(name, value) : root.current.style.removeProperty(name));
	};
	useEffect(applyColors, [attributes.bgColor, attributes.toolbarBg, attributes.toolbarColor, attributes.coverColor]);

	const switchSource = value => <>
		<Button variant='link' onClick={() => setAttributes({ source: value })}>
			{'images' === value ? __('Use images instead', 'softicon-flipbook') : __('Use a PDF instead', 'softicon-flipbook')}
		</Button>
		<p className='alfbPlaceholderHelp'><ExternalLink href={videos.add}>{__('New here? Watch the 36-second tutorial', 'softicon-flipbook')}</ExternalLink></p>
	</>;

	if (!ready) {
		return <div {...useBlockProps({ ref: assetsRef })}>
			{'images' === source ?
				<MediaPlaceholder icon={blockIcon} labels={{ title: __('Flipbook', 'softicon-flipbook'), instructions: __('Upload or pick the page images, in reading order.', 'softicon-flipbook') }}
					allowedTypes={['image']} multiple gallery onSelect={onSelectImages}>
					{switchSource('pdf')}
				</MediaPlaceholder> :
				<MediaPlaceholder icon={blockIcon} labels={{ title: __('Flipbook', 'softicon-flipbook'), instructions: __('Upload a PDF, pick one from the Media Library or paste a link.', 'softicon-flipbook') }}
					allowedTypes={['application/pdf']} accept='application/pdf' onSelect={onSelectPdf} onSelectURL={onSelectPdfUrl}>
					{switchSource('images')}
				</MediaPlaceholder>}
		</div>;
	}

	return <>
		<Settings {...{ attributes, setAttributes, onSelectPdf, onSelectImages }} />

		<BlockControls group='other'>
			{'images' === source ?
				<MediaUploadCheck>
					<MediaUpload allowedTypes={['image']} multiple gallery value={images.map(image => image.id)} onSelect={onSelectImages}
						render={({ open }) => <ToolbarButton onClick={open}>{__('Edit pages', 'softicon-flipbook')}</ToolbarButton>} />
				</MediaUploadCheck> :
				<MediaReplaceFlow mediaId={pdfId} mediaURL={pdfUrl} allowedTypes={['application/pdf']} accept='application/pdf' onSelect={onSelectPdf} onSelectURL={onSelectPdfUrl} name={__('Replace PDF', 'softicon-flipbook')} />}
		</BlockControls>

		<div {...useBlockProps({ ref: assetsRef })}>
			<div ref={host} />
		</div>
	</>;
};

export default Edit;
