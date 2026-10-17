const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const CopyPlugin = require('copy-webpack-plugin');

// drop the RTL stylesheet copies wp-scripts emits
const plugins = defaultConfig.plugins.filter(p => !(Object.values(p).length === 2 && Object.values(p)?.[1]?.filename === '[name]-rtl.css'));

const pdfjs = 'node_modules/pdfjs-dist/';

// binary CMaps and fonts become base64 JSON, read back by JsonDataFactory in Flipbook.js
const asJson = (folder, to) => ({
	from: pdfjs + folder,
	to: `pdfjs/${to}/[name][ext].json`,
	globOptions: { ignore: ['**/LICENSE*'] },
	transform: content => JSON.stringify(content.toString('base64'))
});

// license files get a .txt extension
const licenses = (folder, to, names) => names.map(name => ({
	from: `${pdfjs}${folder}/${name}`,
	to: `pdfjs/${to}/${name}.txt`
}));

module.exports = {
	...defaultConfig,
	plugins: [
		...plugins,
		new CopyPlugin({
			patterns: [
				// .js not .mjs, many servers send .mjs with a MIME type workers refuse
				{ from: pdfjs + 'legacy/build/pdf.worker.min.mjs', to: 'pdfjs/pdf.worker.min.js' },
				asJson('cmaps', 'cmaps'),
				...licenses('cmaps', 'cmaps', ['LICENSE']),
				asJson('standard_fonts', 'standard_fonts'),
				...licenses('standard_fonts', 'standard_fonts', ['LICENSE_FOXIT', 'LICENSE_LIBERATION']),
				// JavaScript JPEG 2000 / JBIG2 decoders (the WebAssembly builds are not shipped)
				{ from: pdfjs + 'wasm/*_nowasm_fallback.js', to: 'pdfjs/decoders/[name][ext]' },
				...licenses('wasm', 'decoders', ['LICENSE_OPENJPEG', 'LICENSE_PDFJS_OPENJPEG', 'LICENSE_JBIG2', 'LICENSE_PDFJS_JBIG2']),
				{ from: pdfjs + 'LICENSE', to: 'pdfjs/LICENSE.txt' },
				{ from: 'node_modules/page-flip/LICENSE', to: 'page-flip-LICENSE.txt' }
			]
		})
	]
};
