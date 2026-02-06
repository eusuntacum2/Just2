<?php
/**
 * Landing Page - Portal Dosare
 */

$page_title = 'Acasă';
require_once dirname(__DIR__) . '/includes/header.php';
?>

<div class="container py-5">
    <!-- Hero Section -->
    <div class="row align-items-center py-5">
        <div class="col-lg-6 mb-4 mb-lg-0">
            <h1 class="display-4 fw-bold mb-3" style="color: var(--pd-primary)">
                Căutare și Monitorizare Dosare
            </h1>
            <p class="lead text-muted mb-4">
                Accesează rapid informații despre dosarele din instanțele din România. 
                Căutare după număr dosar sau nume parte, cu suport pentru diacritice.
            </p>
            <div class="d-flex gap-3 flex-wrap">
                <a href="search.php" class="btn btn-primary btn-lg">
                    <i class="bi bi-search me-2"></i>Caută Dosare
                </a>
                <?php if (!is_logged_in()): ?>
                <a href="register.php" class="btn btn-outline-primary btn-lg">
                    Creează Cont
                </a>
                <?php else: ?>
                <a href="dashboard.php" class="btn btn-outline-primary btn-lg">
                    Dashboard
                </a>
                <?php endif; ?>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="card shadow-lg border-0">
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <i class="bi bi-briefcase fs-1" style="color: var(--pd-primary)"></i>
                    </div>
                    <h5 class="text-center mb-4">Căutare Rapidă</h5>
                    <form action="search.php" method="GET">
                        <div class="mb-3">
                            <input type="text" name="q" class="form-control form-control-lg" 
                                   placeholder="Număr dosar (ex: 123/45/2024) sau nume parte">
                        </div>
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="bi bi-search me-2"></i>Caută
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Features -->
    <div class="row g-4 py-5">
        <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
                <div class="card-body text-center p-4">
                    <div class="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" 
                         style="width: 64px; height: 64px;">
                        <i class="bi bi-search fs-4 text-primary"></i>
                    </div>
                    <h5>Căutare Universală</h5>
                    <p class="text-muted mb-0">
                        Caută după număr dosar sau nume parte în toate instanțele din România. 
                        Suport pentru diacritice (Iasi = IAȘI).
                    </p>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
                <div class="card-body text-center p-4">
                    <div class="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" 
                         style="width: 64px; height: 64px;">
                        <i class="bi bi-bookmark fs-4 text-success"></i>
                    </div>
                    <h5>Monitorizare</h5>
                    <p class="text-muted mb-0">
                        Adaugă dosarele importante la lista de monitorizare și primește 
                        notificări când apar actualizări.
                    </p>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
                <div class="card-body text-center p-4">
                    <div class="rounded-circle bg-warning bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" 
                         style="width: 64px; height: 64px;">
                        <i class="bi bi-download fs-4 text-warning"></i>
                    </div>
                    <h5>Export Date</h5>
                    <p class="text-muted mb-0">
                        Descarcă rezultatele căutării în format Excel, CSV sau TXT 
                        pentru analiză ulterioară.
                    </p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Stats -->
    <div class="row g-4 py-4">
        <div class="col-6 col-md-3">
            <div class="card stat-card h-100">
                <div class="stat-icon bg-primary bg-opacity-10">
                    <i class="bi bi-building text-primary"></i>
                </div>
                <div class="stat-value">242</div>
                <div class="stat-label">Instanțe</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card stat-card h-100">
                <div class="stat-icon bg-success bg-opacity-10">
                    <i class="bi bi-lightning text-success"></i>
                </div>
                <div class="stat-value">Live</div>
                <div class="stat-label">Date în timp real</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card stat-card h-100">
                <div class="stat-icon bg-info bg-opacity-10">
                    <i class="bi bi-shield-check text-info"></i>
                </div>
                <div class="stat-value">100%</div>
                <div class="stat-label">Gratuit</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card stat-card h-100">
                <div class="stat-icon bg-warning bg-opacity-10">
                    <i class="bi bi-phone text-warning"></i>
                </div>
                <div class="stat-value">24/7</div>
                <div class="stat-label">Disponibil</div>
            </div>
        </div>
    </div>
</div>

<?php require_once dirname(__DIR__) . '/includes/footer.php'; ?>
