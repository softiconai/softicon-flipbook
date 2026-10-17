// cover board margin around the pages, in CSS pixels
const BOARD = 10;

// hard cover boards, the stack of page edges and a spine shadow drawn around page-flip's pages
export default class Hardcover {
	constructor(book) {
		this.book = book;
		const part = className => {
			const el = book.doc.createElement('div');
			el.className = className;
			el.setAttribute('aria-hidden', 'true');
			return el;
		};
		this.board = part('alfb_board');
		this.leftEdge = part('alfb_edge alfb_edge_left');
		this.rightEdge = part('alfb_edge alfb_edge_right');
		this.gutter = part('alfb_gutter');
		// behind the book, the spine shadow over it
		book.stage.prepend(this.board, this.leftEdge, this.rightEdge);
		book.stage.append(this.gutter);
		book.root.classList.add('alfb_hardcover');
	}

	// page-flip places the pages on its next animation frames, measure after that
	update() {
		const { win } = this.book;
		win.cancelAnimationFrame(this.frame);
		this.frame = win.requestAnimationFrame(() => {
			this.frame = win.requestAnimationFrame(() => this.measure());
		});
	}

	measure() {
		const { book } = this;
		const stage = book.stage.getBoundingClientRect();
		const rects = book.visible().map(index => book.pages[index].getBoundingClientRect()).filter(rect => rect.width);
		if (!rects.length) {
			return;
		}
		const left = Math.min(...rects.map(rect => rect.left)) - stage.left;
		const right = Math.max(...rects.map(rect => rect.right)) - stage.left;
		const top = Math.min(...rects.map(rect => rect.top)) - stage.top;
		const bottom = Math.max(...rects.map(rect => rect.bottom)) - stage.top;

		// pages already read stack up on the left, the rest on the right
		const first = Math.min(...book.visible());
		const read = book.count > 1 ? first / (book.count - 1) : 0;
		const thickest = Math.min(12, Math.max(4, Math.round(book.count / 4)));
		const leftThick = Math.round(thickest * read);
		const rightThick = Math.round(thickest * (1 - read));

		// a closed book shows its cover, the board barely shows around it
		const closed = 1 === rects.length && 'landscape' === book.flip.getOrientation();
		const margin = closed ? 3 : BOARD;
		place(this.board, left - leftThick - margin, top - margin, right - left + leftThick + rightThick + 2 * margin, bottom - top + 2 * margin);
		place(this.leftEdge, left - leftThick, top + 2, leftThick, bottom - top - 4);
		place(this.rightEdge, right, top + 2, rightThick, bottom - top - 4);

		// spine shadow where the two pages of a spread meet
		if (2 === rects.length) {
			const spine = Math.min(rects[0].right, rects[1].right) - stage.left;
			const width = Math.round((right - left) * 0.06);
			place(this.gutter, spine - width, top, 2 * width, bottom - top);
		} else {
			this.gutter.style.display = 'none';
		}
	}

	// the spine shadow would sit over a page that is turning
	flipping(on) {
		this.gutter.classList.toggle('alfb_hidden', on);
	}

	destroy() {
		this.book.win.cancelAnimationFrame(this.frame);
		[this.board, this.leftEdge, this.rightEdge, this.gutter].forEach(el => el.remove());
		this.book.root.classList.remove('alfb_hardcover');
	}
}

function place(el, left, top, width, height) {
	el.style.display = width > 0 && height > 0 ? '' : 'none';
	el.style.left = Math.round(left) + 'px';
	el.style.top = Math.round(top) + 'px';
	el.style.width = Math.round(width) + 'px';
	el.style.height = Math.round(height) + 'px';
}
