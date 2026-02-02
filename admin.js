// === Lief & Leed Potje - Admin Dashboard ===

let currentAanvragen = [];
let budgetSettingsVisible = false;
let pinSettingsVisible = false;

// Storage keys
const BUDGET_KEY = 'liefLeedBudget';
const PIN_KEY = 'liefLeedAdminPin';
const SESSION_KEY = 'liefLeedAdminSession';

// Default PIN
const DEFAULT_PIN = '2026';

// === PIN Authentication ===

function getPinCode() {
    return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

function setPinCode(pin) {
    localStorage.setItem(PIN_KEY, pin);
}

function isSessionValid() {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return false;
    
    const sessionData = JSON.parse(session);
    const now = Date.now();
    // Session valid for 1 hour
    return (now - sessionData.timestamp) < 3600000;
}

function createSession() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        timestamp: Date.now()
    }));
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

function checkAuth() {
    const pinLock = document.getElementById('pin-lock');
    const adminContent = document.getElementById('admin-content');
    
    if (isSessionValid()) {
        // Sessie geldig, toon admin
        pinLock.classList.add('hidden');
        adminContent.classList.remove('hidden');
        return true;
    } else {
        // Toon PIN lock
        pinLock.classList.remove('hidden');
        adminContent.classList.add('hidden');
        
        // Focus op PIN input
        setTimeout(() => {
            const pinInput = document.getElementById('pin-input');
            if (pinInput) pinInput.focus();
        }, 100);
        return false;
    }
}

function verifyPin() {
    const pinInput = document.getElementById('pin-input');
    const pinError = document.getElementById('pin-error');
    const enteredPin = pinInput.value;
    
    if (enteredPin === getPinCode()) {
        // PIN correct
        createSession();
        checkAuth();
        loadAdminData();
    } else {
        // PIN fout
        pinError.classList.remove('hidden');
        pinInput.value = '';
        pinInput.focus();
        
        // Shake animatie
        pinInput.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            pinInput.style.animation = '';
        }, 500);
    }
}

function lockAdmin() {
    clearSession();
    checkAuth();
    document.getElementById('pin-input').value = '';
    document.getElementById('pin-error').classList.add('hidden');
}

function togglePinSettings() {
    const section = document.getElementById('pin-settings');
    pinSettingsVisible = !pinSettingsVisible;
    section.classList.toggle('hidden', !pinSettingsVisible);
    
    // Verberg budget settings als die open zijn
    if (pinSettingsVisible && budgetSettingsVisible) {
        document.getElementById('budget-settings').classList.add('hidden');
        budgetSettingsVisible = false;
    }
}

function saveNewPin() {
    const newPin = document.getElementById('new-pin').value;
    const confirmPin = document.getElementById('confirm-pin').value;
    
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        alert('PIN moet 4 cijfers zijn');
        return;
    }
    
    if (newPin !== confirmPin) {
        alert('PIN codes komen niet overeen');
        return;
    }
    
    setPinCode(newPin);
    alert('PIN code gewijzigd!');
    
    // Reset velden en sluit settings
    document.getElementById('new-pin').value = '';
    document.getElementById('confirm-pin').value = '';
    togglePinSettings();
}

// Budget configuratie
function getBudgetConfig() {
    const saved = localStorage.getItem(BUDGET_KEY);
    return saved ? JSON.parse(saved) : { jaarBudget: 5000 };
}

function saveBudgetConfig(config) {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(config));
}

// === Initialisatie ===

document.addEventListener('DOMContentLoaded', function() {
    // Check authenticatie eerst
    if (checkAuth()) {
        loadAdminData();
    }
    
    // PIN input - enter key
    const pinInput = document.getElementById('pin-input');
    if (pinInput) {
        pinInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyPin();
            }
        });
        
        // Alleen cijfers toestaan
        pinInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 4);
        });
    }
    
    // Escape sluit modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
});

function loadAdminData() {
    initFilters();
    loadAanvragen();
    updateBudgetDisplay();
    
    // Load saved budget
    const budgetConfig = getBudgetConfig();
    document.getElementById('jaarbudget').value = budgetConfig.jaarBudget;
}

// === Filters ===

function initFilters() {
    // Vul straat filter met unieke straten uit ambassadeurs
    const straatSelect = document.getElementById('filter-straat');
    if (!straatSelect || !window.LiefLeed) return;
    
    const straten = [...new Set(window.LiefLeed.straatambassadeurs.map(a => a.straat))].sort();
    
    // Verwijder bestaande opties behalve "Alle straten"
    while (straatSelect.options.length > 1) {
        straatSelect.remove(1);
    }
    
    straten.forEach(straat => {
        const option = document.createElement('option');
        option.value = straat;
        option.textContent = straat;
        straatSelect.appendChild(option);
    });
}

// === Data Loading ===

function loadAanvragen() {
    if (!window.LiefLeed) {
        console.error('LiefLeed module niet geladen');
        return;
    }
    currentAanvragen = window.LiefLeed.getAanvragen();
    filterAanvragen();
}

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
            a.id.toLowerCase().includes(searchFilter) ||
            (a.reden && a.reden.toLowerCase().includes(searchFilter))
        );
    }
    
    // Sorteer op datum (nieuwste eerst)
    filtered.sort((a, b) => new Date(b.datum) - new Date(a.datum));
    
    renderAanvragen(filtered);
    updateStats();
    updateBudgetDisplay();
}

// === Rendering ===

function renderAanvragen(aanvragen) {
    const container = document.getElementById('aanvragen-container');
    
    if (aanvragen.length === 0) {
        container.innerHTML = '<p class="empty-state">Geen aanvragen gevonden.</p>';
        return;
    }
    
    container.innerHTML = aanvragen.map(a => `
        <div class="aanvraag-card status-${a.status}">
            <div class="aanvraag-header">
                <div>
                    <div class="aanvraag-title">${escapeHtml(a.ambassadeurNaam)}</div>
                    <div class="aanvraag-meta">
                        <span>📍 ${escapeHtml(a.straat)}</span>
                        <span>📅 ${window.LiefLeed.formatDate(a.datum)}</span>
                        <span>💰 €${a.bedrag}</span>
                    </div>
                </div>
                <span class="status-badge ${a.status}">${getStatusLabel(a.status)}</span>
            </div>
            
            <div class="aanvraag-details">
                ${a.reden ? `
                <div class="detail-item detail-full">
                    <span class="detail-label">Reden:</span>
                    <span><strong>${escapeHtml(a.reden)}</strong></span>
                </div>
                ` : ''}
                ${a.doel ? `
                <div class="detail-item detail-full">
                    <span class="detail-label">Toelichting:</span>
                    <span>${escapeHtml(a.doel.substring(0, 100))}${a.doel.length > 100 ? '...' : ''}</span>
                </div>
                ` : ''}
                <div class="detail-item">
                    <span class="detail-label">Code:</span>
                    <span>${a.ambassadeurCode}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Referentie:</span>
                    <span>${a.id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Administratie:</span>
                    <span>${a.administratie === 'zelf' ? '📁 Zelf bewaren' : '📤 Naar kerngroep'}</span>
                </div>
                ${a.rekeninghouder ? `
                <div class="detail-item detail-full betaal-info">
                    <span class="detail-label">💳 Betaalgegevens:</span>
                    <span><strong>${escapeHtml(a.rekeninghouder)}</strong> - ${escapeHtml(a.iban || 'Geen IBAN')}</span>
                </div>
                ` : ''}
                ${a.bewijsstukken && a.bewijsstukken.length > 0 ? `
                <div class="detail-item">
                    <span class="detail-label">Bewijsstukken:</span>
                    <span>📎 ${a.bewijsstukken.length} bestand(en)</span>
                </div>
                ` : ''}
            </div>
            
            <div class="aanvraag-actions">
                <button onclick="showDetails('${a.id}')" class="btn btn-secondary btn-small">
                    👁️ Details
                </button>
                ${a.status === 'nieuw' ? `
                    <button onclick="updateStatus('${a.id}', 'in_behandeling')" class="btn btn-secondary btn-small" style="background: #fef3c7; color: #92400e;">
                        ⏳ In behandeling
                    </button>
                    <button onclick="updateStatus('${a.id}', 'afgewezen')" class="btn btn-secondary btn-small" style="background: #fee2e2; color: #991b1b;">
                        ❌ Afwijzen
                    </button>
                ` : ''}
                ${a.status === 'in_behandeling' ? `
                    ${a.rekeninghouder && a.iban ? `
                    <button onclick="kopieerBetaalgegevens('${a.id}')" class="btn btn-secondary btn-small" style="background: #e0e7ff; color: #3730a3;">
                        📋 Kopieer betaalgegevens
                    </button>
                    ` : ''}
                    <button onclick="updateStatus('${a.id}', 'uitgekeerd')" class="btn btn-secondary btn-small" style="background: #d1fae5; color: #065f46;">
                        ✅ Uitkeren (€${a.bedrag})
                    </button>
                    <button onclick="updateStatus('${a.id}', 'afgewezen')" class="btn btn-secondary btn-small" style="background: #fee2e2; color: #991b1b;">
                        ❌ Afwijzen
                    </button>
                ` : ''}
                ${a.status === 'uitgekeerd' ? `
                    <span class="uitgekeerd-badge">✅ €${a.bedrag} uitgekeerd</span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

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

// === Betaalgegevens Kopiëren ===

function kopieerBetaalgegevens(id) {
    const aanvragen = window.LiefLeed.getAanvragen();
    const aanvraag = aanvragen.find(a => a.id === id);
    
    if (!aanvraag) {
        alert('Aanvraag niet gevonden');
        return;
    }
    
    const tekst = `Lief & Leed Potje - Overboeking
━━━━━━━━━━━━━━━━━━━━━
Naam: ${aanvraag.rekeninghouder}
IBAN: ${aanvraag.iban}
Bedrag: €${aanvraag.bedrag}
Omschrijving: Lief&Leed ${aanvraag.straat} - ${aanvraag.reden || 'aanvraag'}
━━━━━━━━━━━━━━━━━━━━━
Ref: ${aanvraag.id}`;
    
    navigator.clipboard.writeText(tekst).then(() => {
        // Toon feedback
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Gekopieerd!';
        btn.style.background = '#d1fae5';
        btn.style.color = '#065f46';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#e0e7ff';
            btn.style.color = '#3730a3';
        }, 2000);
    }).catch(err => {
        // Fallback: toon in prompt
        prompt('Kopieer de betaalgegevens:', tekst);
    });
}

// === Status Updates ===

function updateStatus(id, nieuweStatus) {
    let opmerking = '';
    
    if (nieuweStatus === 'uitgekeerd') {
        opmerking = prompt('Opmerking bij uitkering (bijv. rekeningnummer, datum overmaking):');
        if (opmerking === null) return; // Cancelled
    } else if (nieuweStatus === 'afgewezen') {
        opmerking = prompt('Reden voor afwijzing:');
        if (opmerking === null) return; // Cancelled
        if (!opmerking.trim()) {
            alert('Geef een reden voor de afwijzing.');
            return;
        }
    } else {
        opmerking = prompt(`Opmerking bij statuswijziging naar "${getStatusLabel(nieuweStatus)}":`);
        if (opmerking === null) return;
    }
    
    const aanvragen = window.LiefLeed.getAanvragen();
    const index = aanvragen.findIndex(a => a.id === id);
    
    if (index !== -1) {
        aanvragen[index].status = nieuweStatus;
        aanvragen[index].statusGeschiedenis.push({
            status: nieuweStatus,
            datum: new Date().toISOString(),
            opmerking: opmerking || `Status gewijzigd naar ${getStatusLabel(nieuweStatus)}`
        });
        
        window.LiefLeed.saveAanvragen(aanvragen);
        currentAanvragen = aanvragen;
        filterAanvragen();
    }
}

// === Details Modal ===

function showDetails(id) {
    const aanvraag = currentAanvragen.find(a => a.id === id);
    if (!aanvraag) return;
    
    const ambassadeur = window.LiefLeed.getAmbassadeurByCode(aanvraag.ambassadeurCode);
    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');
    
    body.innerHTML = `
        <h2 style="color: var(--primary-dark); margin-bottom: var(--space-lg);">
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
        
        ${aanvraag.reden ? `
        <h3 style="margin-bottom: var(--space-sm);">🎯 Reden aanvraag</h3>
        <div style="background: var(--accent-gold); border-radius: var(--radius-md); padding: var(--space-md); margin-bottom: var(--space-lg); font-weight: 600; color: var(--primary-dark);">
            ${escapeHtml(aanvraag.reden)}
        </div>
        ` : ''}
        
        ${aanvraag.doel ? `
        <h3 style="margin-bottom: var(--space-sm);">📝 Toelichting</h3>
        <div style="background: var(--gray-100); border-radius: var(--radius-md); padding: var(--space-md); margin-bottom: var(--space-lg);">
            ${escapeHtml(aanvraag.doel)}
        </div>
        ` : ''}
        
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
                <button onclick="updateStatus('${aanvraag.id}', 'in_behandeling'); closeModal();" class="btn btn-secondary" style="background: #fef3c7; color: #92400e;">
                    ⏳ In behandeling nemen
                </button>
            ` : ''}
            ${aanvraag.status === 'in_behandeling' ? `
                <button onclick="updateStatus('${aanvraag.id}', 'uitgekeerd'); closeModal();" class="btn btn-primary">
                    ✅ €${aanvraag.bedrag} Uitkeren
                </button>
            ` : ''}
            ${aanvraag.status !== 'afgewezen' && aanvraag.status !== 'uitgekeerd' ? `
                <button onclick="updateStatus('${aanvraag.id}', 'afgewezen'); closeModal();" class="btn btn-secondary" style="background: #fee2e2; color: #991b1b;">
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
    const jaarFilterEl = document.getElementById('filter-jaar');
    if (!jaarFilterEl) return;
    
    const jaarFilter = jaarFilterEl.value;
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
    const budgetJaarEl = document.getElementById('budget-jaar');
    if (budgetJaarEl) budgetJaarEl.textContent = jaar;
    
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
    
    // Verberg PIN settings als die open zijn
    if (budgetSettingsVisible && pinSettingsVisible) {
        document.getElementById('pin-settings').classList.add('hidden');
        pinSettingsVisible = false;
    }
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
    const jaarFilterEl = document.getElementById('filter-jaar');
    if (!jaarFilterEl) return;
    
    const jaarFilter = jaarFilterEl.value;
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
        'Reden',
        'Toelichting',
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
        a.reden || '',
        a.doel || '',
        a.vorigeToelichting || '',
        a.administratie === 'zelf' ? 'Zelf bewaren' : 'Naar kerngroep',
        `€${a.bedrag}`,
        a.bewijsstukken ? `${a.bewijsstukken.length} bestand(en)` : 'Geen'
    ]);
    
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
    link.download = `lief-leed-potje-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

// Add shake animation for wrong PIN
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);
