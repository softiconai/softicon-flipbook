import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { drawCover } from '../../viewer/Lightbox';

// the cover, button or link the page shows in lightbox mode, the same markup as render.php
const LightboxPreview = ({ attributes }) => {
	const { source, pdfUrl, images, lightboxTrigger, lightboxText, lightboxImage, lightboxWidth, lightboxAlign } = attributes;
	const cover = 'cover' === lightboxTrigger;
	const image = lightboxImage?.url || ('images' === source ? images[0]?.url : '');
	const draw = cover && !image && 'pdf' === source && !!pdfUrl;
	const host = useRef();
	const [drawn, setDrawn] = useState(false);

	// page 1 drawn once at the widest cover, so the width slider needs no redraw
	useEffect(() => {
		const el = host.current;
		if (!draw || !el) {
			return;
		}
		let cancelled = false;
		setDrawn(false);
		drawCover(pdfUrl, el.ownerDocument, 600).then(canvas => {
			if (!cancelled) {
				el.replaceChildren(canvas);
				setDrawn(true);
			}
		}).catch(() => {});
		return () => {
			cancelled = true;
			el.replaceChildren();
		};
	}, [draw, pdfUrl]);

	const label = lightboxText || __('Read the flipbook', 'softicon-flipbook');

	return <div className={`alfb_lb alfb_lb_${lightboxAlign}` + (draw && !drawn ? ' alfb_lb_draw' : '')} style={{ '--alfb-lb-width': lightboxWidth + 'px' }}>
		{cover ? <span className='alfb_lb_trigger alfb_lb_cover'>
			<span className='alfb_lb_img'>
				{image ? <img src={image} alt='' /> : <span ref={host} />}
			</span>
			{lightboxText && <span className='alfb_lb_caption'>{lightboxText}</span>}
		</span> : <span className={'alfb_lb_trigger ' + ('button' === lightboxTrigger ? 'alfb_lb_button wp-element-button' : 'alfb_lb_link')}>{label}</span>}
	</div>;
};

export default LightboxPreview;
