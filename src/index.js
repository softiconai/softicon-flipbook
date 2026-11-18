import './public-path';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { dispatch, select, subscribe } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
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

// the dashboard opens a new page with ?alfb_start=…: once the editor is ready the page gets a flipbook, selected.
// 1 ("Start from a sample book"): one of the demo PDF, only needing the person's own; block (the Welcome tab's "Block"):
// an empty one, which asks for the PDF; shortcode: a flipbook under All Flipbooks, whose block is already there
domReady(() => {
	const url = new URL(window.location.href);
	const mode = url.searchParams.get('alfb_start');
	const pdfUrl = window.alfbEditor?.demoPdf;
	if (null === mode) {
		return;
	}
	url.searchParams.delete('alfb_start');
	window.history.replaceState(window.history.state, '', url.toString());
	if ('shortcode' === mode || ('block' !== mode && !pdfUrl)) {
		return;
	}
	// the editor is often ready before this runs, and then nothing in the stores changes: check now, else wait
	let done = false;
	const start = () => {
		const editor = select('core/editor');
		const ready = editor?.__unstableIsEditorReady ? editor.__unstableIsEditorReady() : !!editor?.getCurrentPostId();
		if (done || !ready) {
			return;
		}
		done = true;
		// the editor can still reset the new page's blocks right after it is ready: add the book a moment later,
		// and again if it is gone, a few times
		let tries = 0;
		const add = () => {
			const blocks = select('core/block-editor').getBlocks();
			if (blocks.some(block => metadata.name === block.name) || ++tries > 6) {
				return;
			}
			dispatch('core/block-editor').insertBlocks(createBlock(metadata.name, 'block' === mode ? {} : { pdfUrl }), blocks.length);
			setTimeout(add, 700);
		};
		setTimeout(add, 400);
	};
	const unsubscribe = subscribe(() => {
		start();
		if (done) {
			unsubscribe();
		}
	});
	start();
	if (done) {
		unsubscribe();
	}
});
