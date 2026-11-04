// Builds assets/demo/*.pdf from the HTML here with Chromium (Playwright): node tools/demo-pdf/make.js
// The pages are 600×800 CSS px (450×600 pt) and use the Inter font (SIL Open Font License 1.1) from Google Fonts.
// The room guide is tagged, which is what gives it a bookmark for each chapter (each h1).
const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	for (const [name, bookmarks] of [['spring-catalog', false], ['room-guide', true]]) {
		await page.goto('file://' + path.join(__dirname, name + '.html'), { waitUntil: 'networkidle' });
		await page.evaluate(() => document.fonts.ready);
		await page.pdf({ path: path.join(__dirname, '../../assets/demo', name + '.pdf'), width: '600px', height: '800px', printBackground: true, outline: bookmarks, tagged: bookmarks });
	}
	await browser.close();
})();
