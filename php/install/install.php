<?php
/**
 * Portal Dosare - Script de Instalare
 * Acest script verifică cerințele și configurează baza de date
 */

session_start();

// Verifică dacă aplicația este deja instalată
$config_file = dirname(__DIR__) . '/includes/config.php';
$already_installed = false;

try {
    if (file_exists($config_file)) {
        require_once $config_file;
        require_once dirname(__DIR__) . '/includes/db.php';
        $pdo = db();
        $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() > 0) {
            $already_installed = true;
        }
    }
} catch (Exception $e) {
    // Baza de date nu este configurată corect
}

// Procesare formular
$error = null;
$success = null;
$step = $_GET['step'] ?? 1;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    
    if ($_POST['action'] === 'test_connection') {
        // Test conexiune
        $host = $_POST['db_host'] ?? 'localhost';
        $port = $_POST['db_port'] ?? '3306';
        $name = $_POST['db_name'] ?? '';
        $user = $_POST['db_user'] ?? '';
        $pass = $_POST['db_pass'] ?? '';
        
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            $success = "Conexiunea la baza de date a reușit!";
            $_SESSION['db_config'] = compact('host', 'port', 'name', 'user', 'pass');
        } catch (PDOException $e) {
            $error = "Eroare conexiune: " . $e->getMessage();
        }
    }
    
    if ($_POST['action'] === 'run_schema') {
        // Rulează schema SQL
        $config = $_SESSION['db_config'] ?? null;
        if (!$config) {
            $error = "Trebuie să testezi conexiunea mai întâi!";
        } else {
            try {
                $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['name']};charset=utf8mb4";
                $pdo = new PDO($dsn, $config['user'], $config['pass'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);
                
                // Citește și execută schema
                $schema_file = __DIR__ . '/schema.sql';
                if (!file_exists($schema_file)) {
                    $schema_file = dirname(__DIR__) . '/sql/init.sql';
                }
                
                if (!file_exists($schema_file)) {
                    throw new Exception("Fișierul schema SQL nu a fost găsit!");
                }
                
                $sql = file_get_contents($schema_file);
                $pdo->exec($sql);
                
                $success = "Schema bazei de date a fost creată cu succes!";
                $step = 3;
            } catch (Exception $e) {
                $error = "Eroare la crearea schemei: " . $e->getMessage();
            }
        }
    }
    
    if ($_POST['action'] === 'create_admin') {
        // Creează utilizatorul admin
        $config = $_SESSION['db_config'] ?? null;
        $admin_email = $_POST['admin_email'] ?? '';
        $admin_name = $_POST['admin_name'] ?? '';
        $admin_pass = $_POST['admin_pass'] ?? '';
        
        if (!$config) {
            $error = "Configurația bazei de date nu este disponibilă!";
        } elseif (empty($admin_email) || empty($admin_name) || empty($admin_pass)) {
            $error = "Toate câmpurile sunt obligatorii!";
        } elseif (strlen($admin_pass) < 6) {
            $error = "Parola trebuie să aibă cel puțin 6 caractere!";
        } else {
            try {
                $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['name']};charset=utf8mb4";
                $pdo = new PDO($dsn, $config['user'], $config['pass'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);
                
                // Generează UUID
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
                
                $success = "Instalare completă! Contul admin a fost creat.";
                $step = 4;
                unset($_SESSION['db_config']);
            } catch (Exception $e) {
                $error = "Eroare la crearea administratorului: " . $e->getMessage();
            }
        }
    }
}

// Verificare cerințe sistem
function check_requirements() {
    $requirements = [];
    
    $requirements['php_version'] = [
        'name' => 'PHP >= 7.4',
        'status' => version_compare(PHP_VERSION, '7.4.0', '>='),
        'current' => PHP_VERSION
    ];
    
    $requirements['pdo_mysql'] = [
        'name' => 'Extensie PDO MySQL',
        'status' => extension_loaded('pdo_mysql'),
        'current' => extension_loaded('pdo_mysql') ? 'Instalată' : 'Lipsă'
    ];
    
    $requirements['soap'] = [
        'name' => 'Extensie SOAP',
        'status' => extension_loaded('soap'),
        'current' => extension_loaded('soap') ? 'Instalată' : 'Lipsă (opțional)'
    ];
    
    $requirements['json'] = [
        'name' => 'Extensie JSON',
        'status' => extension_loaded('json'),
        'current' => extension_loaded('json') ? 'Instalată' : 'Lipsă'
    ];
    
    $requirements['mbstring'] = [
        'name' => 'Extensie mbstring',
        'status' => extension_loaded('mbstring'),
        'current' => extension_loaded('mbstring') ? 'Instalată' : 'Lipsă'
    ];
    
    return $requirements;
}

$requirements = check_requirements();
$all_ok = !in_array(false, array_column($requirements, 'status'));
?>
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Dosare - Instalare</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .install-card { max-width: 700px; margin: 30px auto; }
        .step-indicator { display: flex; justify-content: center; margin-bottom: 30px; }
        .step { width: 40px; height: 40px; border-radius: 50%; background: #e9ecef; 
                display: flex; align-items: center; justify-content: center; margin: 0 10px;
                font-weight: bold; color: #6c757d; }
        .step.active { background: #0d6efd; color: white; }
        .step.done { background: #198754; color: white; }
    </style>
</head>
<body>
    <div class="container py-4">
        <div class="card install-card shadow-lg">
            <div class="card-header bg-primary text-white text-center py-4">
                <i class="bi bi-briefcase fs-1"></i>
                <h3 class="mb-0 mt-2">Portal Dosare - Instalare</h3>
            </div>
            
            <div class="card-body p-4">
                <?php if ($already_installed): ?>
                    <div class="alert alert-success text-center">
                        <i class="bi bi-check-circle fs-1 d-block mb-2"></i>
                        <strong>Aplicația este deja instalată!</strong>
                        <p class="mb-3">Baza de date este configurată și funcțională.</p>
                        <a href="../pages/index.php" class="btn btn-success">
                            <i class="bi bi-house me-2"></i>Mergi la Aplicație
                        </a>
                    </div>
                <?php else: ?>
                
                <!-- Step Indicator -->
                <div class="step-indicator">
                    <div class="step <?= $step >= 1 ? ($step > 1 ? 'done' : 'active') : '' ?>">1</div>
                    <div class="step <?= $step >= 2 ? ($step > 2 ? 'done' : 'active') : '' ?>">2</div>
                    <div class="step <?= $step >= 3 ? ($step > 3 ? 'done' : 'active') : '' ?>">3</div>
                    <div class="step <?= $step >= 4 ? 'done' : '' ?>">4</div>
                </div>
                
                <?php if ($error): ?>
                    <div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>
                
                <?php if ($success): ?>
                    <div class="alert alert-success"><i class="bi bi-check-circle me-2"></i><?= htmlspecialchars($success) ?></div>
                <?php endif; ?>
                
                <?php if ($step == 1): ?>
                <!-- STEP 1: Verificare Cerințe -->
                <h5 class="mb-3"><i class="bi bi-check2-square me-2"></i>Pasul 1: Verificare Cerințe Sistem</h5>
                <table class="table">
                    <thead><tr><th>Cerință</th><th>Status</th><th>Valoare</th></tr></thead>
                    <tbody>
                    <?php foreach ($requirements as $req): ?>
                        <tr>
                            <td><?= $req['name'] ?></td>
                            <td>
                                <?php if ($req['status']): ?>
                                    <span class="badge bg-success"><i class="bi bi-check"></i> OK</span>
                                <?php else: ?>
                                    <span class="badge bg-danger"><i class="bi bi-x"></i> Lipsă</span>
                                <?php endif; ?>
                            </td>
                            <td><code><?= $req['current'] ?></code></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
                <div class="text-end">
                    <a href="?step=2" class="btn btn-primary <?= $all_ok ? '' : 'disabled' ?>">
                        Continuă <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
                
                <?php elseif ($step == 2): ?>
                <!-- STEP 2: Configurare Bază de Date -->
                <h5 class="mb-3"><i class="bi bi-database me-2"></i>Pasul 2: Configurare Bază de Date</h5>
                <form method="POST">
                    <input type="hidden" name="action" value="test_connection">
                    <div class="row g-3">
                        <div class="col-md-8">
                            <label class="form-label">Host MySQL</label>
                            <input type="text" name="db_host" class="form-control" value="localhost" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Port</label>
                            <input type="text" name="db_port" class="form-control" value="3306" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Nume Bază de Date</label>
                            <input type="text" name="db_name" class="form-control" value="portal_dosare" required>
                            <small class="text-muted">Baza de date trebuie să existe deja!</small>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Utilizator MySQL</label>
                            <input type="text" name="db_user" class="form-control" value="root" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Parolă MySQL</label>
                            <input type="password" name="db_pass" class="form-control">
                        </div>
                    </div>
                    <div class="d-flex justify-content-between mt-4">
                        <a href="?step=1" class="btn btn-outline-secondary"><i class="bi bi-arrow-left"></i> Înapoi</a>
                        <button type="submit" class="btn btn-primary">Testează Conexiunea</button>
                    </div>
                </form>
                
                <?php if (isset($_SESSION['db_config'])): ?>
                <hr class="my-4">
                <form method="POST">
                    <input type="hidden" name="action" value="run_schema">
                    <button type="submit" class="btn btn-success btn-lg w-100">
                        <i class="bi bi-database-add me-2"></i>Creează Tabelele
                    </button>
                </form>
                <?php endif; ?>
                
                <?php elseif ($step == 3): ?>
                <!-- STEP 3: Creare Administrator -->
                <h5 class="mb-3"><i class="bi bi-person-badge me-2"></i>Pasul 3: Creare Cont Administrator</h5>
                <form method="POST">
                    <input type="hidden" name="action" value="create_admin">
                    <div class="mb-3">
                        <label class="form-label">Nume Complet</label>
                        <input type="text" name="admin_name" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" name="admin_email" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Parolă</label>
                        <input type="password" name="admin_pass" class="form-control" minlength="6" required>
                        <small class="text-muted">Minim 6 caractere</small>
                    </div>
                    <button type="submit" class="btn btn-success btn-lg w-100">
                        <i class="bi bi-check-lg me-2"></i>Finalizează Instalarea
                    </button>
                </form>
                
                <?php elseif ($step == 4): ?>
                <!-- STEP 4: Finalizat -->
                <div class="text-center">
                    <i class="bi bi-check-circle text-success" style="font-size: 80px;"></i>
                    <h4 class="mt-3 text-success">Instalare Completă!</h4>
                    <p class="text-muted">Aplicația Portal Dosare este acum configurată și gata de utilizare.</p>
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>Important:</strong> Șterge sau protejează acest director <code>/install</code> din motive de securitate!
                    </div>
                    <a href="../pages/index.php" class="btn btn-primary btn-lg">
                        <i class="bi bi-house me-2"></i>Mergi la Aplicație
                    </a>
                </div>
                <?php endif; ?>
                
                <?php endif; ?>
            </div>
        </div>
    </div>
</body>
</html>
