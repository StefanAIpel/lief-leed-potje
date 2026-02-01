// === Lief & Leed Potje - Admin Dashboard ===

let currentAanvragen = [];
let currentAmbassadeurs = [];
let budgetSettingsVisible = false;
let currentTab = 'dashboard';
let sortConfig = { field: 'datum', direction: 'desc' };
let ambSortConfig = { field: 'code', direction: 'asc' };

// Storage keys
const BUDGET_KEY = 'liefLeedBudget';
const PIN_KEY = 'liefLeedPin';
const AUTH_KEY = 'liefLeedAuth';

// Default PIN (wijzig in productie!)
const DEFAULT_PIN = '1234';

// === Authentication ===

function getStoredPin() {
    return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

function isAuthenticated() {
    const auth = sessionStorage.getItem(AUTH_KEY);
    return auth === 'true';
}

function login(pin) {
    const storedPin = getStoredPin();
    if (pin === storedPin) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.reload();
}

function changePin() {
    const newPin = document.getElementById('new-pin').value;
    if (!newPin || newPin.length < 4) {
        alert('PIN moet minimaal 4 cijfers zijn.');
        return;
    }
    if (!/^\d+$/.test(newPin)) {
        alert('PIN mag alleen cijfers bevatten.');
        return;
    }
    localStorage.setItem(PIN_KEY, newPin);
    document.getElementById('new-pin').value = '';
    alert('PIN succesvol gewijzigd!');
}

function initAuth() {
    const loginScreen = document.getElementById('login-screen');
    const adminContent = document.getElementById('admin-content');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    if (isAuthenticated()) {
        loginScreen.classList.add('hidden');
        adminContent.classList.remove('hidden');
        initAdmin();
    } else {
        loginScreen.classList.remove('hidden');
        adminContent.classList.add('hidden');
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const pin = document.getElementById('pin-input').value;
            
            if (login(pin)) {
                loginScreen.classList.add('hidden');
                adminContent.classList.remove('hidden');
                initAdmin();
            } else {
                loginError.classList.remove('hidden');
                document.getElementById('pin-input').value = '';
                document.getElementById('pin-input').focus();
            }
        });
    }
}

// === Budget Config ===

function getBudgetConfig() {
    const saved = localStorage.getItem(BUDGET_KEY);
    return saved ? JSON.parse(saved) : { jaarBudget: 5000 };
}

function saveBudgetConfig(config) {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(config));
}

// === Initialisatie ===

document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

function initAdmin() {
    initFilters();
    loadAanvragen();
    loadAmbassadeurs();
    updateBudgetDisplay();
    updateRecentAanvragen();
    
    // Load saved budget
    const budgetConfig = getBudgetConfig();
    document.getElementById('jaarbudget').value = budgetConfig.jaarBudget;
    
    // Escape sluit modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

// === Tab Navigation ===

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Refresh data for tab
    if (tabName === 'aanvragen') {
        filterAanvragen();
    } else if (tabName === 'ambassadeurs') {
        filterAmbassadeurs();
    } else if (tabName === 'dashboard') {
        updateBudgetDisplay();
        updateStats();
        updateRecentAanvragen();
    }
}

// === Filters ===

function initFilters() {
    // Vul straat filter met unieke straten uit ambassadeurs
    const straatSelect = document.getElementById('filter-straat');
    const straten = [...new Set(window.LiefLeed.straatambassadeurs.map(a => a.straat))].sort();
    
    straten.forEach(straat => {
        const option = document.createElement('option');
        option.value = straat;
        option.textContent = straat;
        straatSelect.appendChild(option);
    });
}

// === Data Loading ===

function loadAanvragen() {
    currentAanvragen = window.LiefLeed.getAanvragen();
    filterAanvragen();
}

function loadAmbassadeurs() {
    const aanvragen = window.LiefLeed.getAanvragen();
    const huidigJaar = new Date().getFullYear();
    
    currentAmbassadeurs = window.LiefLeed.straatambassadeurs.map(amb => {
        const ambAanvragen = aanvragen.filter(a => a.ambassadeurCode === amb.code);
        const aanvragenJaar = ambAanvragen.filter(a => new Date(a.datum).getFullYear() === huidigJaar);
        const uitgekeerd = ambAanvragen.filter(a => a.status === 'uitgekeerd');
        const laatsteAanvraag = ambAanvragen.sort((a, b) => new Date(b.datum) - new Date(a.datum))[0];
        
        return {
            ...amb,
            aanvragenTotaal: ambAanvragen.length,
            aanvragenJaar: aanvragenJaar.length,
            totaalUitgekeerd: uitgekeerd.reduce((sum, a) => sum + a.bedrag, 0),
            laatsteAanvraag: laatsteAanvraag ? laatsteAanvraag.datum : null,
            laatsteStatus: laatsteAanvraag ? laatsteAanvraag.status : null
        };
    });
    
    filterAmbassadeurs();
}

// === Aanvragen Filtering & Rendering ===

function filterAanvragen() {
    const statusFilter = document.getElementById('filter-status').value;
    const jaarFilter = document.getElementById('filter-jaar').value;
    const straatFilter = document.getElementById('filter-straat').value;
    const searchFilter = document.getElementById('search').value.toLowerCase();
    
    let filtered = [...currentAanvragen];
    
    // Status filter
    if (statusFilter !== 'alle') {
        filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    // Jaar filter
    if (jaarFilter !== 'alle') {
        filtered = filtered.filter(a => {
            const jaar = new Date(a.datum).getFullYear().toString();
            return jaar === jaarFilter;
        });
    }
    
    // Straat filter
    if (straatFilter !== 'alle') {
        filtered = filtered.filter(a => a.straat === straatFilter);
    }
    
    // Zoek filter
    if (searchFilter) {
        filtered = filtered.filter(a => 
            a.ambassadeurNaam.toLowerCase().includes(searchFilter) ||
            a.straat.toLowerCase().includes(searchFilter) ||
            a.id.toLowerCase().includes(searchFilter)
        );
    }
    
    // Sorteer
    filtered = sortAanvragen(filtered);
    
    renderAanvragenTable(filtered);
    updateStats();
    updateBudgetDisplay();
}

function sortAanvragen(aanvragen) {
    return aanvragen.sort((a, b) => {
        let aVal = a[sortConfig.field];
        let bVal = b[sortConfig.field];
        
        if (sortConfig.field === 'datum') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function sortTable(field) {
    if (sortConfig.field === field) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.field = field;
        sortConfig.direction = 'asc';
    }
    filterAanvragen();
}

function renderAanvragenTable(aanvragen) {
    const tbody = document.getElementById('aanvragen-tbody');
    const noData = document.getElementById('no-aanvragen');
    
    if (aanvragen.length === 0) {
        tbody.innerHTML = '';
        noData.classList.remove('hidden');
        return;
    }
    
    noData.classList.add('hidden');
    
    tbody.innerHTML = aanvragen.map(a => `
        <tr class="status-row-${a.status}">
            <td data-label="Datum">${window.LiefLeed.formatDate(a.datum)}</td>
            <td data-label="Ambassadeur">
                <strong>${escapeHtml(a.ambassadeurNaam)}</strong>
                <span class="table-sub">${a.ambassadeurCode}</span>
            </td>
            <td data-label="Straat">${escapeHtml(a.straat)}</td>
            <td data-label="Doel" class="td-doel">
                <span title="${escapeHtml(a.doel)}">${escapeHtml(a.doel.substring(0, 50))}${a.doel.length > 50 ? '...' : ''}</span>
            </td>
            <td data-label="Status">
                <span class="status-badge ${a.status}">${getStatusLabel(a.status)}</span>
            </td>
            <td data-label="Bedrag"><strong>€${a.bedrag}</strong></td>
            <td data-label="Acties" class="td-actions">
                ${getActionButtons(a)}
            </td>
        </tr>
    `).join('');
}

function getActionButtons(a) {
    let buttons = `<button onclick="showDetails('${a.id}')" class="btn-icon" title="Details">👁️</button>`;
    
    if (a.status === 'nieuw') {
        buttons += `
            <button onclick="quickAction('${a.id}', 'in_behandeling')" class="btn-icon btn-warning" title="In behandeling">⏳</button>
            <button onclick="quickAction('${a.id}', 'uitgekeerd')" class="btn-icon btn-success" title="Direct uitkeren">✅</button>
            <button onclick="quickAction('${a.id}', 'afgewezen')" class="btn-icon btn-danger" title="Afwijzen">❌</button>
        `;
    } else if (a.status === 'in_behandeling') {
        buttons += `
            <button onclick="quickAction('${a.id}', 'uitgekeerd')" class="btn-icon btn-success" title="Uitkeren">✅</button>
            <button onclick="quickAction('${a.id}', 'afgewezen')" class="btn-icon btn-danger" title="Afwijzen">❌</button>
        `;
    }
    
    return buttons;
}

// === Quick Actions ===

function quickAction(id, nieuweStatus) {
    const aanvraag = currentAanvragen.find(a => a.id === id);
    if (!aanvraag) return;
    
    let opmerking = '';
    
    if (nieuweStatus === 'afgewezen') {
        opmerking = prompt('Reden voor afwijzing:');
        if (!opmerking) return;
    } else if (nieuweStatus === 'uitgekeerd') {
        const confirm = window.confirm(`€${aanvraag.bedrag} uitkeren aan ${aanvraag.ambassadeurNaam}?`);
        if (!confirm) return;
        opmerking = prompt('Opmerking (optioneel, bijv. datum/wijze van uitkering):') || 'Uitgekeerd';
    } else {
        opmerking = `Status gewijzigd naar ${getStatusLabel(nieuweStatus)}`;
    }
    
    updateStatusDirect(id, nieuweStatus, opmerking);
}

function updateStatusDirect(id, nieuweStatus, opmerking) {
    const aanvragen = window.LiefLeed.getAanvragen();
    const index = aanvragen.findIndex(a => a.id === id);
    
    if (index !== -1) {
        aanvragen[index].status = nieuweStatus;
        aanvragen[index].statusGeschiedenis.push({
            status: nieuweStatus,
            datum: new Date().toISOString(),
            opmerking: opmerking
        });
        
        window.LiefLeed.saveAanvragen(aanvragen);
        currentAanvragen = aanvragen;
        filterAanvragen();
        loadAmbassadeurs();
        updateRecentAanvragen();
    }
}

// === Ambassadeurs Filtering & Rendering ===

function filterAmbassadeurs() {
    const searchFilter = document.getElementById('search-ambassadeur').value.toLowerCase();
    const statusFilter = document.getElementById('filter-amb-status').value;
    
    let filtered = [...currentAmbassadeurs];
    
    // Zoek filter
    if (searchFilter) {
        filtered = filtered.filter(a => 
            a.naam.toLowerCase().includes(searchFilter) ||
            a.straat.toLowerCase().includes(searchFilter) ||
            a.code.toLowerCase().includes(searchFilter)
        );
    }
    
    // Status filter
    if (statusFilter === 'met-aanvraag') {
        filtered = filtered.filter(a => a.aanvragenJaar > 0);
    } else if (statusFilter === 'zonder-aanvraag') {
        filtered = filtered.filter(a => a.aanvragenJaar === 0);
    }
    
    // Sorteer
    filtered = sortAmbassadeurs(filtered);
    
    renderAmbassadeursTable(filtered);
    updateAmbassadeursStats(filtered);
}

function sortAmbassadeurs(ambassadeurs) {
    return ambassadeurs.sort((a, b) => {
        let aVal = a[ambSortConfig.field];
        let bVal = b[ambSortConfig.field];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return ambSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return ambSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function sortAmbassadeursTable(field) {
    if (ambSortConfig.field === field) {
        ambSortConfig.direction = ambSortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        ambSortConfig.field = field;
        ambSortConfig.direction = 'asc';
    }
    filterAmbassadeurs();
}

function renderAmbassadeursTable(ambassadeurs) {
    const tbody = document.getElementById('ambassadeurs-tbody');
    
    tbody.innerHTML = ambassadeurs.map(a => `
        <tr class="${a.aanvragenJaar === 0 ? 'row-inactive' : ''}">
            <td data-label="Code"><span class="code-badge">${a.code}</span></td>
            <td data-label="Naam"><strong>${escapeHtml(a.naam)}</strong></td>
            <td data-label="Straat">${escapeHtml(a.straat)}</td>
            <td data-label="Aanvragen dit jaar">
                <span class="count-badge ${a.aanvragenJaar > 0 ? 'count-active' : ''}">${a.aanvragenJaar}</span>
            </td>
            <td data-label="Totaal uitgekeerd">
                <strong class="${a.totaalUitgekeerd > 0 ? 'text-success' : ''}">
                    €${a.totaalUitgekeerd}
                </strong>
            </td>
            <td data-label="Laatste aanvraag">
                ${a.laatsteAanvraag ? window.LiefLeed.formatDate(a.laatsteAanvraag) : '<span class="text-muted">-</span>'}
            </td>
            <td data-label="Status">
                ${a.laatsteStatus ? `<span class="status-badge ${a.laatsteStatus}">${getStatusLabel(a.laatsteStatus)}</span>` : '<span class="text-muted">-</span>'}
            </td>
        </tr>
    `).join('');
}

function updateAmbassadeursStats(filtered) {
    const totaal = currentAmbassadeurs.length;
    const actief = currentAmbassadeurs.filter(a => a.aanvragenJaar > 0).length;
    
    document.getElementById('amb-totaal').textContent = totaal;
    document.getElementById('amb-actief').textContent = actief;
    document.getElementById('amb-inactief').textContent = totaal - actief;
}

// === Recent Aanvragen (Dashboard) ===

function updateRecentAanvragen() {
    const container = document.getElementById('recent-aanvragen');
    const openstaand = currentAanvragen
        .filter(a => a.status === 'nieuw' || a.status === 'in_behandeling')
        .sort((a, b) => new Date(b.datum) - new Date(a.datum))
        .slice(0, 5);
    
    if (openstaand.length === 0) {
        container.innerHTML = '<p class="empty-state-small">Geen openstaande aanvragen 🎉</p>';
        return;
    }
    
    container.innerHTML = openstaand.map(a => `
        <div class="recent-card status-${a.status}">
            <div class="recent-info">
                <div class="recent-header">
                    <strong>${escapeHtml(a.ambassadeurNaam)}</strong>
                    <span class="status-badge ${a.status}">${getStatusLabel(a.status)}</span>
                </div>
                <div class="recent-meta">
                    📍 ${escapeHtml(a.straat)} • 💰 €${a.bedrag} • 📅 ${window.LiefLeed.formatDate(a.datum)}
                </div>
                <div class="recent-doel">${escapeHtml(a.doel.substring(0, 80))}${a.doel.length > 80 ? '...' : ''}</div>
            </div>
            <div class="recent-actions">
                ${a.status === 'nieuw' ? `
                    <button onclick="quickAction('${a.id}', 'in_behandeling')" class="btn btn-small btn-warning">⏳ In behandeling</button>
                ` : ''}
                <button onclick="quickAction('${a.id}', 'uitgekeerd')" class="btn btn-small btn-success">✅ Uitkeren</button>
                <button onclick="showDetails('${a.id}')" class="btn btn-small btn-secondary">👁️ Details</button>
            </div>
        </div>
    `).join('');
}

// === Status Updates (via modal) ===

function updateStatus(id, nieuweStatus) {
    let opmerking = '';
    
    if (nieuweStatus === 'uitgekeerd') {
        opmerking = prompt('Opmerking bij uitkering (bijv. rekeningnummer, datum overmaking):');
        if (opmerking === null) return;
    } else if (nieuweStatus === 'afgewezen') {
        opmerking = prompt('Reden voor afwijzing:');
        if (opmerking === null) return;
        if (!opmerking.trim()) {
            alert('Geef een reden voor de afwijzing.');
            return;
        }
    } else {
        opmerking = prompt(`Opmerking bij statuswijziging naar "${getStatusLabel(nieuweStatus)}":`);
        if (opmerking === null) return;
    }
    
    updateStatusDirect(id, nieuweStatus, opmerking || `Status gewijzigd naar ${getStatusLabel(nieuweStatus)}`);
    closeModal();
}

// === Helper Functions ===

function getStatusLabel(status) {
    const labels = {
        'nieuw': 'Nieuw',
        'in_behandeling': 'In behandeling',
        'uitgekeerd': 'Uitgekeerd',
        'afgewezen': 'Afgewezen'
    };
    return labels[status] || status;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === Details Modal ===

function showDetails(id) {
    const aanvraag = currentAanvragen.find(a => a.id === id);
    if (!aanvraag) return;
    
    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');
    
    body.innerHTML = `
        <h2 style="color: var(--primary-blue); margin-bottom: var(--space-lg);">
            💰 Aanvraag ${aanvraag.id}
        </h2>
        
        <div style="margin-bottom: var(--space-lg); display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap;">
            <span class="status-badge ${aanvraag.status}" style="font-size: 1rem; padding: var(--space-sm) var(--space-md);">
                ${getStatusLabel(aanvraag.status)}
            </span>
            <span style="font-size: 1.5rem; font-weight: 700; color: var(--delft-blue);">€${aanvraag.bedrag}</span>
        </div>
        
        <h3 style="margin-bottom: var(--space-sm);">👤 Straatambassadeur</h3>
        <table style="width: 100%; margin-bottom: var(--space-lg);">
            <tr><td style="color: var(--gray-500); padding: 4px 0; width: 140px;">Naam:</td><td><strong>${escapeHtml(aanvraag.ambassadeurNaam)}</strong></td></tr>
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Straat:</td><td>${escapeHtml(aanvraag.straat)}</td></tr>
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Code:</td><td>${aanvraag.ambassadeurCode}</td></tr>
            ${aanvraag.telefoon ? `<tr><td style="color: var(--gray-500); padding: 4px 0;">Telefoon:</td><td><a href="tel:${aanvraag.telefoon}">${escapeHtml(aanvraag.telefoon)}</a></td></tr>` : ''}
        </table>
        
        <h3 style="margin-bottom: var(--space-sm);">🎯 Doel aanvraag</h3>
        <div style="background: var(--gray-100); border-radius: var(--radius-md); padding: var(--space-md); margin-bottom: var(--space-lg);">
            ${escapeHtml(aanvraag.doel)}
        </div>
        
        ${aanvraag.vorigeToelichting ? `
        <h3 style="margin-bottom: var(--space-sm);">📋 Vorig potje gebruikt voor</h3>
        <div style="background: var(--gray-100); border-radius: var(--radius-md); padding: var(--space-md); margin-bottom: var(--space-lg);">
            ${escapeHtml(aanvraag.vorigeToelichting)}
        </div>
        ` : ''}
        
        <h3 style="margin-bottom: var(--space-sm);">📁 Administratie</h3>
        <div style="margin-bottom: var(--space-lg);">
            ${aanvraag.administratie === 'zelf' 
                ? '📁 Ambassadeur bewaart zelf de administratie' 
                : '📤 Administratie wordt naar kerngroep gestuurd'}
        </div>
        
        ${aanvraag.bewijsstukken && aanvraag.bewijsstukken.length > 0 ? `
        <h3 style="margin-bottom: var(--space-sm);">📎 Bewijsstukken (${aanvraag.bewijsstukken.length})</h3>
        <div style="margin-bottom: var(--space-lg);">
            ${aanvraag.bewijsstukken.map((b, i) => `
                <div style="margin-bottom: var(--space-sm);">
                    <strong>${escapeHtml(b.naam)}</strong>
                    ${b.data && b.data.startsWith('data:image') ? `
                        <img src="${b.data}" alt="${b.naam}" style="max-width: 100%; border-radius: var(--radius-md); margin-top: var(--space-sm); display: block;">
                    ` : `
                        <a href="${b.data}" download="${b.naam}" class="btn btn-secondary btn-small" style="margin-left: var(--space-sm);">
                            📥 Download
                        </a>
                    `}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <h3 style="margin-bottom: var(--space-sm);">📜 Status geschiedenis</h3>
        <div style="background: var(--gray-100); border-radius: var(--radius-md); padding: var(--space-md);">
            ${aanvraag.statusGeschiedenis.map(s => `
                <div style="margin-bottom: var(--space-sm); padding-bottom: var(--space-sm); border-bottom: 1px solid var(--gray-200);">
                    <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--space-sm);">
                        <span class="status-badge ${s.status}">${getStatusLabel(s.status)}</span>
                        <span style="color: var(--gray-500); font-size: 0.875rem;">${window.LiefLeed.formatDateTime(s.datum)}</span>
                    </div>
                    ${s.opmerking ? `<p style="margin-top: var(--space-xs); font-size: 0.875rem;">${escapeHtml(s.opmerking)}</p>` : ''}
                </div>
            `).reverse().join('')}
        </div>
        
        <div style="margin-top: var(--space-xl); display: flex; gap: var(--space-sm); flex-wrap: wrap;">
            ${aanvraag.status === 'nieuw' ? `
                <button onclick="updateStatus('${aanvraag.id}', 'in_behandeling')" class="btn btn-secondary" style="background: #fef3c7; color: #92400e;">
                    ⏳ In behandeling nemen
                </button>
            ` : ''}
            ${aanvraag.status === 'nieuw' || aanvraag.status === 'in_behandeling' ? `
                <button onclick="updateStatus('${aanvraag.id}', 'uitgekeerd')" class="btn btn-primary">
                    ✅ €${aanvraag.bedrag} Uitkeren
                </button>
            ` : ''}
            ${aanvraag.status !== 'afgewezen' && aanvraag.status !== 'uitgekeerd' ? `
                <button onclick="updateStatus('${aanvraag.id}', 'afgewezen')" class="btn btn-secondary" style="background: #fee2e2; color: #991b1b;">
                    ❌ Afwijzen
                </button>
            ` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

// === Budget Display ===

function updateBudgetDisplay() {
    const budgetConfig = getBudgetConfig();
    const jaarFilter = document.getElementById('filter-jaar')?.value || '2025';
    const jaar = jaarFilter !== 'alle' ? parseInt(jaarFilter) : new Date().getFullYear();
    
    // Filter aanvragen voor geselecteerd jaar
    const aanvragenJaar = currentAanvragen.filter(a => 
        new Date(a.datum).getFullYear() === jaar
    );
    
    // Bereken bedragen
    const uitgekeerd = aanvragenJaar
        .filter(a => a.status === 'uitgekeerd')
        .reduce((sum, a) => sum + a.bedrag, 0);
    
    const inBehandeling = aanvragenJaar
        .filter(a => a.status === 'in_behandeling' || a.status === 'nieuw')
        .reduce((sum, a) => sum + a.bedrag, 0);
    
    const resterend = Math.max(0, budgetConfig.jaarBudget - uitgekeerd - inBehandeling);
    
    // Update display
    document.getElementById('budget-jaar').textContent = jaar;
    document.getElementById('budget-totaal').textContent = `€${budgetConfig.jaarBudget.toLocaleString('nl-NL')}`;
    document.getElementById('budget-uitgekeerd').textContent = `€${uitgekeerd.toLocaleString('nl-NL')}`;
    document.getElementById('budget-openstaand').textContent = `€${inBehandeling.toLocaleString('nl-NL')}`;
    document.getElementById('budget-resterend').textContent = `€${resterend.toLocaleString('nl-NL')}`;
    
    // Update progress bar
    const uitgekeerdPct = (uitgekeerd / budgetConfig.jaarBudget) * 100;
    const openstaandPct = (inBehandeling / budgetConfig.jaarBudget) * 100;
    
    document.getElementById('progress-uitgekeerd').style.width = `${Math.min(uitgekeerdPct, 100)}%`;
    document.getElementById('progress-openstaand').style.width = `${Math.min(openstaandPct, 100 - uitgekeerdPct)}%`;
}

function toggleBudgetSettings() {
    const section = document.getElementById('budget-settings');
    budgetSettingsVisible = !budgetSettingsVisible;
    section.classList.toggle('hidden', !budgetSettingsVisible);
}

function saveBudgetSettings() {
    const jaarBudget = parseInt(document.getElementById('jaarbudget').value) || 5000;
    saveBudgetConfig({ jaarBudget });
    updateBudgetDisplay();
    toggleBudgetSettings();
    alert('Budget instellingen opgeslagen!');
}

// === Statistieken ===

function updateStats() {
    const jaarFilter = document.getElementById('filter-jaar')?.value || '2025';
    let aanvragen = currentAanvragen;
    
    if (jaarFilter !== 'alle') {
        const jaar = parseInt(jaarFilter);
        aanvragen = aanvragen.filter(a => new Date(a.datum).getFullYear() === jaar);
    }
    
    document.getElementById('stat-totaal').textContent = aanvragen.length;
    document.getElementById('stat-nieuw').textContent = aanvragen.filter(a => a.status === 'nieuw').length;
    document.getElementById('stat-behandeling').textContent = aanvragen.filter(a => a.status === 'in_behandeling').length;
    document.getElementById('stat-uitgekeerd').textContent = aanvragen.filter(a => a.status === 'uitgekeerd').length;
}

// === Excel Export ===

function exportToExcel() {
    const aanvragen = window.LiefLeed.getAanvragen();
    
    if (aanvragen.length === 0) {
        alert('Geen aanvragen om te exporteren.');
        return;
    }
    
    // CSV genereren
    const headers = [
        'Referentie',
        'Datum',
        'Status',
        'Ambassadeur Code',
        'Ambassadeur Naam',
        'Straat',
        'Telefoon',
        'Doel',
        'Vorig Potje Gebruikt Voor',
        'Administratie',
        'Bedrag',
        'Bewijsstukken'
    ];
    
    const rows = aanvragen.map(a => [
        a.id,
        window.LiefLeed.formatDateTime(a.datum),
        getStatusLabel(a.status),
        a.ambassadeurCode,
        a.ambassadeurNaam,
        a.straat,
        a.telefoon || '',
        a.doel,
        a.vorigeToelichting || '',
        a.administratie === 'zelf' ? 'Zelf bewaren' : 'Naar kerngroep',
        `€${a.bedrag}`,
        a.bewijsstukken ? `${a.bewijsstukken.length} bestand(en)` : 'Geen'
    ]);
    
    downloadCSV(headers, rows, 'lief-leed-aanvragen');
}

function exportAmbassadeursToExcel() {
    const headers = [
        'Code',
        'Naam',
        'Straat',
        'Aanvragen dit jaar',
        'Totaal uitgekeerd',
        'Laatste aanvraag',
        'Laatste status'
    ];
    
    const rows = currentAmbassadeurs.map(a => [
        a.code,
        a.naam,
        a.straat,
        a.aanvragenJaar,
        `€${a.totaalUitgekeerd}`,
        a.laatsteAanvraag ? window.LiefLeed.formatDate(a.laatsteAanvraag) : '-',
        a.laatsteStatus ? getStatusLabel(a.laatsteStatus) : '-'
    ]);
    
    downloadCSV(headers, rows, 'lief-leed-ambassadeurs');
}

function downloadCSV(headers, rows, filename) {
    // CSV met BOM voor Excel compatibiliteit
    const BOM = '\uFEFF';
    const csv = BOM + [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}
