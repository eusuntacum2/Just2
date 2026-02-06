<?php
/**
 * Login Page
 */

require_once dirname(__DIR__) . '/includes/config.php';
require_once dirname(__DIR__) . '/includes/db.php';

// Redirect if already logged in
if (is_logged_in()) {
    header('Location: dashboard.php');
    exit;
}

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        $errors[] = 'Completați toate câmpurile';
    } else {
        $user = find_user_by_email($email);
        
        if (!$user) {
            $errors[] = 'Email sau parolă incorectă';
        } elseif (!$user['is_active']) {
            $errors[] = 'Contul este dezactivat';
        } elseif (!verify_user_password($user, $password)) {
            $errors[] = 'Email sau parolă incorectă';
        } else {
            // Login successful
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
            
            set_flash('success', 'Bine ai venit, ' . $user['name'] . '!');
            
            // Redirect to intended page or dashboard
            $redirect = $_GET['redirect'] ?? 'dashboard.php';
            header('Location: ' . $redirect);
            exit;
        }
    }
}

$page_title = 'Autentificare';
require_once dirname(__DIR__) . '/includes/header.php';
?>

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-5 col-lg-4">
            <div class="text-center mb-4">
                <i class="bi bi-briefcase fs-1" style="color: var(--pd-primary)"></i>
                <h2 class="mt-2">Portal Dosare</h2>
                <p class="text-muted">Autentifică-te în cont</p>
            </div>
            
            <div class="card shadow-sm">
                <div class="card-body p-4">
                    <?php if (!empty($errors)): ?>
                    <div class="alert alert-danger">
                        <?php foreach ($errors as $error): ?>
                            <div><?= h($error) ?></div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                    
                    <form method="POST">
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" class="form-control" 
                                   value="<?= h($_POST['email'] ?? '') ?>" required autofocus>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Parolă</label>
                            <input type="password" name="password" class="form-control" required>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="bi bi-box-arrow-in-right me-2"></i>Autentificare
                        </button>
                    </form>
                    
                    <hr class="my-4">
                    
                    <p class="text-center text-muted mb-0">
                        Nu ai cont? <a href="register.php">Înregistrează-te</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once dirname(__DIR__) . '/includes/footer.php'; ?>
