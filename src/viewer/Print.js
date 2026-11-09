import { __, sprintf } from '@wordpress/i18n';

// Print: every page drawn by the book's own pdf.js (or its images) into a print-only sheet, then the browser's print
// dialog. It works for a PDF on another site and for an image book too, where the browser's PDF viewer cannot help.
const WIDTH = 1240; // about 150 dpi on A4

const style = doc => {
	if (doc.getElementById('alfb-print-style')) {
		return;
	}
	const css = doc.createElement('style');
	css.id = 'alfb-print-style';
	css.textContent = '.alfb_print{display:none}'
		+ '@media print{body.alfb_printing>*:not(.alfb_print){display:none!important}'
		+ 'body.alfb_printing .alfb_print{display:block}'
		// one book page on each sheet of paper, as large as fits
		+ '.alfb_print img{display:block;max-width:100%;max-height:100vh;width:auto;height:auto;margin:0 auto;break-after:page;page-break-after:always}'
		+ '.alfb_print img:last-child{break-after:auto;page-break-after:auto}'
		+ '@page{margin:0}}';
	doc.head.append(css);
};

export default async function print(book) {
	if (book.printing) {
		return;
	}
	book.printing = true;
	const { doc, win } = book;
	style(doc);
	const sheet = doc.createElement('div');
	sheet.className = 'alfb_print';
	const note = doc.createElement('span');
	note.className = 'alfb_toast';
	note.setAttribute('role', 'status');
	book.root.append(note);

	try {
		for (let i = 0; i < book.count; i++) {
			/* translators: 1: page being prepared, 2: number of pages */
			note.textContent = sprintf(__('Preparing pages %1$d / %2$d', 'softicon-flipbook'), i + 1, book.count);
			const img = doc.createElement('img');
			img.alt = '';
			if ('images' === book.config.source) {
				img.src = book.config.images[i].url;
				await img.decode().catch(() => {});
			} else {
				const canvas = await book.drawPage(i, WIDTH);
				img.src = canvas.toDataURL('image/jpeg', 0.9);
			}
			sheet.append(img);
		}
		doc.body.append(sheet);
		doc.body.classList.add('alfb_printing');
		note.remove();
		const done = () => {
			doc.body.classList.remove('alfb_printing');
			sheet.remove();
			book.printing = false;
			win.removeEventListener('afterprint', done);
		};
		win.addEventListener('afterprint', done);
		win.print();
	} catch (e) {
		note.textContent = __('The book could not be printed.', 'softicon-flipbook');
		setTimeout(() => note.remove(), 2500);
		sheet.remove();
		book.printing = false;
	}
}
