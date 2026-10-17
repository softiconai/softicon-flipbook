import { InspectorControls } from '@wordpress/block-editor';
import { TabPanel } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import General from './General/General';
import Style from './Style/Style';
import { tabs } from '../../../utils/options';

const Settings = ({ attributes, setAttributes, onSelectPdf, onSelectImages }) => {
	return <InspectorControls>
		<TabPanel className='alfbTabs' tabs={tabs}>
			{(tab) => <>
				{'general' === tab.name && <General {...{ attributes, setAttributes, onSelectPdf, onSelectImages }} />}

				{'style' === tab.name && <Style {...{ attributes, setAttributes }} />}

				{/* Add-ons append their own panels to either tab. */}
				{applyFilters('alfb.block.inspector', null, { tab: tab.name, attributes, setAttributes })}
			</>}
		</TabPanel>
	</InspectorControls>;
};

export default Settings;
