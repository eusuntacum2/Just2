<?php
/**
 * Registration Page
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
    $name = trim($_POST['name'] ?? '');
    $password = $_POST['password'] ?? '';
    $password_confirm = $_POST['password_confirm'] ?? '';
    
    // Validation
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Email invalid';
    }
    if (empty($name) || strlen($name) < 2) {
        $errors[] = 'Numele trebuie să aibă minim 2 caractere';
    }
    if (strlen($password) < 6) {
        $errors[] = 'Parola trebuie să aibă minim 6 caractere';
    }
    if ($password !== $password_confirm) {
        $errors[] = 'Parolele nu coincid';
    }
    
    // Check if email exists
    if (empty($errors)) {
        $existing = find_user_by_email($email);
        if ($existing) {
            $errors[] = 'Acest email este deja înregistrat';
        }
    }
    
    // Create user
    if (empty($errors)) {
        // First user is admin
        $user_count = count_users();
        $role = $user_count === 0 ? 'admin' : 'user';
        
        $user_id = create_user($email, $password, $name, $role);
        
        // Auto login
        $_SESSION['user_id'] = $user_id;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_role'] = $role;
        
        set_flash('success', 'Cont creat cu succes! Bine ai venit, ' . $name . '!');
        header('Location: dashboard.php');
        exit;
    }
}

$page_title = 'Înregistrare';
require_once dirname(__DIR__) . '/includes/header.php';
?>

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-5 col-lg-4">
            <div class="text-center mb-4">
                <i class="bi bi-briefcase fs-1" style="color: var(--pd-primary)"></i>
                <h2 class="mt-2">Portal Dosare</h2>
                <p class="text-muted">Creează un cont nou</p>
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
                            <label class="form-label">Nume</label>
                            <input type="text" name="name" class="form-control" 
                                   value="<?= h($_POST['name'] ?? '') ?>" required autofocus>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" class="form-control" 
                                   value="<?= h($_POST['email'] ?? '') ?>" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Parolă</label>
                            <input type="password" name="password" class="form-control" 
                                   minlength="6" required>
                            <div class="form-text">Minim 6 caractere</div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Confirmă Parola</label>
                            <input type="password" name="password_confirm" class="form-control" required>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="bi bi-person-plus me-2"></i>Înregistrare
                        </button>
                    </form>
                    
                    <hr class="my-4">
                    
                    <p class="text-center text-muted mb-0">
                        Ai deja cont? <a href="login.php">Autentifică-te</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once dirname(__DIR__) . '/includes/footer.php'; ?>
