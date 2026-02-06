<?php
/**
 * Database Connection Class - MySQL PDO
 */

require_once __DIR__ . '/config.php';

class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];
        
        try {
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Eroare la conectarea la baza de date.");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->pdo;
    }
    
    // Prevent cloning
    private function __clone() {}
    
    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Helper function to get PDO connection
function db() {
    return Database::getInstance()->getConnection();
}

// ============== USER FUNCTIONS ==============

function find_user_by_email($email) {
    $stmt = db()->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    return $stmt->fetch();
}

function find_user_by_id($id) {
    $stmt = db()->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function create_user($email, $password, $name, $role = 'user') {
    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');
    
    $stmt = db()->prepare("
        INSERT INTO users (id, email, password_hash, name, role, is_active, email_notifications, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
    ");
    $stmt->execute([$id, $email, $hash, $name, $role, $now, $now]);
    
    return $id;
}

function verify_user_password($user, $password) {
    return password_verify($password, $user['password_hash']);
}

function count_users() {
    $stmt = db()->query("SELECT COUNT(*) FROM users");
    return (int) $stmt->fetchColumn();
}

function get_all_users() {
    $stmt = db()->query("SELECT id, email, name, role, is_active, email_notifications, created_at FROM users ORDER BY created_at DESC");
    return $stmt->fetchAll();
}

function update_user($id, $data) {
    $fields = [];
    $values = [];
    
    $allowed = ['name', 'role', 'is_active', 'email_notifications'];
    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $values[] = $data[$field];
        }
    }
    
    if (empty($fields)) return false;
    
    $fields[] = "updated_at = ?";
    $values[] = date('Y-m-d H:i:s');
    $values[] = $id;
    
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = db()->prepare($sql);
    return $stmt->execute($values);
}

// ============== MONITORED CASES FUNCTIONS ==============

function get_user_monitored_cases($user_id) {
    $stmt = db()->prepare("
        SELECT * FROM monitored_cases 
        WHERE user_id = ? AND is_active = 1 
        ORDER BY created_at DESC
    ");
    $stmt->execute([$user_id]);
    return $stmt->fetchAll();
}

function add_monitored_case($user_id, $numar_dosar, $institutie, $alias = null, $snapshot = null) {
    // Check if already exists
    $stmt = db()->prepare("
        SELECT id FROM monitored_cases 
        WHERE user_id = ? AND numar_dosar = ? AND is_active = 1
    ");
    $stmt->execute([$user_id, $numar_dosar]);
    if ($stmt->fetch()) {
        return ['error' => 'Dosarul este deja monitorizat'];
    }
    
    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');
    
    $stmt = db()->prepare("
        INSERT INTO monitored_cases (id, user_id, numar_dosar, institutie, alias, last_snapshot, last_check, created_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ");
    $stmt->execute([
        $id, 
        $user_id, 
        $numar_dosar, 
        $institutie, 
        $alias, 
        $snapshot ? json_encode($snapshot) : null,
        $now,
        $now
    ]);
    
    return ['id' => $id];
}

function remove_monitored_case($case_id, $user_id) {
    $stmt = db()->prepare("
        UPDATE monitored_cases 
        SET is_active = 0 
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$case_id, $user_id]);
    return $stmt->rowCount() > 0;
}

function get_monitored_case($case_id, $user_id) {
    $stmt = db()->prepare("
        SELECT * FROM monitored_cases 
        WHERE id = ? AND user_id = ? AND is_active = 1
    ");
    $stmt->execute([$case_id, $user_id]);
    return $stmt->fetch();
}

function update_monitored_case_snapshot($case_id, $snapshot) {
    $now = date('Y-m-d H:i:s');
    $stmt = db()->prepare("
        UPDATE monitored_cases 
        SET last_snapshot = ?, last_check = ? 
        WHERE id = ?
    ");
    $stmt->execute([json_encode($snapshot), $now, $case_id]);
}

// ============== NOTIFICATIONS FUNCTIONS ==============

function create_notification($user_id, $case_number, $message, $type = 'case_update') {
    $id = generate_uuid();
    $now = date('Y-m-d H:i:s');
    
    $stmt = db()->prepare("
        INSERT INTO notifications (id, user_id, case_number, message, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    ");
    $stmt->execute([$id, $user_id, $case_number, $message, $type, $now]);
    return $id;
}

function get_user_notifications($user_id, $limit = 50) {
    $stmt = db()->prepare("
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    ");
    $stmt->execute([$user_id, $limit]);
    return $stmt->fetchAll();
}

function get_unread_notification_count($user_id) {
    $stmt = db()->prepare("
        SELECT COUNT(*) FROM notifications 
        WHERE user_id = ? AND is_read = 0
    ");
    $stmt->execute([$user_id]);
    return (int) $stmt->fetchColumn();
}

function mark_notification_read($notif_id, $user_id) {
    $stmt = db()->prepare("
        UPDATE notifications 
        SET is_read = 1 
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$notif_id, $user_id]);
    return $stmt->rowCount() > 0;
}

function mark_all_notifications_read($user_id) {
    $stmt = db()->prepare("
        UPDATE notifications 
        SET is_read = 1 
        WHERE user_id = ? AND is_read = 0
    ");
    $stmt->execute([$user_id]);
    return $stmt->rowCount();
}

// ============== STATISTICS ==============

function get_admin_stats() {
    $stats = [];
    
    $stmt = db()->query("SELECT COUNT(*) FROM users");
    $stats['total_users'] = (int) $stmt->fetchColumn();
    
    $stmt = db()->query("SELECT COUNT(*) FROM users WHERE is_active = 1");
    $stats['active_users'] = (int) $stmt->fetchColumn();
    
    $stmt = db()->query("SELECT COUNT(*) FROM monitored_cases WHERE is_active = 1");
    $stats['total_monitored_cases'] = (int) $stmt->fetchColumn();
    
    $stmt = db()->query("SELECT COUNT(*) FROM notifications");
    $stats['total_notifications'] = (int) $stmt->fetchColumn();
    
    return $stats;
}

// ============== HELPERS ==============

function generate_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
