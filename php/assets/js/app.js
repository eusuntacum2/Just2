/**
 * Portal Dosare - JavaScript
 */

// Theme Management
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('pd_theme') || 'light';
        this.setTheme(savedTheme);
        
        document.querySelectorAll('[data-toggle-theme]').forEach(el => {
            el.addEventListener('click', () => this.toggleTheme());
        });
    },
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('pd_theme', theme);
        
        // Update icons
        document.querySelectorAll('.theme-icon-light').forEach(el => {
            el.style.display = theme === 'dark' ? 'inline' : 'none';
        });
        document.querySelectorAll('.theme-icon-dark').forEach(el => {
            el.style.display = theme === 'light' ? 'inline' : 'none';
        });
    },
    
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        this.setTheme(current === 'light' ? 'dark' : 'light');
    }
};

// Toast Notifications
const Toast = {
    container: null,
    
    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        this.container.style.zIndex = '1050';
        document.body.appendChild(this.container);
    },
    
    show(message, type = 'info', duration = 4000) {
        if (!this.container) this.init();
        
        const iconMap = {
            success: 'bi-check-circle-fill text-success',
            error: 'bi-exclamation-circle-fill text-danger',
            warning: 'bi-exclamation-triangle-fill text-warning',
            info: 'bi-info-circle-fill text-info'
        };
        
        const toastEl = document.createElement('div');
        toastEl.className = 'toast show';
        toastEl.setAttribute('role', 'alert');
        toastEl.innerHTML = `
            <div class="toast-body d-flex align-items-center gap-2">
                <i class="bi ${iconMap[type] || iconMap.info}"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        this.container.appendChild(toastEl);
        
        // Auto remove
        setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.remove(), 300);
        }, duration);
        
        // Manual close
        toastEl.querySelector('.btn-close').addEventListener('click', () => {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.remove(), 300);
        });
    },
    
    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

// API Helper
const API = {
    async request(url, options = {}) {
        const defaults = {
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        
        const config = { ...defaults, ...options };
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Eroare necunoscută');
            }
            
            return data;
        } catch (error) {
            Toast.error(error.message);
            throw error;
        }
    },
    
    get(url) {
        return this.request(url, { method: 'GET' });
    },
    
    post(url, body) {
        return this.request(url, { method: 'POST', body });
    },
    
    delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
};

// Search Page
const SearchPage = {
    init() {
        const searchForm = document.getElementById('searchForm');
        const searchBtn = document.getElementById('searchBtn');
        const resultsContainer = document.getElementById('searchResults');
        
        if (!searchForm) return;
        
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.doSearch();
        });
        
        // Export buttons
        document.querySelectorAll('[data-export]').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.export;
                this.exportResults(format);
            });
        });
    },
    
    async doSearch(page = 1) {
        const textarea = document.getElementById('searchTerms');
        const terms = textarea.value.split('\n').map(t => t.trim()).filter(t => t);
        
        if (terms.length === 0) {
            Toast.error('Introduceți cel puțin un termen de căutare');
            return;
        }
        
        const searchBtn = document.getElementById('searchBtn');
        const resultsContainer = document.getElementById('searchResults');
        
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<span class="loading-spinner me-2"></span>Se caută...';
        
        try {
            const response = await API.post('/php/api/search.php', {
                termeni: terms,
                page: page,
                page_size: 20
            });
            
            this.renderResults(response, terms);
            
            if (response.total_count === 0) {
                Toast.info('Nu s-au găsit rezultate');
            } else {
                Toast.success(`${response.total_count} dosar(e) găsit(e)`);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="bi bi-search me-2"></i>Caută';
        }
    },
    
    renderResults(data, terms) {
        const container = document.getElementById('searchResults');
        if (!container) return;
        
        if (!data.rows || data.rows.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="bi bi-search"></i></div>
                    <h5>Niciun rezultat</h5>
                    <p class="text-muted">Încearcă alți termeni de căutare.</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">
                    Rezultate <span class="text-muted fw-normal">(${data.total_count} dosar${data.total_count !== 1 ? 'e' : ''})</span>
                </h5>
                <small class="text-muted">Pag. ${data.page}/${data.total_pages}</small>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-compact mb-0">
                    <thead>
                        <tr>
                            <th>Termen</th>
                            <th>Tip</th>
                            <th>Nr. Dosar</th>
                            <th>Instanță</th>
                            <th>Obiect</th>
                            <th>Stadiu</th>
                            <th>Data</th>
                            <th>Modif.</th>
                            <th>Parte</th>
                            <th>Observații</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.rows.forEach(row => {
            const tipBadge = row.tip_detectat === 'Număr dosar' 
                ? '<span class="badge-dosar">Dosar</span>'
                : '<span class="badge-parte">Parte</span>';
            
            const dosarLink = row.numar_dosar 
                ? `<a href="case-details.php?numar=${encodeURIComponent(row.numar_dosar)}" class="dosar-link">${row.numar_dosar}</a>`
                : '-';
            
            html += `
                <tr>
                    <td class="text-truncate" style="max-width:100px" title="${row.termen_cautare}">${row.termen_cautare}</td>
                    <td>${tipBadge}</td>
                    <td class="font-monospace">${dosarLink}</td>
                    <td class="text-truncate" style="max-width:150px" title="${row.instanta}">${row.instanta || '-'}</td>
                    <td class="text-truncate" style="max-width:150px" title="${row.obiect}">${row.obiect || '-'}</td>
                    <td>${row.stadiu_procesual || '-'}</td>
                    <td class="font-monospace">${row.data || '-'}</td>
                    <td class="font-monospace">${row.ultima_modificare || '-'}</td>
                    <td class="text-truncate" style="max-width:120px" title="${row.nume_parte}">${row.nume_parte || '-'}</td>
                    <td class="text-muted fst-italic">${row.observatii || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        
        // Pagination
        if (data.total_pages > 1) {
            html += this.renderPagination(data);
        }
        
        container.innerHTML = html;
        
        // Store terms for pagination
        this.currentTerms = terms;
        
        // Bind pagination events
        container.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.doSearch(parseInt(btn.dataset.page));
            });
        });
    },
    
    renderPagination(data) {
        let html = '<nav class="d-flex justify-content-center mt-3"><ul class="pagination pagination-sm mb-0">';
        
        // Previous
        html += `
            <li class="page-item ${data.page <= 1 ? 'disabled' : ''}">
                <button class="page-link" data-page="${data.page - 1}">
                    <i class="bi bi-chevron-left"></i>
                </button>
            </li>
        `;
        
        // Page numbers
        let startPage = Math.max(1, data.page - 2);
        let endPage = Math.min(data.total_pages, startPage + 4);
        startPage = Math.max(1, endPage - 4);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === data.page ? 'active' : ''}">
                    <button class="page-link" data-page="${i}">${i}</button>
                </li>
            `;
        }
        
        // Next
        html += `
            <li class="page-item ${data.page >= data.total_pages ? 'disabled' : ''}">
                <button class="page-link" data-page="${data.page + 1}">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </li>
        `;
        
        html += '</ul></nav>';
        return html;
    },
    
    exportResults(format) {
        const textarea = document.getElementById('searchTerms');
        const terms = textarea.value.split('\n').map(t => t.trim()).filter(t => t);
        
        if (terms.length === 0) {
            Toast.error('Introduceți termeni de căutare înainte de export');
            return;
        }
        
        // Create form and submit
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/php/api/export.php?format=${format}`;
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'termeni';
        input.value = JSON.stringify(terms);
        form.appendChild(input);
        
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        Toast.success(`Export ${format.toUpperCase()} în curs...`);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    Toast.init();
    SearchPage.init();
});
