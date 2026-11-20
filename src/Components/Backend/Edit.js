import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { BlockControls, MediaPlaceholder, MediaReplaceFlow, MediaUpload, MediaUploadCheck, useBlockProps } from '@wordpress/block-editor';
import { Button, ExternalLink, ToolbarButton } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
// copied from the shared softicon-tools folder by `npm run tools` (prebuild), edit it there
import useIframeAssets from '../../vendor/softicon-tools/hooks/useIframeAssets';
import Settings from './Settings/Settings';
import LightboxPreview from './LightboxPreview';
import Flipbook from '../../viewer/Flipbook';
import { blockIcon, icons } from '../../utils/icons';
import { cssVars, hasContent, toConfig, toImage } from '../../utils/functions';
import { videos } from '../../utils/options';
import guide from '../../utils/guide';

// waits for the user to stop dragging a slider before the preview reloads the PDF
const useDebounced = (value, delay) => {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
};

// the steps for the way picked on the Welcome tab (utils/guide.js), under the PDF picker
const Steps = ({ images }) => <ol className='alfbGuide'>
	<li>{images ? __('Pick the page images, in reading order.', 'softicon-flipbook') : __('Pick your PDF: upload it, choose it from the Media Library or paste its link.', 'softicon-flipbook')}</li>
	{'shortcode' === guide ? <>
		<li>{__('Give the flipbook a title, change its look in the sidebar if you like, then click Publish.', 'softicon-flipbook')}</li>
		<li>{__('Copy its shortcode from the sidebar\'s Block tab and paste it in your page: the Classic Editor, an Elementor Shortcode widget or any page builder.', 'softicon-flipbook')}</li>
	</> : <>
		<li>{__('Change its look in the sidebar on the right: Classic or Hardcover, on the page or in a popup.', 'softicon-flipbook')}</li>
		<li>{__('Click Publish: the flipbook shows on the page.', 'softicon-flipbook')}</li>
	</>}
</ol>;

// once the PDF is picked, the next step stays in view at the top of the editor
let guided = false;

const Edit = (props) => {
	const { attributes, setAttributes } = props;
	const { source, pdfId, pdfUrl, images, displayMode } = attributes;
	const lightbox = 'lightbox' === displayMode;
	const host = useRef();
	const root = useRef();
	// a block installed from the inserter's search gets these only in the top window
	const assetsRef = useIframeAssets(['softicon-flipbook-style-css', 'softicon-flipbook-editor-style-css']);

	const onSelectPdf = media => setAttributes({ pdfId: media.id || 0, pdfUrl: media.url || media.source_url || '' });
	const onSelectPdfUrl = url => setAttributes({ pdfId: 0, pdfUrl: url });
	const onSelectImages = items => setAttributes({ images: items.map(toImage) });

	const ready = hasContent(attributes);
	useEffect(() => {
		if (!guide || !ready || guided) {
			return;
		}
		guided = true;
		dispatch('core/notices').createInfoNotice('shortcode' === guide ?
			__('Your flipbook is ready. Give it a title and click Publish, then copy its shortcode from the sidebar\'s Block tab.', 'softicon-flipbook') :
			__('Your flipbook is ready. Change its look in the sidebar on the right, then click Publish.', 'softicon-flipbook'), { id: 'alfb-guide' });
	}, [ready]);

	// the preview has the page's toolbar; only what the editor leaves out (Flipbook.js, editor mode) does not reload it
	const preview = toConfig(attributes);
	['showLinks', 'phoneFullscreen'].forEach(key => delete preview[key]);
	const configKey = useDebounced(JSON.stringify(preview), 400);

	useEffect(() => {
		const el = host.current;
		const config = JSON.parse(configKey);
		// the debounced config can still be the empty one right after a file is picked
		if (!ready || lightbox || !el || !('images' === config.source ? config.images.length : config.pdf)) {
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
	}, [configKey, ready, lightbox]);

	// colors change live, no need to reload the book
	const applyColors = () => {
		if (!root.current) {
			return;
		}
		Object.entries(cssVars(attributes)).forEach(([name, value]) => value ? root.current.style.setProperty(name, value) : root.current.style.removeProperty(name));
	};
	useEffect(applyColors, [attributes.bgColor, attributes.toolbarBg, attributes.toolbarColor, attributes.coverColor]);

	const switchSource = value => <>
		{guide && <Steps images={'pdf' === value} />}
		{/* the last row: the tutorial, and the other kind of book */}
		<div className='alfbPlaceholderFoot'>
			<ExternalLink href={videos.add} className='alfbPlaceholderVideo'>
				<span className='alfbPlaceholderPlay'>{icons.play}</span>
				{__('New here? Watch the 36-second tutorial', 'softicon-flipbook')}
			</ExternalLink>
			<Button variant='link' className='alfbPlaceholderSwitch' icon={icons[value]} onClick={() => setAttributes({ source: value })}>
				{'images' === value ? __('Use images instead', 'softicon-flipbook') : __('Use a PDF instead', 'softicon-flipbook')}
			</Button>
		</div>
	</>;

	if (!ready) {
		return <div {...useBlockProps({ ref: assetsRef })}>
			{'images' === source ?
				<MediaPlaceholder className='alfbPlaceholder' icon={blockIcon} labels={{ title: __('Flipbook', 'softicon-flipbook'), instructions: __('Upload or pick the page images, in reading order.', 'softicon-flipbook') }}
					allowedTypes={['image']} multiple gallery onSelect={onSelectImages}>
					{switchSource('pdf')}
				</MediaPlaceholder> :
				<MediaPlaceholder className='alfbPlaceholder' icon={blockIcon} labels={{ title: __('Flipbook', 'softicon-flipbook'), instructions: __('Upload a PDF, pick one from the Media Library or paste a link.', 'softicon-flipbook') }}
					allowedTypes={['application/pdf']} accept='application/pdf' onSelect={onSelectPdf} onSelectURL={onSelectPdfUrl}>
					{switchSource('images')}
				</MediaPlaceholder>}
		</div>;
	}

	return <>
		<Settings {...{ attributes, setAttributes, onSelectPdf, onSelectPdfUrl, onSelectImages }} />

		<BlockControls group='other'>
			{'images' === source ?
				<MediaUploadCheck>
					<MediaUpload allowedTypes={['image']} multiple gallery value={images.map(image => image.id)} onSelect={onSelectImages}
						render={({ open }) => <ToolbarButton onClick={open}>{__('Edit pages', 'softicon-flipbook')}</ToolbarButton>} />
				</MediaUploadCheck> :
				<MediaReplaceFlow mediaId={pdfId} mediaURL={pdfUrl} allowedTypes={['application/pdf']} accept='application/pdf' onSelect={onSelectPdf} onSelectURL={onSelectPdfUrl} name={__('Replace PDF', 'softicon-flipbook')} />}
		</BlockControls>

		<div {...useBlockProps({ ref: assetsRef })}>
			{/* an add-on can show the block its own way (SoftIcon Flipbook Pro's shelf) */}
			{applyFilters('alfb.block.preview', null, { attributes }) || (lightbox ? <LightboxPreview attributes={attributes} /> : <div ref={host} />)}
		</div>
	</>;
};

export default Edit;
