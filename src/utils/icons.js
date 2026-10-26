import { SVG, Path } from '@wordpress/primitives';

export const blockIcon = <SVG viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
	<Path d='M12 6.5C10.3 5.3 8 4.75 5 4.75H3v13h2c3 0 5.3.55 7 1.75 1.7-1.2 4-1.75 7-1.75h2v-13h-2c-3 0-5.3.55-7 1.75m-1.25 10.6c-1.5-.6-3.4-.9-5.75-.85V6.25c2.5 0 4.4.45 5.75 1.4zm8.25-.85c-2.35-.05-4.25.25-5.75.85V7.65c1.35-.95 3.25-1.4 5.75-1.4z' />
</SVG>;

const icon = (d, evenOdd = false) => <SVG viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' aria-hidden='true' focusable='false'>
	<Path d={d} fillRule={evenOdd ? 'evenodd' : undefined} />
</SVG>;

// settings tiles, the help tip and the help cards
export const icons = {
	pdf: icon('M6 2.5h7.6L19.5 8.4V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5M6 4v16h12V9.5h-5.5V4zm8 .6V8h3.4zM8 12.5h8V14H8zm0 3h8V17H8z', true),
	images: icon('M4.5 4.5h15A1.5 1.5 0 0 1 21 6v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V6a1.5 1.5 0 0 1 1.5-1.5m0 1.5v10.4l4.2-4.2 2.8 2.8 4.3-4.7 3.7 4V6zM8.5 10.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5', true),
	auto: icon('M2 4.5h14v10H2zm1.5 1.5v7h11V6zM6 16.5h6V18H6zM17 8h5v12.5h-5zm1.5 1.5V19h2V9.5z', true),
	twoPages: icon('M2.5 5h8.5v14H2.5zM4 6.5v11h5.5v-11zM13 5h8.5v14H13zm1.5 1.5v11H20v-11z', true),
	onePage: icon('M6.5 3h11v18h-11zM8 4.5v15h8v-15zM10 8h4v1.5h-4zm0 3h4v1.5h-4z', true),
	classic: icon('M3 6.5h8.25v11H3zM4.5 8v8h5.25V8zM12.75 6.5H21v11h-8.25zm1.5 1.5v8h5.25V8z', true),
	hardcover: icon('M1.5 4.5h21v15h-21zM3 6v12h8.25V6zm9.75 0v12H21V6z', true),
	info: icon('M12 2.75a9.25 9.25 0 1 1 0 18.5 9.25 9.25 0 0 1 0-18.5m0 1.5a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5M11.2 10.6h1.6V17h-1.6zm0-3.4h1.6v1.7h-1.6z', true),
	video: icon('M4.5 4.5h15A1.5 1.5 0 0 1 21 6v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V6a1.5 1.5 0 0 1 1.5-1.5m5.5 4v7l6-3.5z'),
	support: icon('M4.5 4h15A1.5 1.5 0 0 1 21 5.5v10a1.5 1.5 0 0 1-1.5 1.5H10l-5 4v-4h-.5A1.5 1.5 0 0 1 3 15.5v-10A1.5 1.5 0 0 1 4.5 4M7 8.5V10h10V8.5zm0 3V13h7v-1.5z', true),
	star: icon('M12 2.75l2.85 5.95 6.55.75-4.85 4.5 1.3 6.5L12 17.2l-5.85 3.25 1.3-6.5L2.6 9.45l6.55-.75z'),
	plugins: icon('M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z')
};
