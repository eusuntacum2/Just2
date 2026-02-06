<?php
/**
 * Installation Script for Portal Dosare
 * Creates database tables and first admin user
 */

// Configuration form
$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;
$errors = [];
$success = [];

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($step === 1) {
        // Database configuration
        $db_host = trim($_POST['db_host'] ?? 'localhost');
        $db_port = trim($_POST['db_port'] ?? '3306');
        $db_name = trim($_POST['db_name'] ?? 'portal_dosare');
        $db_user = trim($_POST['db_user'] ?? 'root');
        $db_pass = $_POST['db_pass'] ?? '';
        
        try {
            $dsn = "mysql:host=$db_host;port=$db_port;charset=utf8mb4";
            $pdo = new PDO($dsn, $db_user, $db_pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            
            // Create database if not exists
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `$db_name`");
            
            // Run schema
            $schema = file_get_contents(__DIR__ . '/schema.sql');
            $pdo->exec($schema);
            
            // Store config in session for next step
            session_start();
            $_SESSION['install_config'] = [
                'db_host' => $db_host,
                'db_port' => $db_port,
                'db_name' => $db_name,
                'db_user' => $db_user,
                'db_pass' => $db_pass
            ];
            
            header('Location: install.php?step=2');
            exit;
        } catch (PDOException $e) {
            $errors[] = 'Eroare la conectarea la baza de date: ' . $e->getMessage();
        }
    } elseif ($step === 2) {
        session_start();
        $config = $_SESSION['install_config'] ?? null;
        
        if (!$config) {
            header('Location: install.php?step=1');
            exit;
        }
        
        $admin_email = trim($_POST['admin_email'] ?? '');
        $admin_name = trim($_POST['admin_name'] ?? '');
        $admin_pass = $_POST['admin_pass'] ?? '';
        $admin_pass_confirm = $_POST['admin_pass_confirm'] ?? '';
        
        if (empty($admin_email) || !filter_var($admin_email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email invalid';
        }
        if (empty($admin_name)) {
            $errors[] = 'Numele este obligatoriu';
        }
        if (strlen($admin_pass) < 6) {
            $errors[] = 'Parola trebuie să aibă minim 6 caractere';
        }
        if ($admin_pass !== $admin_pass_confirm) {
            $errors[] = 'Parolele nu coincid';
        }
        
        if (empty($errors)) {
            try {
                $dsn = "mysql:host={$config['db_host']};port={$config['db_port']};dbname={$config['db_name']};charset=utf8mb4";
                $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);
                
                // Check if admin exists
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$admin_email]);
                if ($stmt->fetch()) {
                    $errors[] = 'Acest email este deja înregistrat';
                } else {
                    // Create admin
                    $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                        mt_rand(0, 0xffff),
                        mt_rand(0, 0x0fff) | 0x4000,
                        mt_rand(0, 0x3fff) | 0x8000,
                        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
                    );
                    $hash = password_hash($admin_pass, PASSWORD_BCRYPT, ['cost' => 12]);
                    $now = date('Y-m-d H:i:s');
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO users (id, email, password_hash, name, role, is_active, email_notifications, created_at, updated_at)
                        VALUES (?, ?, ?, ?, 'admin', 1, 1, ?, ?)
                    ");
                    $stmt->execute([$id, $admin_email, $hash, $admin_name, $now, $now]);
                    
                    // Create .env file
                    $env_content = "MYSQL_HOST={$config['db_host']}\n";
                    $env_content .= "MYSQL_PORT={$config['db_port']}\n";
                    $env_content .= "MYSQL_DATABASE={$config['db_name']}\n";
                    $env_content .= "MYSQL_USER={$config['db_user']}\n";
                    $env_content .= "MYSQL_PASSWORD={$config['db_pass']}\n";
                    $env_content .= "APP_URL=" . (isset($_SERVER['HTTPS']) ? 'https' : 'http') . "://{$_SERVER['HTTP_HOST']}\n";
                    
                    file_put_contents(dirname(__DIR__) . '/.env', $env_content);
                    
                    unset($_SESSION['install_config']);
                    
                    header('Location: install.php?step=3');
                    exit;
                }
            } catch (PDOException $e) {
                $errors[] = 'Eroare la crearea contului: ' . $e->getMessage();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalare Portal Dosare</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #1e3a5f 0%, #0f1f33 100%); min-height: 100vh; }
        .install-card { max-width: 500px; margin: 50px auto; }
        .step-indicator { display: flex; justify-content: center; gap: 10px; margin-bottom: 30px; }
        .step { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                background: #e9ecef; color: #6c757d; font-weight: bold; }
        .step.active { background: #0d6efd; color: white; }
        .step.done { background: #198754; color: white; }
    </style>
</head>
<body class="d-flex align-items-center">
    <div class="container">
        <div class="install-card">
            <div class="text-center text-white mb-4">
                <i class="bi bi-briefcase fs-1"></i>
                <h2 class="mt-2">Portal Dosare</h2>
                <p class="text-white-50">Instalare aplicație</p>
            </div>
            
            <div class="step-indicator">
                <div class="step <?= $step >= 1 ? ($step > 1 ? 'done' : 'active') : '' ?>">1</div>
                <div class="step <?= $step >= 2 ? ($step > 2 ? 'done' : 'active') : '' ?>">2</div>
                <div class="step <?= $step >= 3 ? 'done' : '' ?>">3</div>
            </div>
            
            <div class="card shadow">
                <div class="card-body p-4">
                    <?php if (!empty($errors)): ?>
                        <div class="alert alert-danger">
                            <?php foreach ($errors as $error): ?>
                                <div><?= htmlspecialchars($error) ?></div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                    
                    <?php if ($step === 1): ?>
                        <h5 class="card-title mb-4"><i class="bi bi-database me-2"></i>Configurare Baza de Date</h5>
                        <form method="POST">
                            <div class="mb-3">
                                <label class="form-label">Host MySQL</label>
                                <input type="text" name="db_host" class="form-control" value="localhost" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Port</label>
                                <input type="text" name="db_port" class="form-control" value="3306" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Nume Bază de Date</label>
                                <input type="text" name="db_name" class="form-control" value="portal_dosare" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Utilizator MySQL</label>
                                <input type="text" name="db_user" class="form-control" value="root" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Parolă MySQL</label>
                                <input type="password" name="db_pass" class="form-control">
                            </div>
                            <button type="submit" class="btn btn-primary w-100">
                                <i class="bi bi-arrow-right me-2"></i>Continuă
                            </button>
                        </form>
                    <?php elseif ($step === 2): ?>
                        <h5 class="card-title mb-4"><i class="bi bi-person-gear me-2"></i>Creare Cont Administrator</h5>
                        <form method="POST">
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" name="admin_email" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Nume</label>
                                <input type="text" name="admin_name" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Parolă</label>
                                <input type="password" name="admin_pass" class="form-control" minlength="6" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Confirmă Parola</label>
                                <input type="password" name="admin_pass_confirm" class="form-control" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">
                                <i class="bi bi-check-lg me-2"></i>Finalizează Instalarea
                            </button>
                        </form>
                    <?php else: ?>
                        <div class="text-center py-4">
                            <i class="bi bi-check-circle text-success fs-1"></i>
                            <h5 class="mt-3">Instalare Completă!</h5>
                            <p class="text-muted">Aplicația a fost instalată cu succes.</p>
                            <a href="../pages/index.php" class="btn btn-success">
                                <i class="bi bi-house me-2"></i>Accesează Aplicația
                            </a>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
