// Google Drive share links. Drive's share page is a web page, not the file, and its download server refuses a file to
// another website in the browser (403 to a cross-site request), so the book tells to upload the PDF instead; Pro copies
// it to the Media Library from the server (includes/pro/drive.php)
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

// a link to a Drive folder (…/drive/folders/ID): a list of files, never a PDF itself
export const driveFolder = url => {
	try {
		const link = new URL(String(url || '').trim());
		return 'drive.google.com' === link.hostname.toLowerCase() && /^\/drive\/(?:u\/\d+\/)?folders\//.test(link.pathname);
	} catch (e) {
		return false;
	}
};
