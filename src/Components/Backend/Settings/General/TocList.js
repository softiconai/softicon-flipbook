// the book's own table of contents (the toc attribute): a title and a page for each entry, in the Toolbar panel.
// When it has entries it takes the place of the PDF's bookmarks, and books made of images get a contents button too.
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

const MAX = 200;

const TocList = ({ toc, onChange }) => {
	const rows = Array.isArray(toc) ? toc : [];
	const update = (index, values) => onChange(rows.map((row, i) => i === index ? { ...row, ...values } : row));
	const move = (index, by) => {
		const next = [...rows];
		const [row] = next.splice(index, 1);
		next.splice(index + by, 0, row);
		onChange(next);
	};
	const add = () => {
		// the next entry starts one page after the last one
		const last = rows.length ? parseInt(rows[rows.length - 1].page, 10) || 0 : 0;
		onChange([...rows, { title: '', page: last + 1 }]);
	};

	return <div className='alfbToc'>
		{rows.length > 0 && <ol className='alfbTocRows'>
			{rows.map((row, index) => <li key={index} className='alfbTocRow'>
				<input type='text' className='alfbTocTitle' value={row.title || ''} placeholder={__('Chapter title', 'softicon-flipbook')}
					aria-label={sprintf(
						/* translators: %d: the entry's number in the list */
						__('Title of entry %d', 'softicon-flipbook'), index + 1)}
					onChange={event => update(index, { title: event.target.value })} />
				<input type='number' className='alfbTocPage' min={1} value={row.page || ''} placeholder={__('Page', 'softicon-flipbook')}
					aria-label={sprintf(
						/* translators: %d: the entry's number in the list */
						__('Page of entry %d', 'softicon-flipbook'), index + 1)}
					onChange={event => update(index, { page: Math.max(1, parseInt(event.target.value, 10) || 1) })} />
				<span className='alfbTocTools'>
					<Button icon='arrow-up-alt2' size='small' label={__('Move up', 'softicon-flipbook')} disabled={0 === index} onClick={() => move(index, -1)} />
					<Button icon='arrow-down-alt2' size='small' label={__('Move down', 'softicon-flipbook')} disabled={rows.length - 1 === index} onClick={() => move(index, 1)} />
					<Button icon='no-alt' size='small' label={__('Remove', 'softicon-flipbook')} isDestructive onClick={() => onChange(rows.filter((r, i) => i !== index))} />
				</span>
			</li>)}
		</ol>}
		<Button variant='secondary' size='compact' icon='plus-alt2' disabled={rows.length >= MAX} onClick={add}>{__('Add entry', 'softicon-flipbook')}</Button>
	</div>;
};

export default TocList;
