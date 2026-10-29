# SoftIcon Flipbook

Turn any PDF or set of images into a page-turning flipbook with a WordPress block. Two-page spreads on desktop, one page on phones, and a live preview in the block editor.

[WordPress.org](https://wordpress.org/plugins/softicon-flipbook/) · [Report an issue](https://github.com/softiconai/softicon-flipbook/issues) · Requires WordPress 6.5+ · PHP 7.1+ · GPLv3

[![Watch the 1-minute overview](https://img.youtube.com/vi/5geq69DXoN8/maxresdefault.jpg)](https://www.youtube.com/watch?v=5geq69DXoN8)

## Video tutorials

- [Overview](https://www.youtube.com/watch?v=5geq69DXoN8&list=PLJEAefIarF4g) – every feature in a minute
- [Add a flipbook](https://www.youtube.com/watch?v=KGP_xpi8NGo&list=PLJEAefIarF4g) – from PDF to book in the block editor
- [Hardcover design](https://www.youtube.com/watch?v=qqQeZQkX5ms&list=PLJEAefIarF4g) – cover, page edges, spine shadow and side arrows
- [Reading features](https://www.youtube.com/watch?v=1J7wCaUvugc&list=PLJEAefIarF4g) – zoom, thumbnails, page numbers, `#page=` links and fullscreen
- [Lightbox](https://www.youtube.com/watch?v=XBJuUV9HpkA&list=PLJEAefIarF4g) – show covers on the page and open each book in a popup
- [The whole playlist](https://www.youtube.com/playlist?list=PLJEAefIarF4g)

## Features

- PDF from the Media Library or a link, or a set of images
- Classic or Hardcover design, with large side arrows
- Lightbox: a cover, button or text link that opens the book in a popup
- Zoom (buttons, pinch, Ctrl + scroll), thumbnails, jump to a page, `#page=5` links, fullscreen
- Auto, two-page or one-page layout; open at any page
- Loads only when the book scrolls into view; large PDFs stream in parts

## Development

```bash
npm install
npm run start   # watch
npm run build   # production build
npm run zip     # build + .pot + release zip
```

The viewer is in `src/viewer/` (pdf.js 6 and page-flip 2). `src/vendor/softicon-tools/` is copied from the shared SoftIcon tools folder before every build.

## Support

Ask in the [support forum](https://wordpress.org/support/plugin/softicon-flipbook/), or email softiconai@gmail.com.
