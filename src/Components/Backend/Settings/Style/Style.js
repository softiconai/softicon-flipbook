import { __ } from '@wordpress/i18n';
import { ExternalLink, RangeControl } from '@wordpress/components';
import { designs, videos } from '../../../../utils/options';
import { ColorRow, FieldHead, Panel, Tiles, ToggleRow } from '../Panel';

const Style = ({ attributes, setAttributes }) => {
	const { maxHeight, bookStyle, sideArrows } = attributes;
	const hardcover = 'hardcover' === bookStyle;
	const color = key => ({ value: attributes[key], onChange: val => setAttributes({ [key]: val }) });

	// one choice sets the whole look, the arrows can still be turned off afterwards
	const setDesign = val => setAttributes({ bookStyle: val, sideArrows: 'hardcover' === val });

	return <>
		<Panel id='design' title={__('Design', 'softicon-flipbook')} badge={__('New', 'softicon-flipbook')}>
			<Tiles label={__('Design', 'softicon-flipbook')} tip={__('Hardcover puts the pages inside a cover, with the stack of page edges, a shadow at the spine and large arrows beside the book.', 'softicon-flipbook')} value={bookStyle} options={designs} onChange={setDesign} />

			{hardcover && <ToggleRow label={__('Side arrows', 'softicon-flipbook')} tip={__('Large arrows beside the book. On phones they sit over the page edges.', 'softicon-flipbook')} checked={sideArrows} onChange={val => setAttributes({ sideArrows: val })} />}

			<p className='alfbHelp'><ExternalLink href={videos.design}>{__('See the Hardcover design in action', 'softicon-flipbook')}</ExternalLink></p>
		</Panel>

		<Panel id='size' title={__('Size', 'softicon-flipbook')}>
			<div>
				<FieldHead label={__('Maximum height (px)', 'softicon-flipbook')} tip={__('The book keeps the page shape and shrinks to fit smaller screens.', 'softicon-flipbook')} />
				<RangeControl label={__('Maximum height (px)', 'softicon-flipbook')} hideLabelFromVision value={maxHeight} onChange={val => setAttributes({ maxHeight: val || 700 })} min={300} max={1400} step={10} __nextHasNoMarginBottom />
			</div>
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
