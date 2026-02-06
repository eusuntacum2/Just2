<?php
/**
 * Portal Dosare just.ro - Entry Point
 * Redirecționează către pagina principală
 */

// Verificare configurație și bază de date
try {
    require_once __DIR__ . '/includes/config.php';
    require_once __DIR__ . '/includes/db.php';
    
    // Testează conexiunea la baza de date
    $pdo = db();
    
    // Redirecționare către pagina principală
    header('Location: pages/index.php');
    exit;
    
} catch (Exception $e) {
    // Afișează pagina de eroare/instalare
    ?>
    <!DOCTYPE html>
    <html lang="ro">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portal Dosare - Configurare</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
        <style>
            body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
            .setup-card { max-width: 600px; margin: 50px auto; }
        </style>
    </head>
    <body>
        <div class="container py-5">
            <div class="card setup-card shadow-lg">
                <div class="card-header bg-danger text-white text-center py-3">
                    <i class="bi bi-exclamation-triangle fs-1"></i>
                    <h4 class="mb-0 mt-2">Eroare la Conectare</h4>
                </div>
                <div class="card-body p-4">
                    <div class="alert alert-danger">
                        <strong>Eroare:</strong> <?= htmlspecialchars($e->getMessage()) ?>
                    </div>
                    
                    <h5 class="mb-3">Pași pentru rezolvare:</h5>
                    <ol class="mb-4">
                        <li class="mb-2">
                            <strong>Verifică configurația bazei de date</strong><br>
                            <small class="text-muted">Editează <code>includes/config.php</code> sau setează variabilele de mediu</small>
                        </li>
                        <li class="mb-2">
                            <strong>Creează baza de date</strong><br>
                            <small class="text-muted">Rulează scriptul SQL din <code>sql/init.sql</code></small>
                        </li>
                        <li class="mb-2">
                            <strong>Verifică credențialele</strong><br>
                            <small class="text-muted">Asigură-te că user-ul MySQL are drepturi pe baza de date</small>
                        </li>
                    </ol>
                    
                    <div class="d-grid gap-2">
                        <a href="install/install.php" class="btn btn-primary btn-lg">
                            <i class="bi bi-gear me-2"></i>Rulează Instalarea
                        </a>
                        <button onclick="location.reload()" class="btn btn-outline-secondary">
                            <i class="bi bi-arrow-clockwise me-2"></i>Reîncearcă
                        </button>
                    </div>
                </div>
                <div class="card-footer bg-light">
                    <h6 class="mb-2">Configurație curentă:</h6>
                    <code class="d-block p-2 bg-dark text-light rounded">
                        Host: <?= defined('DB_HOST') ? DB_HOST : 'nedefinit' ?><br>
                        Port: <?= defined('DB_PORT') ? DB_PORT : 'nedefinit' ?><br>
                        Database: <?= defined('DB_NAME') ? DB_NAME : 'nedefinit' ?><br>
                        User: <?= defined('DB_USER') ? DB_USER : 'nedefinit' ?>
                    </code>
                </div>
            </div>
        </div>
    </body>
    </html>
    <?php
}
