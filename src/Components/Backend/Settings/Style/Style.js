import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, ExternalLink, RangeControl, TextControl } from '@wordpress/components';
import { aligns, designs, lightboxBackdrops, lightboxSizes, lightboxTriggers, videos, whatsNewAt } from '../../../../utils/options';
import { anchorOf, toImage } from '../../../../utils/functions';
import ProNotice from '../../ProNotice';
import { ColorRow, FieldHead, Panel, Reset, Tiles, ToggleRow } from '../../../../vendor/softicon-tools/components/Panels';

const editorInfo = window.alfbEditor || {};

const Style = ({ attributes, setAttributes }) => {
	const { bookTitle, theme, maxHeight, maxHeightTablet, maxHeightPhone, bookStyle, sideArrows, displayMode, lightboxTrigger, lightboxText, lightboxImage, lightboxWidth, lightboxAlign, lightboxSize, lightboxBackdrop, lightboxNofollow, lightboxAnchor, lightboxFullscreen, fitWidth } = attributes;
	const hardcover = 'hardcover' === bookStyle;
	const lightbox = 'lightbox' === displayMode;
	const cover = 'cover' === lightboxTrigger;
	const anchor = 'anchor' === lightboxTrigger;
	// "Any link" gets a link name of its own at once, so the block never stands without one
	const setTrigger = val => setAttributes({ lightboxTrigger: val, ...('anchor' === val && !anchorOf(lightboxAnchor) ? { lightboxAnchor: 'flipbook-' + Math.random().toString(36).slice(2, 6) } : {}) });
	const set = key => val => setAttributes({ [key]: val });
	const color = key => ({ value: attributes[key], onChange: set(key) });
	// SoftIcon Flipbook Pro: under a setting, whether it follows the site default or is this book's own; Reset goes
	// back to the site default and is off while the book follows it
	const hint = name => applyFilters('alfb.block.hint', null, { name, setAttributes });
	const resetTo = (name, value) => applyFilters('alfb.block.reset', value, name);
	const atDefault = (name, same) => applyFilters('alfb.block.atDefault', same, name);

	// one choice sets the whole look, the arrows can still be turned off afterwards
	const setDesign = val => setAttributes({ bookStyle: val, sideArrows: 'hardcover' === val });

	return <>
		<Panel id='display' title={__('Display', 'softicon-flipbook')} badge={__('New', 'softicon-flipbook')}>
			<ToggleRow label={__('Open in a lightbox', 'softicon-flipbook')} tip={__('Off: the book shows on the page. On: only a cover, button or link shows on the page, and a click opens the book in a popup over the page; the book loads only then.', 'softicon-flipbook')}
				checked={lightbox} onChange={val => setAttributes({ displayMode: val ? 'lightbox' : 'inline' })} />{hint('displayMode')}

			{!lightbox && <div>
				<FieldHead label={__('Title above the book', 'softicon-flipbook')} tip={__('Shown above the book, also in full screen. Leave it empty for no title.', 'softicon-flipbook')} />
				<TextControl label={__('Title above the book', 'softicon-flipbook')} hideLabelFromVision value={bookTitle} onChange={set('bookTitle')} __next40pxDefaultSize __nextHasNoMarginBottom />
			</div>}

			{lightbox && <>
				<Tiles label={__('Open with', 'softicon-flipbook')} tip={__('Any link: nothing shows where the block is; any link to the name below opens the book, such as a menu item, a theme button or a link in your text.', 'softicon-flipbook')} value={lightboxTrigger} options={lightboxTriggers} onChange={setTrigger} />{hint('lightboxTrigger')}

				{anchor && <div className='alfbStack'>
					<FieldHead label={__('Link name', 'softicon-flipbook')} tip={__('Letters, numbers and dashes. Use it as the link: #name on this page, or the page address followed by #name from anywhere else.', 'softicon-flipbook')} />
					<TextControl label={__('Link name', 'softicon-flipbook')} hideLabelFromVision value={lightboxAnchor} onChange={val => setAttributes({ lightboxAnchor: val.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 40) })} __next40pxDefaultSize __nextHasNoMarginBottom />
					{anchorOf(lightboxAnchor) && <p className='alfbHelp'>{__('Link to:', 'softicon-flipbook')} <code>#{anchorOf(lightboxAnchor)}</code> <Button variant='link' onClick={() => window.navigator.clipboard?.writeText('#' + anchorOf(lightboxAnchor))}>{__('Copy', 'softicon-flipbook')}</Button></p>}
				</div>}

				{!anchor && <div>
					<FieldHead label={cover ? __('Caption', 'softicon-flipbook') : __('Text', 'softicon-flipbook')}
						tip={cover ? __('Shown under the cover. Leave it empty for no caption.', 'softicon-flipbook') : __('Leave it empty for "Read the flipbook".', 'softicon-flipbook')} />
					<TextControl label={cover ? __('Caption', 'softicon-flipbook') : __('Text', 'softicon-flipbook')} hideLabelFromVision value={lightboxText} onChange={set('lightboxText')}
						placeholder={cover ? '' : __('Read the flipbook', 'softicon-flipbook')} __next40pxDefaultSize __nextHasNoMarginBottom />
				</div>}

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
						action={<Reset onClick={() => setAttributes({ lightboxWidth: resetTo('lightboxWidth', 260) })} disabled={atDefault('lightboxWidth', 260 === lightboxWidth)} />} />
					<RangeControl label={__('Cover width (px)', 'softicon-flipbook')} hideLabelFromVision value={lightboxWidth} onChange={val => setAttributes({ lightboxWidth: val || 260 })} min={120} max={600} step={10} __nextHasNoMarginBottom />{hint('lightboxWidth')}
				</div>}

				{!anchor && <><Tiles label={__('Alignment', 'softicon-flipbook')} value={lightboxAlign} options={aligns} onChange={set('lightboxAlign')} />{hint('lightboxAlign')}</>}

				<Tiles label={__('Popup size', 'softicon-flipbook')} tip={__('How much of the window height the book takes in the popup.', 'softicon-flipbook')} value={lightboxSize} options={lightboxSizes} onChange={set('lightboxSize')} />{hint('lightboxSize')}

				<Tiles label={__('Behind the book', 'softicon-flipbook')} tip={__('What readers see around the book while it is open: a dark or light screen, or the page itself, blurred.', 'softicon-flipbook')} value={lightboxBackdrop} options={lightboxBackdrops} onChange={set('lightboxBackdrop')} />{hint('lightboxBackdrop')}

				<ToggleRow label={__('Open in full screen', 'softicon-flipbook')} tip={__('The book opens full screen at once; leaving full screen closes it. iPhones have no full screen for web pages, there the popup fills the window.', 'softicon-flipbook')} checked={lightboxFullscreen} onChange={set('lightboxFullscreen')} />
				{/* SoftIcon Flipbook Pro: open in a new tab */}
				{applyFilters('alfb.block.lightbox', null, { attributes, setAttributes })}
				{!editorInfo.pro && !anchor && <ProNotice href={editorInfo.pricing} text={__('Opening the book in a new tab, on a page of its own, is available in Pro.', 'softicon-flipbook')} />}

				{!anchor && <ToggleRow label={__('Ask search engines not to follow', 'softicon-flipbook')} tip={__('Adds rel="nofollow" to the cover, button or link, which points to the PDF.', 'softicon-flipbook')} checked={lightboxNofollow} onChange={set('lightboxNofollow')} />}
			</>}

			<p className='alfbHelp'><ExternalLink href={videos.lightbox}>{__('See the lightbox in action', 'softicon-flipbook')}</ExternalLink></p>
			<p className='alfbHelp'><ExternalLink href={whatsNewAt(76)}>{__('Watch: popup size and background', 'softicon-flipbook')}</ExternalLink></p>
		</Panel>

		<Panel id='design' title={__('Design', 'softicon-flipbook')}>
			<Tiles label={__('Design', 'softicon-flipbook')} tip={__('Hardcover puts the pages inside a cover, with the stack of page edges, a shadow at the spine and large arrows beside the book.', 'softicon-flipbook')} value={bookStyle} options={designs} onChange={setDesign} />{hint('bookStyle')}

			{hardcover && <><ToggleRow label={__('Side arrows', 'softicon-flipbook')} tip={__('Large arrows beside the book. On phones they sit over the page edges.', 'softicon-flipbook')} checked={sideArrows} onChange={set('sideArrows')} />{hint('sideArrows')}</>}

			<p className='alfbHelp'><ExternalLink href={videos.design}>{__('See the Hardcover design in action', 'softicon-flipbook')}</ExternalLink></p>
		</Panel>

		{/* in the lightbox the book fills the screen height */}
		{!lightbox && <Panel id='size' title={__('Size', 'softicon-flipbook')}>
			<ToggleRow label={__('Fit the width', 'softicon-flipbook')} tip={__('The book is as wide as the column and as tall as its pages need, with no height limit. Good for landscape brochures and small text.', 'softicon-flipbook')} checked={fitWidth} onChange={set('fitWidth')} />
			{!fitWidth && <><div>
				<FieldHead label={__('Maximum height (px)', 'softicon-flipbook')} tip={__('The book keeps the page shape and shrinks to fit smaller screens.', 'softicon-flipbook')}
					action={<Reset onClick={() => setAttributes({ maxHeight: resetTo('maxHeight', 700) })} disabled={atDefault('maxHeight', 700 === maxHeight)} />} />
				<RangeControl label={__('Maximum height (px)', 'softicon-flipbook')} hideLabelFromVision value={maxHeight} onChange={val => setAttributes({ maxHeight: val || 700 })} min={300} max={1400} step={10} __nextHasNoMarginBottom />{hint('maxHeight')}
			</div>
			<div className='alfbDeviceHeights'>
				<FieldHead label={__('On tablets and phones', 'softicon-flipbook')} tip={__('A different maximum height on tablets (under 1025 px wide) and phones (under 600 px). Leave a field empty to keep the height above. The editor\'s Tablet and Mobile previews show them.', 'softicon-flipbook')} />
				<TextControl type='number' min={200} max={2000} label={__('Tablet (px)', 'softicon-flipbook')} value={maxHeightTablet || ''} placeholder={String(maxHeight)}
					onChange={val => setAttributes({ maxHeightTablet: parseInt(val, 10) > 0 ? parseInt(val, 10) : 0 })} __next40pxDefaultSize __nextHasNoMarginBottom />
				<TextControl type='number' min={200} max={2000} label={__('Phone (px)', 'softicon-flipbook')} value={maxHeightPhone || ''} placeholder={String(maxHeight)}
					onChange={val => setAttributes({ maxHeightPhone: parseInt(val, 10) > 0 ? parseInt(val, 10) : 0 })} __next40pxDefaultSize __nextHasNoMarginBottom />
				{hint('maxHeightTablet')}{hint('maxHeightPhone')}
			</div></>}
		</Panel>}

		<Panel id='colors' title={__('Colors', 'softicon-flipbook')}>
			<Tiles label={__('Theme', 'softicon-flipbook')} tip={__('Dark puts the book on a dark background with light controls. Auto follows the reader\'s device. A color you set below still wins.', 'softicon-flipbook')}
				value={theme || 'light'} onChange={set('theme')} options={[
					{ label: __('Light', 'softicon-flipbook'), value: 'light' },
					{ label: __('Dark', 'softicon-flipbook'), value: 'dark' },
					{ label: __('Auto', 'softicon-flipbook'), value: 'auto' }
				]} />{hint('theme')}
			<div className='siColors'>
				{hardcover && <><ColorRow label={__('Cover', 'softicon-flipbook')} {...color('coverColor')} />{hint('coverColor')}</>}
				<ColorRow label={__('Background', 'softicon-flipbook')} {...color('bgColor')} />{hint('bgColor')}
				<ColorRow label={__('Toolbar background', 'softicon-flipbook')} {...color('toolbarBg')} />{hint('toolbarBg')}
				<ColorRow label={__('Toolbar icons and text', 'softicon-flipbook')} {...color('toolbarColor')} />{hint('toolbarColor')}
			</div>
			{!editorInfo.pro && <ProNotice href={editorInfo.defaults || editorInfo.pricing} text={__('Setting the colors, size and toolbar once for every flipbook on the site, and presets that give one book\'s look to others, are available in Pro.', 'softicon-flipbook')} />}
		</Panel>

		{/* the Pro settings of this tab, shown as notices only: the code is in Pro, which replaces these panels */}
		{!editorInfo.pro && <Panel id='toolbarstyle' title={__('Toolbar style', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
			<ProNotice href={editorInfo.pricing} text={__('The toolbar above the book, floating over it so the book gets more room, or no toolbar at all, is available in Pro.', 'softicon-flipbook')} />
		</Panel>}
		{!editorInfo.pro && <Panel id='branding' title={__('Branding', 'softicon-flipbook')} badge={__('Pro', 'softicon-flipbook')}>
			<ProNotice href={editorInfo.pricing} text={__('Your logo in the toolbar, linked to your site, and your own picture behind the book are available in Pro.', 'softicon-flipbook')}
				video={videos.branding} videoLabel={__('Watch branding in 40 seconds', 'softicon-flipbook')} />
		</Panel>}
	</>;
};

export default Style;
