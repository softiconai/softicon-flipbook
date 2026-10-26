import './public-path';
import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import metadata from './block.json';
import './style.scss';
import './editor.scss';
import Edit from './Components/Backend/Edit';
import { blockIcon } from './utils/icons';

registerBlockType(metadata, {
	icon: blockIcon,
	edit: Edit,
	// Dynamic block, the markup comes from render.php.
	save: () => null
});

// no WordPress Dimensions (margin) panel for this block; margins saved before still apply on the page
addFilter('blockEditor.useSetting.before', 'softicon-flipbook/no-margin-panel', (value, path, clientId, blockName) => (
	metadata.name === blockName && 'spacing.margin' === path ? false : value
));
