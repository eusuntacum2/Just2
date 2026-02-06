<?php
/**
 * Public Search Page
 */

$page_title = 'Căutare Dosare';
require_once dirname(__DIR__) . '/includes/header.php';

// Handle quick search from landing page
$initial_query = isset($_GET['q']) ? trim($_GET['q']) : '';
?>

<div class="container py-4">
    <!-- Page Header -->
    <div class="page-header text-center">
        <h1>Căutare Dosare</h1>
        <p>Căutare după număr dosar sau nume parte • Suportă diacritice (Iasi = IAȘI)</p>
    </div>
    
    <!-- Search Form -->
    <div class="card mb-4">
        <div class="card-body p-4">
            <form id="searchForm">
                <div class="mb-3">
                    <label class="form-label fw-medium">Termeni de căutare (unul pe linie)</label>
                    <textarea 
                        id="searchTerms" 
                        class="form-control font-monospace" 
                        rows="4" 
                        placeholder="8893/99/2009&#10;Popescu Ion"
                    ><?= h($initial_query) ?></textarea>
                    <div class="form-text">
                        Introduceți numere de dosare (format: 123/45/2024) sau nume părți, câte unul pe linie.
                    </div>
                </div>
                
                <div class="d-flex flex-wrap gap-2 align-items-center">
                    <button type="submit" id="searchBtn" class="btn btn-primary">
                        <i class="bi bi-search me-2"></i>Caută
                    </button>
                    
                    <div class="ms-auto d-flex gap-1">
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-export="xlsx" title="Export Excel">
                            <i class="bi bi-file-earmark-excel"></i>
                            <span class="d-none d-sm-inline ms-1">Excel</span>
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-export="csv" title="Export CSV">
                            <i class="bi bi-file-earmark-text"></i>
                            <span class="d-none d-sm-inline ms-1">CSV</span>
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-export="txt" title="Export TXT">
                            <i class="bi bi-file-text"></i>
                            <span class="d-none d-sm-inline ms-1">TXT</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Results Container -->
    <div id="searchResults">
        <div class="empty-state">
            <div class="empty-icon">
                <i class="bi bi-search"></i>
            </div>
            <h5>Caută dosare</h5>
            <p class="text-muted">
                Introdu numere de dosar (123/45/2024) sau nume părți pentru a căuta în instanțe.
            </p>
        </div>
    </div>
</div>

<?php if ($initial_query): ?>
<script>
// Auto-search if query provided
document.addEventListener('DOMContentLoaded', () => {
    SearchPage.doSearch();
});
</script>
<?php endif; ?>

<?php require_once dirname(__DIR__) . '/includes/footer.php'; ?>
