// Google Drive share links. Drive's share page is a web page, not the file, but its download server lets other
// websites read a file shared with "Anyone with the link", so the book reads the PDF from there
const HOSTS = ['drive.google.com', 'docs.google.com', 'drive.usercontent.google.com'];

// the file id of a Drive link (…/file/d/ID/view, open?id=ID, uc?id=ID), '' for any other link; same rules as
// drive::file_id() in SoftIcon Flipbook Pro
export const driveId = url => {
	let link;
	try {
		link = new URL(String(url || '').trim());
	} catch (e) {
		return '';
	}
	if (!HOSTS.includes(link.hostname.toLowerCase())) {
		return '';
	}
	const id = link.pathname.match(/^\/file\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{10,})/)?.[1] || link.searchParams.get('id') || '';
	return /^[A-Za-z0-9_-]{10,}$/.test(id) ? id : '';
};

// the file itself for a Drive link (confirm=t skips Drive's "can't scan this file for viruses" page), any other link as it is
export const fileUrl = url => {
	const id = driveId(url);
	return id ? 'https://drive.usercontent.google.com/download?id=' + id + '&export=download&confirm=t' : url;
};
