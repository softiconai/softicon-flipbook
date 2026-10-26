import { __ } from '@wordpress/i18n';
import { ColorPalette, PanelColorSettings } from '@wordpress/block-editor';
import { BaseControl, ExternalLink, PanelBody, RangeControl, SelectControl, ToggleControl } from '@wordpress/components';
import { designs, videos } from '../../../../utils/options';

const Style = ({ attributes, setAttributes }) => {
	const { maxHeight, bookStyle, sideArrows, bgColor, toolbarBg, toolbarColor, coverColor } = attributes;
	const hardcover = 'hardcover' === bookStyle;

	// one choice sets the whole look, the arrows can still be turned off afterwards
	const setDesign = val => setAttributes({ bookStyle: val, sideArrows: 'hardcover' === val });

	return <>
		<PanelBody title={__('Design', 'softicon-flipbook')} initialOpen={true}>
			<SelectControl label={__('Design', 'softicon-flipbook')} hideLabelFromVision value={bookStyle} options={designs} onChange={setDesign} help={hardcover ? __('A hard cover around the pages, the stack of page edges, a shadow at the spine and large arrows beside the book.', 'softicon-flipbook') : __('Plain pages that turn like a magazine.', 'softicon-flipbook')} __nextHasNoMarginBottom />

			<p className='alfbHelp'><ExternalLink href={videos.design}>{__('See the Hardcover design in action', 'softicon-flipbook')}</ExternalLink></p>

			{hardcover && <>
				<ToggleControl className='alfbMt' label={__('Side arrows', 'softicon-flipbook')} help={__('On phones they sit over the page edges.', 'softicon-flipbook')} checked={sideArrows} onChange={val => setAttributes({ sideArrows: val })} __nextHasNoMarginBottom />

				<BaseControl id='alfb-cover-color' className='alfbMt' label={__('Cover color', 'softicon-flipbook')} __nextHasNoMarginBottom>
					<ColorPalette value={coverColor} onChange={val => setAttributes({ coverColor: val || '' })} />
				</BaseControl>
			</>}
		</PanelBody>

		<PanelBody title={__('Size', 'softicon-flipbook')} initialOpen={false}>
			<RangeControl label={__('Maximum height (px)', 'softicon-flipbook')} help={__('The book keeps the page shape and shrinks to fit smaller screens.', 'softicon-flipbook')} value={maxHeight} onChange={val => setAttributes({ maxHeight: val || 700 })} min={300} max={1400} step={10} __nextHasNoMarginBottom />
		</PanelBody>

		<PanelColorSettings title={__('Colors', 'softicon-flipbook')} initialOpen={false} colorSettings={[
			{ value: bgColor, onChange: val => setAttributes({ bgColor: val || '' }), label: __('Background', 'softicon-flipbook') },
			{ value: toolbarBg, onChange: val => setAttributes({ toolbarBg: val || '' }), label: __('Toolbar background', 'softicon-flipbook') },
			{ value: toolbarColor, onChange: val => setAttributes({ toolbarColor: val || '' }), label: __('Toolbar icons and text', 'softicon-flipbook') }
		]} />
	</>;
};

export default Style;
