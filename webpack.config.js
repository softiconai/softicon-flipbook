const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const path = require('path');

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

// Changes to pdf.js's worker. The readable build is patched (Terser minifies it with the rest), every change must
// match exactly once, so a pdf.js update that moves the code stops the build instead of dropping a fix.
const patch = (code, what, from, to) => {
	if (1 !== code.split(from).length - 1) {
		throw new Error(`pdf.worker: ${what} not found, check patchWorker in webpack.config.js`);
	}
	return code.replace(from, () => to);
};
const patchWorker = content => {
	let code = content.toString();

	// pdf.js reads a JPEG 2000 image's size from the first FF 51 bytes, which can sit inside the image's ICC profile
	// (InDesign CMYK images): the wrong size makes the image fail and the page shows blank. Read it after FF 4F only.
	code = patch(code, 'JPEG 2000 size marker', `      const code = oldByte << 8 | newByte;
      if (code === 0xff51) {`, `      const code = oldByte << 8 | newByte;
      const soc = alfbPrev2;
      alfbPrev2 = alfbPrev1;
      alfbPrev1 = code;
      if (code === 0xff51 && soc === 0xff4f) {`);
	code = patch(code, 'JPEG 2000 size loop', `    let newByte = stream.getByte();
    while (newByte >= 0) {
      const oldByte = newByte;`, `    let newByte = stream.getByte();
    let alfbPrev1 = -1, alfbPrev2 = -1;
    while (newByte >= 0) {
      const oldByte = newByte;`);

	// colour profiles without WebAssembly: src/pdfjs/icc.js converts ICCBased colours when qcms is not in use
	code = patch(code, 'ICC colour space class', 'class CmykICCBasedCS extends IccColorSpace {', `${fs.readFileSync(path.join(__dirname, 'src/pdfjs/icc.js'), 'utf8')}
class AlfbIccColorSpace extends ColorSpace {
  constructor(transform, numComps) {
    super("ICCBased", numComps);
    this.alfb = transform;
  }
  getRgbItem(src, srcOffset, dest, destOffset) {
    this.alfb.item(src, srcOffset, 1, dest, destOffset);
  }
  getRgbBuffer(src, srcOffset, count, dest, destOffset, bits, alpha01) {
    this.alfb.buffer(src, srcOffset, count, dest, destOffset, bits, alpha01);
  }
}
class CmykICCBasedCS extends IccColorSpace {`);
	code = patch(code, 'ICCBased parsing', `          if (IccColorSpace.isUsable) {
            try {
              const iccCS = new IccColorSpace(stream.getBytes(), "ICCBased", numComps);`, `          if (!IccColorSpace.isUsable) {
            const alfbTransform = alfbIccTransform(stream.getBytes(), numComps);
            if (alfbTransform) {
              const alfbCS = new AlfbIccColorSpace(alfbTransform, numComps);
              if (isRef) {
                globalColorSpaceCache.set(null, cs[1], alfbCS);
              }
              return alfbCS;
            }
          }
          if (IccColorSpace.isUsable) {
            try {
              const iccCS = new IccColorSpace(stream.getBytes(), "ICCBased", numComps);`);
	return code;
};

module.exports = {
	...defaultConfig,
	// the dashboard script, includes/dashboard.php loads it
	entry: () => ({
		...defaultConfig.entry(),
		dashboard: './src/dashboard/index.js'
	}),
	// the lazy chunks get a version, so a browser never mixes a cached old chunk with a new view.js
	output: { ...defaultConfig.output, chunkFilename: '[name].js?ver=[contenthash:8]' },
	plugins: [
		...plugins,
		new CopyPlugin({
			patterns: [
				// .js not .mjs, many servers send .mjs with a MIME type workers refuse
				{ from: pdfjs + 'legacy/build/pdf.worker.mjs', to: 'pdfjs/pdf.worker.min.js', transform: patchWorker },
				asJson('cmaps', 'cmaps'),
				...licenses('cmaps', 'cmaps', ['LICENSE']),
				asJson('standard_fonts', 'standard_fonts'),
				...licenses('standard_fonts', 'standard_fonts', ['LICENSE_FOXIT', 'LICENSE_LIBERATION']),
				// JavaScript JPEG 2000 / JBIG2 decoders (the WebAssembly builds are not shipped)
				{ from: pdfjs + 'wasm/*_nowasm_fallback.js', to: 'pdfjs/decoders/[name][ext]' },
				...licenses('wasm', 'decoders', ['LICENSE_OPENJPEG', 'LICENSE_PDFJS_OPENJPEG', 'LICENSE_JBIG2', 'LICENSE_PDFJS_JBIG2']),
				{ from: pdfjs + 'LICENSE', to: 'pdfjs/LICENSE.txt' },
				{ from: 'node_modules/page-flip/LICENSE', to: 'page-flip-LICENSE.txt' },
				{ from: 'node_modules/@freemius/checkout/LICENSE', to: 'freemius-checkout-LICENSE.txt' }
			]
		})
	]
};
