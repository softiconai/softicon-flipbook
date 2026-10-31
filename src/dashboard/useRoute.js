import { useEffect, useState } from '@wordpress/element';

// '#/demos' -> 'demos'; an old ?tab= link becomes its #/route
const read = keys => {
	const hash = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
	if (hash) {
		return hash;
	}
	const old = new URLSearchParams(window.location.search).get('tab');
	return old && keys.includes(old) ? old : keys[0];
};

const useRoute = keys => {
	const [route, setRoute] = useState(() => read(keys));
	useEffect(() => {
		const change = () => {
			setRoute(read(keys));
			window.scrollTo(0, 0);
		};
		window.addEventListener('hashchange', change);
		return () => window.removeEventListener('hashchange', change);
	}, [keys]);
	return route;
};

export default useRoute;
