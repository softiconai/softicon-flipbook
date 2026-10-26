import { __ } from '@wordpress/i18n';
import { ExternalLink, RangeControl, SelectControl, ToggleControl } from '@wordpress/components';
import { designs, videos } from '../../../../utils/options';
import { ColorRow, Panel } from '../Panel';

const Style = ({ attributes, setAttributes }) => {
	const { maxHeight, bookStyle, sideArrows } = attributes;
	const hardcover = 'hardcover' === bookStyle;
	const color = key => ({ value: attributes[key], onChange: val => setAttributes({ [key]: val }) });

	// one choice sets the whole look, the arrows can still be turned off afterwards
	const setDesign = val => setAttributes({ bookStyle: val, sideArrows: 'hardcover' === val });

	return <>
		<Panel id='design' title={__('Design', 'softicon-flipbook')}>
			<SelectControl label={__('Design', 'softicon-flipbook')} hideLabelFromVision value={bookStyle} options={designs} onChange={setDesign} help={hardcover ? __('A hard cover around the pages, the stack of page edges, a shadow at the spine and large arrows beside the book.', 'softicon-flipbook') : __('Plain pages that turn like a magazine.', 'softicon-flipbook')} __nextHasNoMarginBottom />

			{hardcover && <ToggleControl label={__('Side arrows', 'softicon-flipbook')} help={__('On phones they sit over the page edges.', 'softicon-flipbook')} checked={sideArrows} onChange={val => setAttributes({ sideArrows: val })} __nextHasNoMarginBottom />}

			<p className='alfbHelp'><ExternalLink href={videos.design}>{__('See the Hardcover design in action', 'softicon-flipbook')}</ExternalLink></p>
		</Panel>

		<Panel id='size' title={__('Size', 'softicon-flipbook')}>
			<RangeControl label={__('Maximum height (px)', 'softicon-flipbook')} help={__('The book keeps the page shape and shrinks to fit smaller screens.', 'softicon-flipbook')} value={maxHeight} onChange={val => setAttributes({ maxHeight: val || 700 })} min={300} max={1400} step={10} __nextHasNoMarginBottom />
		</Panel>

		<Panel id='colors' title={__('Colors', 'softicon-flipbook')}>
			<div className='alfbColors'>
				{hardcover && <ColorRow label={__('Cover', 'softicon-flipbook')} {...color('coverColor')} />}
				<ColorRow label={__('Background', 'softicon-flipbook')} {...color('bgColor')} />
				<ColorRow label={__('Toolbar background', 'softicon-flipbook')} {...color('toolbarBg')} />
				<ColorRow label={__('Toolbar icons and text', 'softicon-flipbook')} {...color('toolbarColor')} />
			</div>
		</Panel>
	</>;
};

export default Style;
