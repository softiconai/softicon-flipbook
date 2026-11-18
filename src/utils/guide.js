// the Welcome tab's "Block" or "Shortcode" choice opens the editor with ?alfb_start=block|shortcode: the Flipbook block then
// shows the steps for that way (Edit.js). Read once on load, before src/index.js takes it out of the address
const mode = new URLSearchParams(window.location.search).get('alfb_start');

export default ['block', 'shortcode'].includes(mode) ? mode : null;
