import { __, sprintf } from '@wordpress/i18n';
import { createContext, useContext, useState } from '@wordpress/element';
import { ColorPalette } from '@wordpress/block-editor';
import { Button, ColorIndicator, Dropdown, PanelBody } from '@wordpress/components';

// one open panel per settings tab: opening a panel closes the one that was open
const Accordion = createContext({ open: null, toggle: () => {} });

export const PanelGroup = ({ initial, children }) => {
	const [open, setOpen] = useState(initial);
	const toggle = id => setOpen(current => (current === id ? null : id));
	return <Accordion.Provider value={{ open, toggle }}>{children}</Accordion.Provider>;
};

// a settings panel; its controls are spaced evenly by .alfbFields
export const Panel = ({ id, title, children }) => {
	const { open, toggle } = useContext(Accordion);
	return <PanelBody className='alfbPanel' title={title} opened={open === id} onToggle={() => toggle(id)}>
		<div className='alfbFields'>{children}</div>
	</PanelBody>;
};

// label, the current color as a dot, and the palette in a popover
export const ColorRow = ({ label, value, onChange }) => <Dropdown
	className='alfbColorRow'
	popoverProps={{ placement: 'left-start', offset: 36 }}
	renderToggle={({ isOpen, onToggle }) => <Button className='alfbColorToggle' onClick={onToggle} aria-expanded={isOpen}
		/* translators: %s: a color setting, like Background */
		aria-label={sprintf(__('%s color', 'softicon-flipbook'), label)}>
		<ColorIndicator colorValue={value || undefined} className={value ? '' : 'is-empty'} />
		<span>{label}</span>
		{value && <code>{value}</code>}
	</Button>}
	renderContent={() => <div className='alfbColorPopover'>
		<ColorPalette value={value} onChange={val => onChange(val || '')} clearable />
	</div>}
/>;
