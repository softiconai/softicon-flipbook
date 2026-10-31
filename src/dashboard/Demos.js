import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useApi } from './api';
import Status from './Status';

const Demos = () => {
	const { data, error, loading } = useApi('/alfb/v1/dashboard/demos');

	// the demo books are real flipbooks; the viewer starts them once they are on the page
	useEffect(() => {
		if (data) {
			window.dispatchEvent(new window.Event('alfb:boot'));
		}
	}, [data]);

	if (loading || error) {
		return <Status error={error} />;
	}
	return <>
		<p className='alfb-lead'>{__('These are real flipbooks, try them. "Create a page" copies one into a new draft page, with the sample PDF added to your Media Library.', 'softicon-flipbook')}</p>
		<div className='alfb-demos'>
			{data.map(demo => <article key={demo.key} className={'alfb-card alfb-demo' + (demo.pro ? ' is-pro' : '')}>
				<header>
					<h3>{demo.title}{demo.pro && <> <span className='alfb-badge'>{__('Pro', 'softicon-flipbook')}</span></>}</h3>
					<p>{demo.text}</p>
				</header>
				{demo.html ? <>
					{/* the block's markup from render.php, escaped there */}
					<div className={'alfb-demo-view' + (demo.row ? ' is-row' : '')} dangerouslySetInnerHTML={{ __html: demo.html }} />
					<footer><a className='alfb-btn alfb-btn-teal' href={demo.create}>{__('Create a page with this', 'softicon-flipbook')}</a></footer>
				</> : <>
					<div className='alfb-demo-locked'><span className='dashicons dashicons-lock' aria-hidden='true' /></div>
					<footer><a className='alfb-btn alfb-btn-amber' href='#/compare'>{__('Available in Pro', 'softicon-flipbook')}</a></footer>
				</>}
			</article>)}
		</div>
	</>;
};

export default Demos;
