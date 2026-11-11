/**
 * Colour profiles (ICC) for pdf.js, in plain JavaScript.
 *
 * pdf.js converts a PDF's ICCBased colours with qcms, a WebAssembly module, and WordPress.org does not accept .wasm
 * files. Without it, pdf.js treats ProPhoto / Adobe RGB as plain RGB and CMYK with a rough formula, so books from
 * InDesign look dull or shifted. webpack.config.js (patchWorker) copies this file into the pdf.js worker; the worker
 * calls alfbIccTransform() for every ICCBased colour space when qcms is not in use.
 *
 * Handles RGB and grey profiles made of a matrix and curves, and RGB, CMYK and grey profiles made of lookup tables
 * (lut8, lut16, lutAtoB), with the PCS in XYZ or Lab. Output is sRGB, perceptual intent like pdf.js with qcms.
 * Anything else returns null and pdf.js falls back to its own conversion.
 */
/* exported alfbIccTransform */

// D50 XYZ (the ICC connection space) to linear sRGB, Bradford adapted to D65
const ALFB_XYZ_TO_SRGB = [3.1338561, -1.6168667, -0.4906146, -0.9787684, 1.9161415, 0.033454, 0.0719453, -0.2289914, 1.4052427];

// one transform per distinct profile: a PDF often repeats the same profile in many colour spaces
const alfbIccCache = new Map();

// eslint-disable-next-line no-unused-vars -- called by the pdf.js worker this file is copied into
function alfbIccTransform(bytes, numComps) {
	const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let hash = 0x811c9dc5;
	for (let i = 0; i < data.length; i++) {
		hash = Math.imul(hash ^ data[i], 0x01000193);
	}
	const key = `${numComps}:${data.length}:${hash >>> 0}`;
	if (!alfbIccCache.has(key)) {
		let transform = null;
		try {
			transform = alfbIccBuild(data, numComps);
		} catch (e) {
			// a damaged or unusual profile: pdf.js's own conversion is used
		}
		alfbIccCache.set(key, transform);
	}
	return alfbIccCache.get(key);
}

// linear light (0..1) to an sRGB value (0..255)
function alfbIccEncode(v) {
	if (!(v > 0)) {
		return 0;
	}
	if (v >= 1) {
		return 255;
	}
	return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
}

// sRGB encoding from a table, linear interpolation between 4096 steps (fast enough for every pixel of an image)
const alfbIccEncodeTable = (() => {
	const table = new Float64Array(4097);
	for (let i = 0; i <= 4096; i++) {
		table[i] = alfbIccEncode(i / 4096);
	}
	return table;
})();

function alfbIccEncodeFast(v) {
	if (!(v > 0)) {
		return 0;
	}
	if (v >= 1) {
		return 255;
	}
	const x = v * 4096;
	const i = x | 0;
	return alfbIccEncodeTable[i] + (alfbIccEncodeTable[i + 1] - alfbIccEncodeTable[i]) * (x - i);
}

function alfbIccXyzToRgb(X, Y, Z, out, encode = alfbIccEncode) {
	const m = ALFB_XYZ_TO_SRGB;
	out[0] = encode(m[0] * X + m[1] * Y + m[2] * Z);
	out[1] = encode(m[3] * X + m[4] * Y + m[5] * Z);
	out[2] = encode(m[6] * X + m[7] * Y + m[8] * Z);
}

// CIE Lab to XYZ, D50 white
function alfbIccLabToXyz(L, a, b, out) {
	const finv = t => (t > 6 / 29 ? t * t * t : 3 * (6 / 29) * (6 / 29) * (t - 4 / 29));
	const fy = (L + 16) / 116;
	out[0] = 0.9642 * finv(fy + a / 500);
	out[1] = finv(fy);
	out[2] = 0.8249 * finv(fy - b / 200);
}

const alfbIccClamp = x => (x > 0 ? (x < 1 ? x : 1) : 0);

// a sampled curve (0..1 in, 0..1 out) with linear interpolation
function alfbIccTable(values) {
	const last = values.length - 1;
	if (last < 1) {
		return () => values[0] || 0;
	}
	return x => {
		const p = alfbIccClamp(x) * last;
		const i = p >= last ? last - 1 : p | 0;
		return values[i] + (values[i + 1] - values[i]) * (p - i);
	};
}

// a 'curv' or 'para' element: [function, its size in bytes]
function alfbIccCurve(view, o) {
	const type = view.getUint32(o);
	if (0x63757276 === type) {
		// curv
		const count = view.getUint32(o + 8);
		const size = 12 + 2 * count;
		if (0 === count) {
			return [alfbIccClamp, size];
		}
		if (1 === count) {
			const gamma = view.getUint16(o + 12) / 256;
			return [x => Math.pow(alfbIccClamp(x), gamma), size];
		}
		const values = new Float64Array(count);
		for (let i = 0; i < count; i++) {
			values[i] = view.getUint16(o + 12 + 2 * i) / 65535;
		}
		return [alfbIccTable(values), size];
	}
	if (0x70617261 === type) {
		// para: the five parametric curve types of ICC v4
		const fn = view.getUint16(o + 8);
		const count = [1, 3, 4, 5, 7][fn];
		if (undefined === count) {
			throw new Error('ICC: unknown parametric curve');
		}
		const p = [];
		for (let i = 0; i < count; i++) {
			p.push(view.getInt32(o + 12 + 4 * i) / 65536);
		}
		const [g, a, b, c, d, e, f] = p;
		const pow = x => (x > 0 ? Math.pow(x, g) : 0);
		const curves = [
			x => pow(x),
			x => (x >= -b / a ? pow(a * x + b) : 0),
			x => (x >= -b / a ? pow(a * x + b) + c : c),
			x => (x >= d ? pow(a * x + b) : c * x),
			x => (x >= d ? pow(a * x + b) + e : c * x + f)
		];
		return [x => alfbIccClamp(curves[fn](alfbIccClamp(x))), 12 + 4 * count];
	}
	throw new Error('ICC: unknown curve type');
}

// multilinear interpolation in a grid; the first input varies least rapidly, as in ICC tables
function alfbIccGrid(table, dims, outCount) {
	const n = dims.length;
	const strides = new Array(n);
	for (let k = n - 1, s = 1; k >= 0; k--) {
		strides[k] = s;
		s *= dims[k];
	}
	const frac = new Float64Array(n);
	return (input, out) => {
		let base = 0;
		for (let k = 0; k < n; k++) {
			const last = dims[k] - 1;
			const x = alfbIccClamp(input[k]) * last;
			const i = x >= last ? Math.max(last - 1, 0) : x | 0;
			frac[k] = x - i;
			base += i * strides[k];
		}
		for (let o = 0; o < outCount; o++) {
			out[o] = 0;
		}
		for (let corner = 0; corner < 1 << n; corner++) {
			let weight = 1;
			let index = base;
			for (let k = 0; k < n; k++) {
				if (corner & (1 << k)) {
					weight *= frac[k];
					index += strides[k];
				} else {
					weight *= 1 - frac[k];
				}
			}
			if (weight) {
				for (let o = 0, t = index * outCount; o < outCount; o++) {
					out[o] += weight * table[t + o];
				}
			}
		}
	};
}

// an AToB lookup table tag: a function from device values (0..1) to the PCS, Lab or D50 XYZ
function alfbIccLut(view, o, isLab) {
	const type = view.getUint32(o);
	const inCount = view.getUint8(o + 8);
	const outCount = view.getUint8(o + 9);
	if (3 !== outCount || inCount < 1 || inCount > 4) {
		return null;
	}
	const a = new Float64Array(inCount);
	const b = new Float64Array(3);
	let stages;
	// Lab in lut16 uses the older ICC v2 16-bit encoding (L 100 at 0xFF00), the others the v4 one
	let legacyLab = false;

	if (0x6d667432 === type || 0x6d667431 === type) {
		// mft2 (lut16) and mft1 (lut8)
		const wide = 0x6d667432 === type;
		legacyLab = wide;
		const points = view.getUint8(o + 10);
		const inEntries = wide ? view.getUint16(o + 48) : 256;
		const outEntries = wide ? view.getUint16(o + 50) : 256;
		let p = o + (wide ? 52 : 48);
		const read = count => {
			const values = new Float64Array(count);
			for (let i = 0; i < count; i++, p += wide ? 2 : 1) {
				values[i] = wide ? view.getUint16(p) / 65535 : view.getUint8(p) / 255;
			}
			return values;
		};
		const inCurves = [];
		for (let k = 0; k < inCount; k++) {
			inCurves.push(alfbIccTable(read(inEntries)));
		}
		const grid = alfbIccGrid(read(Math.pow(points, inCount) * 3), new Array(inCount).fill(points), 3);
		const outCurves = [];
		for (let k = 0; k < 3; k++) {
			outCurves.push(alfbIccTable(read(outEntries)));
		}
		stages = (input, out) => {
			for (let k = 0; k < inCount; k++) {
				a[k] = inCurves[k](input[k]);
			}
			grid(a, b);
			for (let k = 0; k < 3; k++) {
				out[k] = outCurves[k](b[k]);
			}
		};
	} else if (0x6d414220 === type) {
		// mAB (lutAtoB): A curves, grid, M curves, matrix, B curves; each part may be missing
		const [offB, offMatrix, offM, offGrid, offA] = [12, 16, 20, 24, 28].map(k => view.getUint32(o + k));
		const curves = (offset, count) => {
			if (!offset) {
				return null;
			}
			const list = [];
			for (let k = 0, q = o + offset; k < count; k++) {
				const [fn, size] = alfbIccCurve(view, q);
				list.push(fn);
				q += (size + 3) & ~3;
			}
			return list;
		};
		const A = curves(offA, inCount);
		const M = curves(offM, 3);
		const B = curves(offB, 3);
		let grid = null;
		if (offGrid) {
			const q = o + offGrid;
			const dims = [];
			for (let k = 0; k < inCount; k++) {
				dims.push(view.getUint8(q + k));
			}
			const bytes = view.getUint8(q + 16);
			const count = dims.reduce((x, y) => x * y, 1) * 3;
			const values = new Float64Array(count);
			for (let i = 0; i < count; i++) {
				values[i] = 1 === bytes ? view.getUint8(q + 20 + i) / 255 : view.getUint16(q + 20 + 2 * i) / 65535;
			}
			grid = alfbIccGrid(values, dims, 3);
		} else if (3 !== inCount) {
			return null;
		}
		let m = null;
		if (offMatrix) {
			m = [];
			for (let k = 0; k < 12; k++) {
				m.push(view.getInt32(o + offMatrix + 4 * k) / 65536);
			}
		}
		stages = (input, out) => {
			for (let k = 0; k < inCount; k++) {
				a[k] = A ? A[k](input[k]) : input[k];
			}
			if (grid) {
				grid(a, b);
			} else {
				b.set(a);
			}
			if (M) {
				for (let k = 0; k < 3; k++) {
					b[k] = M[k](b[k]);
				}
			}
			if (m) {
				const [x, y, z] = b;
				b[0] = m[0] * x + m[1] * y + m[2] * z + m[9];
				b[1] = m[3] * x + m[4] * y + m[5] * z + m[10];
				b[2] = m[6] * x + m[7] * y + m[8] * z + m[11];
			}
			for (let k = 0; k < 3; k++) {
				out[k] = B ? B[k](b[k]) : alfbIccClamp(b[k]);
			}
		};
	} else {
		return null;
	}

	const pcs = new Float64Array(3);
	return (input, out) => {
		stages(input, pcs);
		if (isLab) {
			const ab = v => (legacyLab ? (v * 65535) / 256 - 128 : v * 255 - 128);
			out[0] = legacyLab ? (pcs[0] * 65535 * 100) / 0xff00 : pcs[0] * 100;
			out[1] = ab(pcs[1]);
			out[2] = ab(pcs[2]);
		} else {
			// XYZ as u1Fixed15
			for (let k = 0; k < 3; k++) {
				out[k] = (pcs[k] * 65535) / 32768;
			}
		}
	};
}

function alfbIccBuild(data, numComps) {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	const sig = o => String.fromCharCode(data[o], data[o + 1], data[o + 2], data[o + 3]);
	const space = { 'GRAY': 1, 'RGB ': 3, 'CMYK': 4 }[sig(16)];
	const pcs = sig(20);
	if (space !== numComps || ('XYZ ' !== pcs && 'Lab ' !== pcs) || !/^(mntr|prtr|scnr|spac)$/.test(sig(12))) {
		return null;
	}
	const tags = {};
	for (let i = 0, count = view.getUint32(128); i < count; i++) {
		tags[sig(132 + 12 * i)] = view.getUint32(136 + 12 * i);
	}

	// lookup tables: perceptual first, as pdf.js asks qcms for
	const lutTag = ['A2B0', 'A2B1', 'A2B2'].find(tag => tag in tags);
	const lut = lutTag ? alfbIccLut(view, tags[lutTag], 'Lab ' === pcs) : null;
	if (lut) {
		return alfbIccSampled(numComps, lut, 'Lab ' === pcs);
	}
	if (3 === numComps && ['rXYZ', 'gXYZ', 'bXYZ', 'rTRC', 'gTRC', 'bTRC'].every(tag => tag in tags)) {
		return alfbIccMatrix(view, tags);
	}
	if (1 === numComps && 'kTRC' in tags) {
		const curve = alfbIccCurve(view, tags.kTRC)[0];
		const grey = new Float64Array(3);
		return alfbIccWrap(1, (input, out) => {
			out[0] = out[1] = out[2] = alfbIccEncode(curve(input[0]));
		}, grey);
	}
	return null;
}

// matrix and curves (ProPhoto, Adobe RGB, …): exact for every pixel
function alfbIccMatrix(view, tags) {
	const xyz = tag => [0, 1, 2].map(k => view.getInt32(tags[tag] + 8 + 4 * k) / 65536);
	const [r, g, b] = [xyz('rXYZ'), xyz('gXYZ'), xyz('bXYZ')];
	const s = ALFB_XYZ_TO_SRGB;
	// device linear RGB straight to linear sRGB
	const m = [];
	for (let row = 0; row < 3; row++) {
		for (const col of [r, g, b]) {
			m.push(s[3 * row] * col[0] + s[3 * row + 1] * col[1] + s[3 * row + 2] * col[2]);
		}
	}
	const curves = ['rTRC', 'gTRC', 'bTRC'].map(tag => alfbIccCurve(view, tags[tag])[0]);
	const byteTables = curves.map(curve => Float64Array.from({ length: 256 }, (v, i) => curve(i / 255)));
	const convert = (x, y, z, out, encode) => {
		out[0] = encode(m[0] * x + m[1] * y + m[2] * z);
		out[1] = encode(m[3] * x + m[4] * y + m[5] * z);
		out[2] = encode(m[6] * x + m[7] * y + m[8] * z);
	};
	const rgb = new Float64Array(3);
	const transform = alfbIccWrap(3, (input, out) => {
		convert(curves[0](input[0]), curves[1](input[1]), curves[2](input[2]), out, alfbIccEncode);
	}, rgb);
	// 8-bit images: curves from tables
	transform.bytes = (src, i, out) => {
		convert(byteTables[0][src[i]], byteTables[1][src[i + 1]], byteTables[2][src[i + 2]], out, alfbIccEncodeFast);
	};
	return transform;
}

// lookup-table profiles: the whole conversion sampled once on a grid of sRGB values, then interpolated for every
// pixel the way LittleCMS does (tetrahedral, and linear in the first channel of CMYK)
function alfbIccSampled(numComps, lut, isLab) {
	const points = [0, 256, 0, 33, 17][numComps];
	const total = Math.pow(points, numComps);
	const table = new Float32Array(total * 3);
	const input = new Float64Array(numComps);
	const pcs = new Float64Array(3);
	const xyz = new Float64Array(3);
	const rgb = new Float64Array(3);
	for (let i = 0; i < total; i++) {
		for (let k = numComps - 1, rest = i; k >= 0; k--) {
			input[k] = (rest % points) / (points - 1);
			rest = Math.floor(rest / points);
		}
		lut(input, pcs);
		if (isLab) {
			alfbIccLabToXyz(pcs[0], pcs[1], pcs[2], xyz);
		} else {
			xyz.set(pcs);
		}
		alfbIccXyzToRgb(xyz[0], xyz[1], xyz[2], rgb);
		table.set(rgb, i * 3);
	}
	const grid = 1 === numComps ? alfbIccGrid(table, [points], 3) : alfbIccTetra(table, points, numComps);
	const transform = alfbIccWrap(numComps, grid, rgb);
	// 8-bit images: grid positions from a table
	const pos = Float64Array.from({ length: 256 }, (v, i) => i / 255);
	const values = new Float64Array(numComps);
	transform.bytes = (src, i, out) => {
		for (let k = 0; k < numComps; k++) {
			values[k] = pos[src[i + k]];
		}
		grid(values, out);
	};
	return transform;
}

// tetrahedral interpolation in a grid of sRGB values with the same number of points on every side (3 or 4 inputs)
function alfbIccTetra(table, points, n) {
	const last = points - 1;
	const sz = 3;
	const sy = sz * points;
	const sx = sy * points;
	const sk = sx * points;
	const cell = v => {
		const x = alfbIccClamp(v) * last;
		const i = x >= last ? last - 1 : x | 0;
		return [i, x - i];
	};
	const one = (base, rx, ry, rz, out, weight, add) => {
		const t = table;
		const X = sx;
		const Y = sy;
		const Z = sz;
		for (let o = 0; o < 3; o++) {
			const b = base + o;
			const c0 = t[b];
			let c1;
			let c2;
			let c3;
			if (rx >= ry && ry >= rz) {
				c1 = t[b + X] - c0;
				c2 = t[b + X + Y] - t[b + X];
				c3 = t[b + X + Y + Z] - t[b + X + Y];
			} else if (rx >= rz && rz >= ry) {
				c1 = t[b + X] - c0;
				c2 = t[b + X + Y + Z] - t[b + X + Z];
				c3 = t[b + X + Z] - t[b + X];
			} else if (rz >= rx && rx >= ry) {
				c1 = t[b + X + Z] - t[b + Z];
				c2 = t[b + X + Y + Z] - t[b + X + Z];
				c3 = t[b + Z] - c0;
			} else if (ry >= rx && rx >= rz) {
				c1 = t[b + X + Y] - t[b + Y];
				c2 = t[b + Y] - c0;
				c3 = t[b + X + Y + Z] - t[b + X + Y];
			} else if (ry >= rz && rz >= rx) {
				c1 = t[b + X + Y + Z] - t[b + Y + Z];
				c2 = t[b + Y] - c0;
				c3 = t[b + Y + Z] - t[b + Y];
			} else {
				c1 = t[b + X + Y + Z] - t[b + Y + Z];
				c2 = t[b + Y + Z] - t[b + Z];
				c3 = t[b + Z] - c0;
			}
			const v = c0 + c1 * rx + c2 * ry + c3 * rz;
			out[o] = add ? out[o] + weight * v : weight * v;
		}
	};
	if (3 === n) {
		return (input, out) => {
			const [x, rx] = cell(input[0]);
			const [y, ry] = cell(input[1]);
			const [z, rz] = cell(input[2]);
			one(x * sx + y * sy + z * sz, rx, ry, rz, out, 1, false);
		};
	}
	return (input, out) => {
		const [k, rk] = cell(input[0]);
		const [x, rx] = cell(input[1]);
		const [y, ry] = cell(input[2]);
		const [z, rz] = cell(input[3]);
		const base = k * sk + x * sx + y * sy + z * sz;
		one(base, rx, ry, rz, out, 1 - rk, false);
		if (rk) {
			one(base + sk, rx, ry, rz, out, rk, true);
		}
	};
}

// what the pdf.js colour space calls: one colour (values 0..1 × scale), or a run of pixels
function alfbIccWrap(numComps, convert, rgb) {
	const input = new Float64Array(numComps);
	const transform = {
		bytes: null,
		item(src, offset, scale, dest, destOffset) {
			for (let k = 0; k < numComps; k++) {
				input[k] = src[offset + k] * scale;
			}
			convert(input, rgb);
			dest[destOffset] = rgb[0];
			dest[destOffset + 1] = rgb[1];
			dest[destOffset + 2] = rgb[2];
		},
		buffer(src, offset, count, dest, destOffset, bits, alpha01) {
			const scale = 1 / ((1 << bits) - 1);
			const step = 3 + alpha01;
			const bytes = 8 === bits ? transform.bytes : null;
			// neighbouring pixels are often the same colour
			let lastKey = -1;
			for (let i = 0; i < count; i++, offset += numComps, destOffset += step) {
				let key = -1;
				if (bits <= 8) {
					key = 0;
					for (let k = 0; k < numComps; k++) {
						key = key * 256 + src[offset + k];
					}
				}
				if (key < 0 || key !== lastKey) {
					if (bytes) {
						bytes(src, offset, rgb);
					} else {
						for (let k = 0; k < numComps; k++) {
							input[k] = src[offset + k] * scale;
						}
						convert(input, rgb);
					}
					lastKey = key;
				}
				dest[destOffset] = rgb[0];
				dest[destOffset + 1] = rgb[1];
				dest[destOffset + 2] = rgb[2];
			}
		}
	};
	return transform;
}
