<?php
/**
 * Portal Dosare - Pagina de Căutare
 */

$page_title = 'Căutare Dosare';
require_once dirname(__DIR__) . '/includes/header.php';
require_once APP_ROOT . '/includes/db.php';
require_once APP_ROOT . '/includes/functions.php';

// Get search query
$query = trim($_GET['q'] ?? '');
$results = [];
$error = null;

// Process search if query exists
if (!empty($query)) {
    try {
        // Split by newlines or commas for bulk search
        $terms = preg_split('/[\r\n,]+/', $query);
        $terms = array_filter(array_map('trim', $terms));
        
        if (!empty($terms)) {
            $search_result = universal_search($terms, 1, 50);
            $results = $search_result['rows'] ?? [];
        }
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

// Get institutions list for dropdown
$institutii = get_institutii_list();
?>

<div class="container py-4">
    <div class="row mb-4">
        <div class="col-12">
            <h2 class="mb-3">
                <i class="bi bi-search me-2" style="color: var(--pd-primary)"></i>
                Căutare Dosare
            </h2>
            <p class="text-muted">
                Caută după număr dosar (ex: 123/45/2024) sau nume parte. 
                Poți introduce mai mulți termeni, separați prin virgulă sau pe linii separate.
            </p>
        </div>
    </div>
    
    <!-- Search Form -->
    <div class="card mb-4">
        <div class="card-body">
            <form method="GET" action="" class="needs-validation" novalidate>
                <div class="row g-3">
                    <div class="col-md-9">
                        <label for="search-input" class="form-label">Termen de căutare</label>
                        <textarea 
                            name="q" 
                            id="search-input" 
                            class="form-control" 
                            rows="3" 
                            placeholder="Introdu număr dosar sau nume parte...&#10;Poți adăuga mai mulți termeni, câte unul pe linie"
                            required
                        ><?= h($query) ?></textarea>
                        <small class="text-muted">Maxim 50 de termeni per căutare</small>
                    </div>
                    <div class="col-md-3">
                        <label for="institutie" class="form-label">Instanță (opțional)</label>
                        <select name="institutie" id="institutie" class="form-select">
                            <option value="">Toate instanțele</option>
                            <?php foreach ($institutii as $inst): ?>
                            <option value="<?= h($inst['key']) ?>">
                                <?= h($inst['name']) ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                        <div class="mt-3">
                            <button type="submit" class="btn btn-primary w-100">
                                <i class="bi bi-search me-2"></i>Caută
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
    
    <?php if ($error): ?>
    <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <?= h($error) ?>
    </div>
    <?php endif; ?>
    
    <?php if (!empty($query) && empty($error)): ?>
    <!-- Results -->
    <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <span>
                <i class="bi bi-list-ul me-2"></i>
                Rezultate căutare: <strong><?= count($results) ?></strong> înregistrări
            </span>
            <?php if (!empty($results)): ?>
            <button class="btn btn-sm btn-outline-primary" onclick="exportTableToCSV('results-table', 'dosare_export.csv')">
                <i class="bi bi-download me-1"></i>Export CSV
            </button>
            <?php endif; ?>
        </div>
        <div class="card-body p-0">
            <?php if (empty($results)): ?>
            <div class="text-center py-5">
                <i class="bi bi-inbox fs-1 text-muted"></i>
                <p class="text-muted mt-3">Niciun rezultat găsit pentru "<?= h($query) ?>"</p>
            </div>
            <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover search-results-table mb-0" id="results-table">
                    <thead>
                        <tr>
                            <th>Termen</th>
                            <th>Tip</th>
                            <th>Număr Dosar</th>
                            <th>Instanță</th>
                            <th>Obiect</th>
                            <th>Stadiu</th>
                            <th>Data</th>
                            <th>Observații</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($results as $row): ?>
                        <tr>
                            <td><?= h($row['termen_cautare']) ?></td>
                            <td>
                                <span class="badge bg-<?= $row['tip_detectat'] === 'Număr dosar' ? 'primary' : 'secondary' ?>">
                                    <?= h($row['tip_detectat']) ?>
                                </span>
                            </td>
                            <td>
                                <?php if (!empty($row['numar_dosar'])): ?>
                                <a href="case_details.php?numar=<?= urlencode($row['numar_dosar']) ?>" class="dosar-link">
                                    <?= h($row['numar_dosar']) ?>
                                </a>
                                <?php else: ?>
                                <span class="text-muted">-</span>
                                <?php endif; ?>
                            </td>
                            <td><?= h($row['instanta'] ?: '-') ?></td>
                            <td title="<?= h($row['obiect']) ?>">
                                <?= h(mb_substr($row['obiect'] ?: '-', 0, 40)) ?><?= mb_strlen($row['obiect'] ?? '') > 40 ? '...' : '' ?>
                            </td>
                            <td><?= h($row['stadiu_procesual'] ?: '-') ?></td>
                            <td><?= h($row['data'] ?: '-') ?></td>
                            <td>
                                <?php if (!empty($row['observatii'])): ?>
                                <span class="text-warning">
                                    <i class="bi bi-exclamation-circle me-1"></i>
                                    <?= h($row['observatii']) ?>
                                </span>
                                <?php else: ?>
                                <span class="text-success"><i class="bi bi-check-circle"></i></span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>
</div>

<?php require_once dirname(__DIR__) . '/includes/footer.php'; ?>
