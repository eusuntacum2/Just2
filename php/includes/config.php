<?php
/**
 * Portal Dosare just.ro - Configurare
 * PHP Version - MySQL/Bootstrap/PHP Sessions
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', APP_ROOT . '/logs/error.log');

// Database Configuration
define('DB_HOST', getenv('MYSQL_HOST') ?: 'localhost');
define('DB_PORT', getenv('MYSQL_PORT') ?: '3306');
define('DB_NAME', getenv('MYSQL_DATABASE') ?: 'portal_dosare');
define('DB_USER', getenv('MYSQL_USER') ?: 'root');
define('DB_PASS', getenv('MYSQL_PASSWORD') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Application Configuration
define('APP_NAME', 'Portal Dosare');
define('APP_VERSION', '1.0.0');
define('APP_URL', getenv('APP_URL') ?: 'http://localhost');

// SOAP API Configuration
define('SOAP_WSDL', 'http://portalquery.just.ro/query.asmx?WSDL');
define('SOAP_TIMEOUT', 30);

// Security
define('BCRYPT_COST', 12);
define('SESSION_LIFETIME', 86400); // 24 hours

// Pagination
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);
define('MAX_SEARCH_TERMS', 50);

// Timezone
date_default_timezone_set('Europe/Bucharest');

// CSRF Token Generation
function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_token($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Flash Messages
function set_flash($type, $message) {
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function get_flash() {
    $messages = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $messages;
}

// Check if user is logged in
function is_logged_in() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

// Get current user
function get_current_user() {
    if (!is_logged_in()) {
        return null;
    }
    return [
        'id' => $_SESSION['user_id'],
        'email' => $_SESSION['user_email'] ?? '',
        'name' => $_SESSION['user_name'] ?? '',
        'role' => $_SESSION['user_role'] ?? 'user'
    ];
}

// Check if user is admin
function is_admin() {
    return is_logged_in() && ($_SESSION['user_role'] ?? '') === 'admin';
}

// Require authentication
function require_auth() {
    if (!is_logged_in()) {
        set_flash('error', 'Trebuie să fii autentificat pentru a accesa această pagină.');
        header('Location: /php/pages/login.php');
        exit;
    }
}

// Require admin
function require_admin() {
    require_auth();
    if (!is_admin()) {
        set_flash('error', 'Nu ai permisiunea de a accesa această pagină.');
        header('Location: /php/pages/dashboard.php');
        exit;
    }
}

// Sanitize output
function h($string) {
    return htmlspecialchars($string ?? '', ENT_QUOTES, 'UTF-8');
}

// JSON Response helper
function json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Error JSON Response
function json_error($message, $status = 400) {
    json_response(['error' => $message, 'success' => false], $status);
}

// Success JSON Response
function json_success($data = [], $message = 'Success') {
    json_response(array_merge(['success' => true, 'message' => $message], $data));
}
