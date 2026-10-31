// the filter box above the Free vs Pro feature table
document.querySelectorAll('[data-alfb-filter]').forEach(section => {
	const input = section.querySelector('input[type="search"]');
	const groups = [...section.querySelectorAll('tbody:not(.alfb-empty)')];
	const empty = section.querySelector('.alfb-empty');

	input?.addEventListener('input', () => {
		const words = input.value.trim().toLowerCase();
		let shown = 0;
		groups.forEach(group => {
			const title = group.querySelector('.alfb-group').textContent.toLowerCase();
			const rows = [...group.querySelectorAll('tr:not(.alfb-group)')];
			// a group name match keeps its whole group
			const all = !words || title.includes(words);
			let count = 0;
			rows.forEach(row => {
				row.hidden = !all && !row.textContent.toLowerCase().includes(words);
				count += row.hidden ? 0 : 1;
			});
			group.hidden = 0 === count;
			shown += count;
		});
		empty.hidden = 0 < shown;
	});
});
