import { SVG, Path } from '@wordpress/primitives';

export const blockIcon = <SVG viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
	<Path d='M12 6.5C10.3 5.3 8 4.75 5 4.75H3v13h2c3 0 5.3.55 7 1.75 1.7-1.2 4-1.75 7-1.75h2v-13h-2c-3 0-5.3.55-7 1.75m-1.25 10.6c-1.5-.6-3.4-.9-5.75-.85V6.25c2.5 0 4.4.45 5.75 1.4zm8.25-.85c-2.35-.05-4.25.25-5.75.85V7.65c1.35-.95 3.25-1.4 5.75-1.4z' />
</SVG>;

const icon = (d, evenOdd = false) => <SVG viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' focusable='false'>
	<Path d={d} fillRule={evenOdd ? 'evenodd' : undefined} />
</SVG>;

// settings tiles (the shared icons are in vendor/softicon-tools/components/icons.js)
export const icons = {
	pdf: icon('M6 2.5h7.6L19.5 8.4V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5M6 4v16h12V9.5h-5.5V4zm8 .6V8h3.4zM8 12.5h8V14H8zm0 3h8V17H8z', true),
	images: icon('M4.5 4.5h15A1.5 1.5 0 0 1 21 6v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V6a1.5 1.5 0 0 1 1.5-1.5m0 1.5v10.4l4.2-4.2 2.8 2.8 4.3-4.7 3.7 4V6zM8.5 10.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5', true),
	auto: icon('M2 4.5h14v10H2zm1.5 1.5v7h11V6zM6 16.5h6V18H6zM17 8h5v12.5h-5zm1.5 1.5V19h2V9.5z', true),
	twoPages: icon('M2.5 5h8.5v14H2.5zM4 6.5v11h5.5v-11zM13 5h8.5v14H13zm1.5 1.5v11H20v-11z', true),
	onePage: icon('M6.5 3h11v18h-11zM8 4.5v15h8v-15zM10 8h4v1.5h-4zm0 3h4v1.5h-4z', true),
	classic: icon('M3 6.5h8.25v11H3zM4.5 8v8h5.25V8zM12.75 6.5H21v11h-8.25zm1.5 1.5v8h5.25V8z', true),
	hardcover: icon('M1.5 4.5h21v15h-21zM3 6v12h8.25V6zm9.75 0v12H21V6z', true),
	cover: icon('M6 2.5h12A1.5 1.5 0 0 1 19.5 4v16a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5M8 4v16h10V4zm2.5 3H16v1.5h-5.5z', true),
	button: icon('M4 7h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2m0 1.5a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h16a.5.5 0 0 0 .5-.5V9a.5.5 0 0 0-.5-.5zM7 11.25h10v1.5H7z', true),
	text: icon('M3 7h18v1.5H3zm0 4.5h12V13H3zm0 4.5h7.5v1.5H3z'),
	alignLeft: icon('M4 5h16v1.5H4zm0 4h10v1.5H4zm0 4h16v1.5H4zm0 4h10v1.5H4z'),
	alignCenter: icon('M4 5h16v1.5H4zm3 4h10v1.5H7zm-3 4h16v1.5H4zm3 4h10v1.5H7z'),
	alignRight: icon('M4 5h16v1.5H4zm6 4h10v1.5H10zm-6 4h16v1.5H4zm6 4h10v1.5H10z')
};
