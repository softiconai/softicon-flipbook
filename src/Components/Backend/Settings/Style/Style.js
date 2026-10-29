import { __ } from '@wordpress/i18n';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, ExternalLink, RangeControl, TextControl } from '@wordpress/components';
import { aligns, designs, lightboxTriggers, videos } from '../../../../utils/options';
import { toImage } from '../../../../utils/functions';
import { ColorRow, FieldHead, Panel, Reset, Tiles, ToggleRow } from '../../../../vendor/softicon-tools/components/Panels';

const Style = ({ attributes, setAttributes }) => {
	const { maxHeight, bookStyle, sideArrows, displayMode, lightboxTrigger, lightboxText, lightboxImage, lightboxWidth, lightboxAlign } = attributes;
	const hardcover = 'hardcover' === bookStyle;
	const lightbox = 'lightbox' === displayMode;
	const cover = 'cover' === lightboxTrigger;
	const set = key => val => setAttributes({ [key]: val });
	const color = key => ({ value: attributes[key], onChange: set(key) });

	// one choice sets the whole look, the arrows can still be turned off afterwards
	const setDesign = val => setAttributes({ bookStyle: val, sideArrows: 'hardcover' === val });

	return <>
		<Panel id='display' title={__('Display', 'softicon-flipbook')} badge={__('New', 'softicon-flipbook')}>
			<ToggleRow label={__('Open in a lightbox', 'softicon-flipbook')} tip={__('Off: the book shows on the page. On: only a cover, button or link shows on the page, and a click opens the book in a popup over the page; the book loads only then.', 'softicon-flipbook')}
				checked={lightbox} onChange={val => setAttributes({ displayMode: val ? 'lightbox' : 'inline' })} />

			{lightbox && <>
				<Tiles label={__('Open with', 'softicon-flipbook')} value={lightboxTrigger} options={lightboxTriggers} onChange={set('lightboxTrigger')} />

				<div>
					<FieldHead label={cover ? __('Caption', 'softicon-flipbook') : __('Text', 'softicon-flipbook')}
						tip={cover ? __('Shown under the cover. Leave it empty for no caption.', 'softicon-flipbook') : __('Leave it empty for "Read the flipbook".', 'softicon-flipbook')} />
					<TextControl label={cover ? __('Caption', 'softicon-flipbook') : __('Text', 'softicon-flipbook')} hideLabelFromVision value={lightboxText} onChange={set('lightboxText')}
						placeholder={cover ? '' : __('Read the flipbook', 'softicon-flipbook')} __next40pxDefaultSize __nextHasNoMarginBottom />
				</div>

				{cover && <div className='alfbStack'>
					<FieldHead label={__('Cover image', 'softicon-flipbook')} tip={__('Without an image the first page is the cover.', 'softicon-flipbook')} />
					{lightboxImage?.url && <img className='alfbCoverThumb' src={lightboxImage.url} alt='' />}
					<div className='alfbButtons'>
						<MediaUploadCheck>
							<MediaUpload allowedTypes={['image']} value={lightboxImage?.id} onSelect={media => setAttributes({ lightboxImage: toImage(media) })}
								render={({ open }) => <Button variant='secondary' onClick={open}>{lightboxImage?.url ? __('Replace image', 'softicon-flipbook') : __('Choose image', 'softicon-flipbook')}</Button>} />
						</MediaUploadCheck>
						{lightboxImage?.url && <Button variant='tertiary' isDestructive onClick={() => setAttributes({ lightboxImage: {} })}>{__('Remove', 'softicon-flipbook')}</Button>}
					</div>
				</div>}

				{cover && <div>
					<FieldHead label={__('Cover width (px)', 'softicon-flipbook')} tip={__('Narrow columns and phones make the cover smaller.', 'softicon-flipbook')}
						action={<Reset onClick={() => setAttributes({ lightboxWidth: 260 })} disabled={260 === lightboxWidth} />} />
					<RangeControl label={__('Cover width (px)', 'softicon-flipbook')} hideLabelFromVision value={lightboxWidth} onChange={val => setAttributes({ lightboxWidth: val || 260 })} min={120} max={600} step={10} __nextHasNoMarginBottom />
				</div>}

				<Tiles label={__('Alignment', 'softicon-flipbook')} value={lightboxAlign} options={aligns} onChange={set('lightboxAlign')} />
			</>}

			<p className='alfbHelp'><ExternalLink href={videos.lightbox}>{__('See the lightbox in action', 'softicon-flipbook')}</ExternalLink></p>
		</Panel>

		<Panel id='design' title={__('Design', 'softicon-flipbook')}>
			<Tiles label={__('Design', 'softicon-flipbook')} tip={__('Hardcover puts the pages inside a cover, with the stack of page edges, a shadow at the spine and large arrows beside the book.', 'softicon-flipbook')} value={bookStyle} options={designs} onChange={setDesign} />

			{hardcover && <ToggleRow label={__('Side arrows', 'softicon-flipbook')} tip={__('Large arrows beside the book. On phones they sit over the page edges.', 'softicon-flipbook')} checked={sideArrows} onChange={set('sideArrows')} />}

			<p className='alfbHelp'><ExternalLink href={videos.design}>{__('See the Hardcover design in action', 'softicon-flipbook')}</ExternalLink></p>
		</Panel>

		{/* in the lightbox the book fills the screen height */}
		{!lightbox && <Panel id='size' title={__('Size', 'softicon-flipbook')}>
			<div>
				<FieldHead label={__('Maximum height (px)', 'softicon-flipbook')} tip={__('The book keeps the page shape and shrinks to fit smaller screens.', 'softicon-flipbook')}
					action={<Reset onClick={() => setAttributes({ maxHeight: 700 })} disabled={700 === maxHeight} />} />
				<RangeControl label={__('Maximum height (px)', 'softicon-flipbook')} hideLabelFromVision value={maxHeight} onChange={val => setAttributes({ maxHeight: val || 700 })} min={300} max={1400} step={10} __nextHasNoMarginBottom />
			</div>
		</Panel>}

		<Panel id='colors' title={__('Colors', 'softicon-flipbook')}>
			<div className='siColors'>
				{hardcover && <ColorRow label={__('Cover', 'softicon-flipbook')} {...color('coverColor')} />}
				<ColorRow label={__('Background', 'softicon-flipbook')} {...color('bgColor')} />
				<ColorRow label={__('Toolbar background', 'softicon-flipbook')} {...color('toolbarBg')} />
				<ColorRow label={__('Toolbar icons and text', 'softicon-flipbook')} {...color('toolbarColor')} />
			</div>
		</Panel>
	</>;
};

export default Style;
