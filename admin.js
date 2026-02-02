// === Lief & Leed Potje - Admin Dashboard ===

let currentAanvragen = [];
let filteredAanvragen = [];
let currentSort = { key: 'datum', dir: 'desc' };
let ambSort = { key: 'naam', dir: 'asc' };

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

function showLogin() {
    const loginScreen = document.getElementById('login-screen');
    const adminContent = document.getElementById('admin-content');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (adminContent) adminContent.classList.add('hidden');
}

function showAdmin() {
    const loginScreen = document.getElementById('login-screen');
    const adminContent = document.getElementById('admin-content');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (adminContent) adminContent.classList.remove('hidden');
}

function verifyPin() {
    const pinInput = document.getElementById('pin-input');
    const pinError = document.getElementById('login-error');
    const enteredPin = pinInput.value;

    if (enteredPin === getPinCode()) {
        createSession();
        showAdmin();
        loadAdminData();
        pinError.classList.add('hidden');
    } else {
        pinError.classList.remove('hidden');
        pinInput.value = '';
        pinInput.focus();
        pinInput.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => {
            pinInput.style.animation = '';
        }, 400);
    }
}

function logout() {
    clearSession();
    showLogin();
    const pinInput = document.getElementById('pin-input');
    const pinError = document.getElementById('login-error');
    if (pinInput) pinInput.value = '';
    if (pinError) pinError.classList.add('hidden');
}

// === Budget configuratie ===

function getBudgetConfig() {
    const saved = localStorage.getItem(BUDGET_KEY);
    return saved ? JSON.parse(saved) : { jaarBudget: 5000 };
}

function saveBudgetConfig(config) {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(config));
}

function toggleBudgetSettings() {
    const section = document.getElementById('budget-settings');
    if (!section) return;
    section.classList.toggle('hidden');
}

function saveBudgetSettings() {
    const jaarBudget = parseInt(document.getElementById('jaarbudget').value, 10) || 5000;
    saveBudgetConfig({ jaarBudget });
    updateBudgetDisplay();
    toggleBudgetSettings();
    alert('Budget instellingen opgeslagen!');
}

function changePin() {
    const newPin = document.getElementById('new-pin').value.trim();
    if (newPin.length < 4) {
        alert('PIN moet minimaal 4 cijfers zijn');
        return;
    }
    if (!/^[0-9]+$/.test(newPin)) {
        alert('PIN mag alleen cijfers bevatten');
        return;
    }
    setPinCode(newPin);
    alert('PIN code gewijzigd!');
    document.getElementById('new-pin').value = '';
}

// === Initialisatie ===

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const pinInput = document.getElementById('pin-input');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            verifyPin();
        });
    }

    if (pinInput) {
        pinInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 6);
        });
    }

    const addAmbForm = document.getElementById('add-ambassadeur-form');
    if (addAmbForm) {
        addAmbForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addAmbassadeurFromForm();
        });
    }

    if (isSessionValid()) {
        showAdmin();
        loadAdminData();
    } else {
        showLogin();
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
});

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`);

    if (targetTab) targetTab.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
}

// === Data Loading ===

function loadAdminData() {
    initFilters();
    loadAanvragen();
    renderAmbassadeurs();

    const budgetConfig = getBudgetConfig();
    document.getElementById('jaarbudget').value = budgetConfig.jaarBudget;
}

function loadAanvragen() {
    if (!window.LiefLeed) return;
    currentAanvragen = window.LiefLeed.getAanvragen();
    filterAanvragen();
}

function initFilters() {
    const straatSelect = document.getElementById('filter-straat');
    if (!straatSelect || !window.LiefLeed) return;

    const straten = [...new Set(window.LiefLeed.getAmbassadeurs().map(a => a.straat))].sort();

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

// === Aanvragen Filtering ===

function filterAanvragen() {
    const statusFilter = document.getElementById('filter-status').value;
    const jaarFilter = document.getElementById('filter-jaar').value;
    const straatFilter = document.getElementById('filter-straat').value;
    const searchFilter = document.getElementById('search').value.toLowerCase();

    filteredAanvragen = [...currentAanvragen];

    if (statusFilter !== 'alle') {
        filteredAanvragen = filteredAanvragen.filter(a => a.status === statusFilter);
    }

    if (jaarFilter !== 'alle') {
        filteredAanvragen = filteredAanvragen.filter(a => {
            const jaar = new Date(a.datum).getFullYear().toString();
            return jaar === jaarFilter;
        });
    }

    if (straatFilter !== 'alle') {
        filteredAanvragen = filteredAanvragen.filter(a => a.straat === straatFilter);
    }

    if (searchFilter) {
        filteredAanvragen = filteredAanvragen.filter(a =>
            a.ambassadeurNaam.toLowerCase().includes(searchFilter) ||
            a.straat.toLowerCase().includes(searchFilter) ||
            a.id.toLowerCase().includes(searchFilter) ||
            (a.reden && a.reden.toLowerCase().includes(searchFilter))
        );
    }

    filteredAanvragen.sort(sortByKey(currentSort.key, currentSort.dir));

    renderAanvragenTable(filteredAanvragen);
    updateStats();
    updateBudgetDisplay();
    renderRecentAanvragen();
}

function sortTable(key) {
    if (currentSort.key === key) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort = { key, dir: 'asc' };
    }
    filteredAanvragen.sort(sortByKey(key, currentSort.dir));
    renderAanvragenTable(filteredAanvragen);
}

// === Aanvragen Rendering ===

function renderAanvragenTable(aanvragen) {
    const tbody = document.getElementById('aanvragen-tbody');
    const emptyState = document.getElementById('no-aanvragen');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (aanvragen.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    aanvragen.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = `status-row-${a.status}`;

        const doel = a.doel ? a.doel.substring(0, 80) + (a.doel.length > 80 ? '...' : '') : '';

        tr.innerHTML = `
            <td data-label="Datum">${window.LiefLeed.formatDate(a.datum)}</td>
            <td data-label="Ambassadeur">
                ${escapeHtml(a.ambassadeurNaam)}
                <span class="table-sub">${a.ambassadeurCode}</span>
            </td>
            <td data-label="Straat">${escapeHtml(a.straat)}</td>
            <td class="td-doel" data-label="Doel">${escapeHtml(doel)}</td>
            <td data-label="Status"><span class="status-badge ${a.status}">${getStatusLabel(a.status)}</span></td>
            <td data-label="Bedrag">€${a.bedrag}</td>
            <td class="td-actions" data-label="Acties">
                <button class="btn-icon" onclick="showDetails('${a.id}')">👁️</button>
                ${a.status === 'nieuw' ? `
                    <button class="btn-icon btn-warning" onclick="updateStatus('${a.id}', 'in_behandeling')">⏳</button>
                    <button class="btn-icon btn-danger" onclick="updateStatus('${a.id}', 'afgewezen')">❌</button>
                ` : ''}
                ${a.status === 'in_behandeling' ? `
                    <button class="btn-icon btn-success" onclick="updateStatus('${a.id}', 'uitgekeerd')">✅</button>
                    <button class="btn-icon btn-danger" onclick="updateStatus('${a.id}', 'afgewezen')">❌</button>
                ` : ''}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function renderRecentAanvragen() {
    const container = document.getElementById('recent-aanvragen');
    if (!container) return;

    const recent = [...currentAanvragen]
        .filter(a => a.status === 'nieuw' || a.status === 'in_behandeling')
        .sort((a, b) => new Date(b.datum) - new Date(a.datum))
        .slice(0, 4);

    if (recent.length === 0) {
        container.innerHTML = '<p class="empty-state">Geen openstaande aanvragen.</p>';
        return;
    }

    container.innerHTML = recent.map(a => `
        <div class="recent-card status-${a.status}">
            <div>
                <strong>${escapeHtml(a.ambassadeurNaam)}</strong>
                <div class="table-sub">${escapeHtml(a.straat)} · ${window.LiefLeed.formatDate(a.datum)}</div>
            </div>
            <div class="recent-actions">
                <span class="status-badge ${a.status}">${getStatusLabel(a.status)}</span>
                <button class="btn btn-secondary btn-small" onclick="showDetails('${a.id}')">Details</button>
            </div>
        </div>
    `).join('');
}

// === Ambassadeurs ===

function renderAmbassadeurs() {
    const ambassadeurs = window.LiefLeed ? window.LiefLeed.getAmbassadeurs() : [];
    sortAmbassadeursList(ambassadeurs);
    renderAmbassadeursTable(ambassadeurs);
    updateAmbassadeursStats(ambassadeurs);
}

function filterAmbassadeurs() {
    const search = document.getElementById('search-ambassadeur').value.toLowerCase();
    const statusFilter = document.getElementById('filter-amb-status').value;

    let ambassadeurs = window.LiefLeed ? window.LiefLeed.getAmbassadeurs() : [];

    if (search) {
        ambassadeurs = ambassadeurs.filter(a =>
            a.naam.toLowerCase().includes(search) ||
            a.straat.toLowerCase().includes(search)
        );
    }

    if (statusFilter !== 'alle') {
        const jaar = new Date().getFullYear();
        ambassadeurs = ambassadeurs.filter(a => {
            const aanvragenJaar = currentAanvragen.filter(req =>
                req.ambassadeurCode === a.code && new Date(req.datum).getFullYear() === jaar
            );
            return statusFilter === 'met-aanvraag' ? aanvragenJaar.length > 0 : aanvragenJaar.length === 0;
        });
    }

    sortAmbassadeursList(ambassadeurs);
    renderAmbassadeursTable(ambassadeurs);
    updateAmbassadeursStats(ambassadeurs);
}

function sortAmbassadeursTable(key) {
    if (ambSort.key === key) {
        ambSort.dir = ambSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        ambSort = { key, dir: 'asc' };
    }
    filterAmbassadeurs();
}

function renderAmbassadeursTable(ambassadeurs) {
    const tbody = document.getElementById('ambassadeurs-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const jaar = new Date().getFullYear();

    ambassadeurs.forEach(a => {
        const aanvragen = currentAanvragen.filter(req => req.ambassadeurCode === a.code);
        const aanvragenJaar = aanvragen.filter(req => new Date(req.datum).getFullYear() === jaar);
        const totaalUitgekeerd = aanvragen
            .filter(req => req.status === 'uitgekeerd')
            .reduce((sum, req) => sum + req.bedrag, 0);
        const laatste = aanvragen.length
            ? window.LiefLeed.formatDate(aanvragen.sort((x, y) => new Date(y.datum) - new Date(x.datum))[0].datum)
            : '-';

        const tr = document.createElement('tr');
        if (aanvragenJaar.length === 0) tr.classList.add('row-inactive');

        tr.innerHTML = `
            <td data-label="Code">${a.code}</td>
            <td data-label="Naam">${escapeHtml(a.naam)}</td>
            <td data-label="Straat">${escapeHtml(a.straat)}</td>
            <td data-label="Dit jaar">${aanvragenJaar.length}</td>
            <td data-label="Uitgekeerd">€${totaalUitgekeerd}</td>
            <td data-label="Laatste">${laatste}</td>
            <td data-label="Status">${aanvragenJaar.length > 0 ? 'Actief' : 'Nog geen aanvraag'}</td>
        `;

        tbody.appendChild(tr);
    });
}

function sortAmbassadeursList(list) {
    const jaar = new Date().getFullYear();
    list.sort((a, b) => {
        const valA = getAmbassadeurSortValue(a, ambSort.key, jaar);
        const valB = getAmbassadeurSortValue(b, ambSort.key, jaar);

        if (valA < valB) return ambSort.dir === 'asc' ? -1 : 1;
        if (valA > valB) return ambSort.dir === 'asc' ? 1 : -1;
        return 0;
    });
}

function getAmbassadeurSortValue(ambassadeur, key, jaar) {
    if (key === 'aanvragenJaar') {
        return currentAanvragen.filter(req =>
            req.ambassadeurCode === ambassadeur.code &&
            new Date(req.datum).getFullYear() === jaar
        ).length;
    }
    if (key === 'totaalUitgekeerd') {
        return currentAanvragen
            .filter(req => req.ambassadeurCode === ambassadeur.code && req.status === 'uitgekeerd')
            .reduce((sum, req) => sum + req.bedrag, 0);
    }

    const value = ambassadeur[key];
    return typeof value === 'string' ? value.toLowerCase() : value;
}

function updateAmbassadeursStats(ambassadeurs) {
    const jaar = new Date().getFullYear();
    const totaal = ambassadeurs.length;
    const actief = ambassadeurs.filter(a =>
        currentAanvragen.some(req => req.ambassadeurCode === a.code && new Date(req.datum).getFullYear() === jaar)
    ).length;

    document.getElementById('amb-totaal').textContent = totaal;
    document.getElementById('amb-actief').textContent = actief;
    document.getElementById('amb-inactief').textContent = totaal - actief;
}

function addAmbassadeurFromForm() {
    const naamInput = document.getElementById('new-amb-naam');
    const straatInput = document.getElementById('new-amb-straat');
    const naam = naamInput.value.trim();
    const straat = straatInput.value.trim();

    if (!naam || !straat) {
        alert('Vul zowel naam als straat in.');
        return;
    }

    const nieuwe = window.LiefLeed.addAmbassadeur(naam, straat);
    if (!nieuwe) {
        alert('Ambassadeur toevoegen mislukt.');
        return;
    }

    naamInput.value = '';
    straatInput.value = '';

    initFilters();
    filterAmbassadeurs();
    alert(`Ambassadeur toegevoegd: ${nieuwe.naam} (${nieuwe.straat})`);
}

// === Budget Display ===

function updateBudgetDisplay() {
    const budgetConfig = getBudgetConfig();
    const jaarFilterEl = document.getElementById('filter-jaar');
    if (!jaarFilterEl) return;

    const jaarFilter = jaarFilterEl.value;
    const jaar = jaarFilter !== 'alle' ? parseInt(jaarFilter, 10) : new Date().getFullYear();

    const aanvragenJaar = currentAanvragen.filter(a =>
        new Date(a.datum).getFullYear() === jaar
    );

    const uitgekeerd = aanvragenJaar
        .filter(a => a.status === 'uitgekeerd')
        .reduce((sum, a) => sum + a.bedrag, 0);

    const inBehandeling = aanvragenJaar
        .filter(a => a.status === 'in_behandeling' || a.status === 'nieuw')
        .reduce((sum, a) => sum + a.bedrag, 0);

    const resterend = Math.max(0, budgetConfig.jaarBudget - uitgekeerd - inBehandeling);

    const budgetJaarEl = document.getElementById('budget-jaar');
    if (budgetJaarEl) budgetJaarEl.textContent = jaar;

    document.getElementById('budget-totaal').textContent = `€${budgetConfig.jaarBudget.toLocaleString('nl-NL')}`;
    document.getElementById('budget-uitgekeerd').textContent = `€${uitgekeerd.toLocaleString('nl-NL')}`;
    document.getElementById('budget-openstaand').textContent = `€${inBehandeling.toLocaleString('nl-NL')}`;
    document.getElementById('budget-resterend').textContent = `€${resterend.toLocaleString('nl-NL')}`;

    const uitgekeerdPct = budgetConfig.jaarBudget ? (uitgekeerd / budgetConfig.jaarBudget) * 100 : 0;
    const openstaandPct = budgetConfig.jaarBudget ? (inBehandeling / budgetConfig.jaarBudget) * 100 : 0;

    document.getElementById('progress-uitgekeerd').style.width = `${Math.min(uitgekeerdPct, 100)}%`;
    document.getElementById('progress-openstaand').style.width = `${Math.min(openstaandPct, 100 - uitgekeerdPct)}%`;
}

// === Statistieken ===

function updateStats() {
    const jaarFilterEl = document.getElementById('filter-jaar');
    if (!jaarFilterEl) return;

    const jaarFilter = jaarFilterEl.value;
    let aanvragen = currentAanvragen;

    if (jaarFilter !== 'alle') {
        const jaar = parseInt(jaarFilter, 10);
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

    const headers = [
        'Referentie',
        'Datum',
        'Status',
        'Ambassadeur Code',
        'Ambassadeur Naam',
        'Straat',
        'Telefoon',
        'Aanleiding',
        'Besteding',
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

    const BOM = '\uFEFF';
    const csv = BOM + [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lief-leed-potje-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

function exportAmbassadeursToExcel() {
    const ambassadeurs = window.LiefLeed.getAmbassadeurs();
    if (ambassadeurs.length === 0) {
        alert('Geen ambassadeurs om te exporteren.');
        return;
    }

    const headers = ['Code', 'Naam', 'Straat'];
    const rows = ambassadeurs.map(a => [a.code, a.naam, a.straat]);
    const BOM = '\uFEFF';
    const csv = BOM + [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lief-leed-potje-ambassadeurs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

// === Status Updates ===

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
        renderAmbassadeurs();
    }
}

// === Details Modal ===

function showDetails(id) {
    const aanvraag = currentAanvragen.find(a => a.id === id);
    if (!aanvraag) return;

    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');

    body.innerHTML = `
        <h2 style="color: var(--night-blue); margin-bottom: var(--space-lg);">
            💰 Aanvraag ${aanvraag.id}
        </h2>

        <div style="margin-bottom: var(--space-lg); display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap;">
            <span class="status-badge ${aanvraag.status}" style="font-size: 1rem; padding: var(--space-sm) var(--space-md);">
                ${getStatusLabel(aanvraag.status)}
            </span>
            <span style="font-size: 1.5rem; font-weight: 700; color: var(--street-blue);">€${aanvraag.bedrag}</span>
        </div>

        <h3 style="margin-bottom: var(--space-sm);">👤 Straatambassadeur</h3>
        <table style="width: 100%; margin-bottom: var(--space-lg);">
            <tr><td style="color: var(--gray-500); padding: 4px 0; width: 140px;">Naam:</td><td><strong>${escapeHtml(aanvraag.ambassadeurNaam)}</strong></td></tr>
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Straat:</td><td>${escapeHtml(aanvraag.straat)}</td></tr>
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Code:</td><td>${aanvraag.ambassadeurCode}</td></tr>
            ${aanvraag.telefoon ? `<tr><td style="color: var(--gray-500); padding: 4px 0;">Telefoon:</td><td><a href="tel:${aanvraag.telefoon}">${escapeHtml(aanvraag.telefoon)}</a></td></tr>` : ''}
        </table>

        <h3 style="margin-bottom: var(--space-sm);">🎯 Aanleiding</h3>
        <div style="background: var(--accent-gold); border-radius: var(--radius-md); padding: var(--space-md); margin-bottom: var(--space-lg); font-weight: 600; color: var(--night-blue);">
            ${escapeHtml(aanvraag.reden)}
        </div>

        ${aanvraag.doel ? `
        <h3 style="margin-bottom: var(--space-sm);">📝 Besteding</h3>
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
                <button onclick="updateStatus('${aanvraag.id}', 'in_behandeling'); closeModal();" class="btn btn-warning">
                    ⏳ In behandeling nemen
                </button>
            ` : ''}
            ${aanvraag.status === 'in_behandeling' ? `
                <button onclick="updateStatus('${aanvraag.id}', 'uitgekeerd'); closeModal();" class="btn btn-success">
                    ✅ €${aanvraag.bedrag} Uitkeren
                </button>
            ` : ''}
            ${aanvraag.status !== 'afgewezen' && aanvraag.status !== 'uitgekeerd' ? `
                <button onclick="updateStatus('${aanvraag.id}', 'afgewezen'); closeModal();" class="btn btn-danger">
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

// === Utilities ===

function getStatusLabel(status) {
    const labels = {
        'nieuw': 'Nieuw',
        'in_behandeling': 'In behandeling',
        'uitgekeerd': 'Uitgekeerd',
        'afgewezen': 'Afgewezen'
    };
    return labels[status] || status;
}

function sortByKey(key, dir) {
    return (a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (key === 'datum') {
            valA = new Date(a.datum).getTime();
            valB = new Date(b.datum).getTime();
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
    };
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add shake animation for wrong PIN
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-6px); }
    40%, 80% { transform: translateX(6px); }
}
`;
document.head.appendChild(style);
