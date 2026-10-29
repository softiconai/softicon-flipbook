=== SoftIcon Flipbook – PDF Flipbook & Magazine Viewer ===
Contributors: softiconai
Tags: flipbook, pdf flipbook, flip book, pdf viewer, pdf embed
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.1
Stable tag: 1.3.0
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Turn any PDF or set of images into a page-turning flipbook with a block editor block. Two-page spreads on desktop, one page on phones.

== Description ==

**SoftIcon Flipbook** turns your brochures, magazines, catalogs, menus and ebooks into a realistic page-turning book, right inside the block editor. Add the **Flipbook** block, pick a PDF and you see the finished book in the editor – no shortcodes, no separate "flipbook" screens.

https://www.youtube.com/watch?v=5geq69DXoN8

Video tutorials: [add a flipbook](https://www.youtube.com/watch?v=KGP_xpi8NGo&list=PLJEAefIarF4g), [the Hardcover design](https://www.youtube.com/watch?v=qqQeZQkX5ms&list=PLJEAefIarF4g) and [reading features](https://www.youtube.com/watch?v=1J7wCaUvugc&list=PLJEAefIarF4g), or watch the [whole playlist](https://www.youtube.com/playlist?list=PLJEAefIarF4g).

= Why choose SoftIcon Flipbook? =

* **Block first** – upload or pick a PDF in the block and preview the real flipbook while you edit.
* **Readable on phones** – the book switches to one page at a time on small screens, two-page spreads on wide ones. Or force one layout.
* **Light on your pages** – the flipbook engine loads only when the book scrolls into view, and pages are drawn as the reader gets near them. In a lightbox the book loads only when a visitor opens it.
* **Many books on one page** – show each one as a cover, button or link that opens the book in a popup.
* **PDF or images** – build a book from a PDF, or from images in reading order.
* **Clear errors** – if a PDF cannot be shown (for example a link to another website that blocks it), the block says why and keeps a link to the file.

= Features =

* Lightbox: a cover, button or text link on the page opens the book in a popup over the page
* Two designs: Classic, or Hardcover book with a cover around the pages, the stack of page edges, a shadow at the spine and large arrows beside the book
* PDF flipbook from the Media Library or a link
* Image flipbook from any set of images
* Auto, always-two-pages or always-one-page layout
* Hard cover: first and last pages turn on their own
* Open at any page, jump to a page from the page counter, or link straight to a page with #page=5
* Thumbnails of all pages: a click opens that page
* Zoom with the toolbar buttons, a pinch on phones or Ctrl + scroll on computers; drag to move around a zoomed page
* Toolbar with page counter, previous/next, thumbnails, zoom, download, fullscreen and a page-turn sound visitors can mute
* Keyboard arrows turn the pages, the toolbar works with screen readers
* Fullscreen that fits the book to the screen, with an iPhone fallback
* Maximum height and colors for background, toolbar and icons
* Wide and full width alignment

= Third-party libraries =

* PDF.js 6.4.299 (npm package pdfjs-dist) by Mozilla – [github.com/mozilla/pdf.js](https://github.com/mozilla/pdf.js) – Apache License 2.0. Bundled as build/pdfjs.js and build/pdfjs/pdf.worker.min.js (minified upstream build); license in build/pdfjs/LICENSE.txt.
  Also from the pdfjs-dist package: the JavaScript builds of the OpenJPEG (BSD-2) and JBIG2 (BSD-3) image decoders in build/pdfjs/decoders, the Foxit (BSD-3) and Liberation (GPLv2 with font exception) standard fonts in build/pdfjs/standard_fonts, and the Adobe CMaps (BSD-3) in build/pdfjs/cmaps, each with its license file. The fonts and CMaps are binary data files; the build stores each one unchanged as a base64 string in a .json file, which the plugin decodes back to the original bytes for pdf.js.
* StPageFlip 2.0.7 (npm package page-flip) by Nodlik – [github.com/Nodlik/StPageFlip](https://github.com/Nodlik/StPageFlip) – MIT License. License in build/page-flip-LICENSE.txt.

The unminified source of this plugin is in the src folder, with package.json and webpack.config.js. Build it with `npm install` and `npm run build`; the build copies the pdf.js files from node_modules/pdfjs-dist.

= Development =

The plugin is developed on GitHub: [github.com/softiconai/softicon-flipbook](https://github.com/softiconai/softicon-flipbook). Bug reports and pull requests are welcome there; for help, use the support forum here on WordPress.org.

== Installation ==

1. Install and activate the plugin.
2. Edit a post or page and add the **Flipbook** block.
3. Upload or choose a PDF (or switch to images) and publish.

== Frequently Asked Questions ==

= How do I add a flipbook? =

Edit a page, open the block inserter, search for Flipbook and add the block. Pick a PDF from your Media Library or upload one, and the live book appears right away. Watch the [36-second tutorial](https://www.youtube.com/watch?v=KGP_xpi8NGo&list=PLJEAefIarF4g).

= How do I get the hardcover look? =

Select the flipbook, open the Style tab and choose Hardcover book under Design. The pages get a cover, page edges and a shadow at the spine, with large arrows beside the book; you can pick the cover color there too. See it in the [Hardcover video](https://www.youtube.com/watch?v=qqQeZQkX5ms&list=PLJEAefIarF4g).

= Can the flipbook open in a popup? =

Yes. Select the flipbook, open the Style tab and turn on Open in a lightbox under Display. Choose what shows on the page – the book's cover, a button or a text link – and a click opens the book in a popup over the page. The cover is the PDF's first page, or any image you choose. The book loads only when it is opened, so a page can list many books and stay fast.

= Does it work with a PDF hosted on another website? =

Only if that website allows it (CORS). Browsers block reading PDFs from other sites otherwise. Upload the PDF to your Media Library and it always works.

= Is there a page or file size limit? =

The plugin adds no limit of its own; your site's upload limit still applies. Pages are drawn as the reader gets near them, and on servers that support range requests (most do) large PDFs are fetched in parts instead of all at once.

= Does it slow down my pages? =

The front end loads a 31 KB script (10 KB compressed). The PDF engine is loaded only when a flipbook comes near the screen, or for a lightbox only when it is opened.

= Does it work with caching and minify plugins? =

Yes. The block tells its script where the plugin's files are, so combining or moving scripts does not break the flipbook.

= Does it work with the Classic Editor or page builders? =

The flipbook is a block, so you add it in the block editor (Gutenberg). It works with any theme, including classic themes, on the pages and posts you build with blocks.

= How do I link to a specific page? =

Add #page= and the page number to the address of the page with the flipbook, for example https://example.com/catalog/#page=12. The first flipbook on the page opens at that page; if it is a lightbox, the popup opens there. Links like `<a href="#page=8">` on the same page turn the book to that page, so you can write your own table of contents. The [reading features video](https://www.youtube.com/watch?v=1J7wCaUvugc&list=PLJEAefIarF4g) shows it.

= Can visitors download the PDF? =

Yes, from the download button in the toolbar. You can hide the button in the block settings.

= Is the PDF text readable on phones? =

On small screens the book shows one page at a time at the full width of the screen. Visitors can pinch to zoom into a page and drag to move around it, and fullscreen redraws the pages at a higher resolution.

= Where can I get help? =

Ask in the [support forum](https://wordpress.org/support/plugin/softicon-flipbook/) and we will reply there, so the answer can help others too. For anything you would rather not post in public, such as a site you cannot share, email us at softiconai@gmail.com. Tell us your WordPress version, the page with the flipbook and what you see, and we will get back to you.

== Screenshots ==

1. A realistic page turn – drag a corner or use the toolbar.
2. Two-page spreads on desktop, with download, sound and fullscreen in the toolbar.
3. One page at a time on phones.
4. Live flipbook preview in the block editor, with the layout settings.
5. Add a PDF straight from the block: upload, Media Library or a link.
6. Set the maximum height and the colors of the background and toolbar.

== Changelog ==

= 1.3.0 =
* New: Lightbox. Turn on Open in a lightbox (Style tab, Display) to show only the book's cover, a button or a text link on the page; a click opens the book in a popup. The book loads only when it is opened.
* New: the cover can be the PDF's first page or an image you choose, with a caption, width and alignment.
* Links like #page=5 open a lightbox at that page.

= 1.2.2 =
* Clearer block settings: one panel open at a time, choices shown as icon tiles, short tips behind the (i) icons and a reset button for the height.
* The block now shows only its own General and Style tabs, without the extra WordPress tabs and Dimensions panel. Margins already set on a flipbook stay as they are.

= 1.2.1 =
* New: short video tutorials, linked from the empty block, a Help panel in the block settings, the Design panel and the Plugins screen.

= 1.2.0 =
* New: Hardcover book design – a cover around the pages, the stack of page edges and a shadow at the spine. Choose it under Design in the block's Style tab.
* New: large previous and next arrows beside the book.
* Fix: a flipbook added from the block inserter's search now looks right in the editor straight away.
* The GitHub repository moved to github.com/softiconai/softicon-flipbook.

= 1.1.0 =
* New: zoom with the toolbar buttons, a pinch on phones, or Ctrl + scroll and trackpad pinch on computers. Drag to move around a zoomed page.
* New: thumbnails of all pages; a click opens that page.
* New: click the page counter and type a page number to jump there.
* New: link straight to a page with #page=5, and links on the same page turn the book.
* Toolbar fits narrow columns and small phones.

= 1.0.2 =
* Longer plugin name and better readme tags, so the plugin is easier to find.
* Link to the GitHub repository and new FAQ entries.

= 1.0.1 =
* PDF.js CMaps and standard fonts now ship as JSON data files.
* JPEG 2000 and JBIG2 images in PDFs are decoded with the JavaScript decoders; the WebAssembly files are no longer included.

= 1.0.0 =
* First release.
