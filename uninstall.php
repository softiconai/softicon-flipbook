<?php
// Runs when the plugin is deleted. WordPress uses this file before any registered uninstall hook, so it also covers
// sites that still have the hook of the old Freemius SDK (1.4.2) registered, whose class is no longer here.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

require_once __DIR__ . '/softicon-flipbook.php';

// the deactivation reason goes to Freemius if one was given, then the opt-in data is removed
ALFB_Flipbook\fs_lite::uninstall();
delete_transient( 'alfb_freemius' );
