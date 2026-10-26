import { __, sprintf } from '@wordpress/i18n';
import { createContext, useContext, useState } from '@wordpress/element';
import { ColorPalette } from '@wordpress/block-editor';
import { Button, ColorIndicator, Dropdown, PanelBody, ToggleControl, Tooltip } from '@wordpress/components';
import { icons } from '../../../utils/icons';

// one open panel per settings tab: opening a panel closes the one that was open
const Accordion = createContext({ open: null, toggle: () => {} });

export const PanelGroup = ({ initial, children }) => {
	const [open, setOpen] = useState(initial);
	const toggle = id => setOpen(current => (current === id ? null : id));
	return <Accordion.Provider value={{ open, toggle }}>{children}</Accordion.Provider>;
};

// a settings panel; its controls are spaced evenly by .alfbFields, badge is a short tag like "New"
export const Panel = ({ id, title, badge, children }) => {
	const { open, toggle } = useContext(Accordion);
	return <PanelBody className='alfbPanel' title={<>{title}{badge && <span className='alfbBadge'>{badge}</span>}</>} opened={open === id} onToggle={() => toggle(id)}>
		<div className='alfbFields'>{children}</div>
	</PanelBody>;
};

// the help text behind an (i), shown on hover and keyboard focus; screen readers get it as the button name
export const Tip = ({ text }) => <Tooltip text={text} placement='top' className='alfbTipBubble'>
	<button type='button' className='alfbTip' aria-label={text}>{icons.info}</button>
</Tooltip>;

// a field's name with its tip; the control below hides its own label from sight only
export const FieldHead = ({ label, tip }) => <div className='alfbFieldHead'>
	<span className='alfbFieldLabel'>{label}</span>
	{tip && <Tip text={tip} />}
</div>;

export const ToggleRow = ({ label, tip, checked, onChange }) => <div className='alfbToggleRow'>
	<ToggleControl label={label} checked={checked} onChange={onChange} __nextHasNoMarginBottom />
	{tip && <Tip text={tip} />}
</div>;

// choices as icon tiles; options: [{ value, label, icon }]
export const Tiles = ({ label, tip, value, options, onChange }) => <div className='alfbTiles'>
	<FieldHead label={label} tip={tip} />
	<div className='alfbTilesGrid' role='radiogroup' aria-label={label} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
		{options.map(option => <button key={option.value} type='button' role='radio' aria-checked={value === option.value}
			className={'alfbTile' + (value === option.value ? ' is-selected' : '')} onClick={() => onChange(option.value)}>
			{option.icon}
			<span>{option.label}</span>
		</button>)}
	</div>
</div>;

// label, the current color as a dot, and the palette in a popover
export const ColorRow = ({ label, value, onChange }) => <Dropdown
	className='alfbColorRow'
	popoverProps={{ placement: 'left-start', offset: 36 }}
	renderToggle={({ isOpen, onToggle }) => <Button className='alfbColorToggle' onClick={onToggle} aria-expanded={isOpen}
		/* translators: %s: a color setting, like Background */
		aria-label={sprintf(__('%s color', 'softicon-flipbook'), label)}>
		<ColorIndicator colorValue={value || undefined} className={value ? '' : 'is-empty'} />
		<span className='alfbColorName'>{label}</span>
		{value && <code>{value}</code>}
	</Button>}
	renderContent={() => <div className='alfbColorPopover'>
		<ColorPalette value={value} onChange={val => onChange(val || '')} clearable />
	</div>}
/>;

// links as cards: [{ href, label, icon }]
export const HelpCards = ({ cards }) => <div className='alfbHelpCards'>
	{cards.map(card => <a key={card.href} className='alfbHelpCard' href={card.href} target='_blank' rel='noopener noreferrer'>
		{card.icon}
		<span>{card.label}</span>
		<span className='screen-reader-text'>{__('(opens in a new tab)', 'softicon-flipbook')}</span>
	</a>)}
</div>;
