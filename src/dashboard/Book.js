// a demo book drawn in the browser, the same markup src/render.php prints, so view.js starts it the same way
import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';
import { safeColor, toConfig } from '../utils/functions';

const defaults = Object.fromEntries(Object.entries(metadata.attributes).map(([key, value]) => [key, value.default]));

// block attributes in, view.js settings out
export const bookConfig = attributes => toConfig({ ...defaults, ...attributes });

const colorVars = attributes => {
	const style = {};
	[['bgColor', '--alfb-bg'], ['toolbarBg', '--alfb-bar-bg'], ['toolbarColor', '--alfb-bar-color'], ['coverColor', '--alfb-cover']].forEach(([key, name]) => {
		const color = safeColor(attributes[key]);
		if (color) {
			style[name] = color;
		}
	});
	return style;
};

// memo: once view.js has started a book, React leaves its markup alone
export const Flipbook = memo(({ attributes, config }) => <div className='alfb_wrapper wp-block-softicon-flipbook' data-alfb={JSON.stringify(config)} style={colorVars(attributes)}
	tabIndex='0' role='region' aria-label={__('Flipbook', 'softicon-flipbook')}>
	<div className='alfb_stage'><div className='alfb_loading'><span className='alfb_spinner' /></div></div>
</div>);

export const Lightbox = memo(({ attributes, config }) => {
	const a = { ...defaults, ...attributes };
	const text = (a.lightboxText || '').trim();
	const label = text || __('Read the flipbook', 'softicon-flipbook');
	const cover = 'cover' === a.lightboxTrigger;
	const style = { ...colorVars(a), ...(cover ? { '--alfb-lb-width': Math.min(600, Math.max(120, a.lightboxWidth)) + 'px' } : {}) };

	return <div className={'alfb_lb wp-block-softicon-flipbook alfb_lb_' + a.lightboxAlign + (cover ? ' alfb_lb_draw' : '')} data-alfb={JSON.stringify(config)} style={style}>
		{cover ? <a className='alfb_lb_trigger alfb_lb_cover' href={config.pdf} aria-haspopup='dialog' aria-label={text ? undefined : label}>
			<span className='alfb_lb_img' />
			{text && <span className='alfb_lb_caption'>{text}</span>}
		</a> : <a className={'alfb_lb_trigger ' + ('button' === a.lightboxTrigger ? 'alfb_lb_button wp-element-button' : 'alfb_lb_link')} href={config.pdf} aria-haspopup='dialog'>{label}</a>}
	</div>;
});

// a book of a demo: a component an add-on gave, or a flipbook / lightbox from its attributes
export const DemoBook = ({ book }) => {
	if (book.Component) {
		return <book.Component {...book} />;
	}
	const config = book.config || bookConfig(book.attributes);
	return 'lightbox' === book.attributes?.displayMode ? <Lightbox attributes={book.attributes} config={config} /> : <Flipbook attributes={book.attributes || {}} config={config} />;
};
