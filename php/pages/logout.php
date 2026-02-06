<?php
/**
 * Logout
 */

require_once dirname(__DIR__) . '/includes/config.php';

// Clear session
session_destroy();

// Start new session for flash message
session_start();
set_flash('success', 'Te-ai deconectat cu succes.');

header('Location: login.php');
exit;
