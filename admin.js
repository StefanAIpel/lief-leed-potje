// === Lief & Leed Potje - Admin Dashboard ===

let currentAanvragen = [];
let statsVisible = false;

// === Initialisatie ===

document.addEventListener('DOMContentLoaded', function() {
    loadAanvragen();
    
    // Escape sluit modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
});

// === Data Loading ===

function loadAanvragen() {
    currentAanvragen = window.LiefLeed.getAanvragen();
    filterAanvragen();
}

function filterAanvragen() {
    const statusFilter = document.getElementById('filter-status').value;
    const jaarFilter = document.getElementById('filter-jaar').value;
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
    
    // Zoek filter
    if (searchFilter) {
        filtered = filtered.filter(a => 
            a.aanvragerNaam.toLowerCase().includes(searchFilter) ||
            a.ontvangerNaam.toLowerCase().includes(searchFilter) ||
            a.aanvragerStraat.toLowerCase().includes(searchFilter) ||
            a.ontvangerAdres.toLowerCase().includes(searchFilter)
        );
    }
    
    // Sorteer op datum (nieuwste eerst)
    filtered.sort((a, b) => new Date(b.datum) - new Date(a.datum));
    
    renderAanvragen(filtered);
    updateStats();
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
                    <div class="aanvraag-title">${escapeHtml(a.ontvangerNaam)}</div>
                    <div class="aanvraag-meta">
                        <span>📍 ${escapeHtml(a.ontvangerAdres)}</span>
                        <span>📅 ${window.LiefLeed.formatDate(a.datum)}</span>
                    </div>
                </div>
                <span class="status-badge ${a.status}">${getStatusLabel(a.status)}</span>
            </div>
            
            <div class="aanvraag-details">
                <div class="detail-item">
                    <span class="detail-label">Reden:</span>
                    <span>${window.LiefLeed.getRedenLabel(a.reden)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Aanvrager:</span>
                    <span>${escapeHtml(a.aanvragerNaam)} (${escapeHtml(a.aanvragerStraat)})</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Referentie:</span>
                    <span>${a.id}</span>
                </div>
                ${a.bonnetjeNaam ? `
                <div class="detail-item">
                    <span class="detail-label">Bonnetje:</span>
                    <span>📎 ${escapeHtml(a.bonnetjeNaam)}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="aanvraag-actions">
                <button onclick="showDetails('${a.id}')" class="btn btn-secondary btn-small">
                    👁️ Details
                </button>
                ${a.status === 'in_behandeling' ? `
                    <button onclick="updateStatus('${a.id}', 'goedgekeurd')" class="btn btn-secondary btn-small" style="background: #d1fae5; color: #065f46;">
                        ✅ Goedkeuren
                    </button>
                    <button onclick="updateStatus('${a.id}', 'afgewezen')" class="btn btn-secondary btn-small" style="background: #fee2e2; color: #991b1b;">
                        ❌ Afwijzen
                    </button>
                ` : ''}
                ${a.status === 'goedgekeurd' ? `
                    <button onclick="updateStatus('${a.id}', 'uitgekeerd')" class="btn btn-secondary btn-small" style="background: #dbeafe; color: #1e40af;">
                        💰 Markeer als uitgekeerd
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getStatusLabel(status) {
    const labels = {
        'in_behandeling': 'In behandeling',
        'goedgekeurd': 'Goedgekeurd',
        'uitgekeerd': 'Uitgekeerd',
        'afgewezen': 'Afgewezen'
    };
    return labels[status] || status;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === Status Updates ===

function updateStatus(id, nieuweStatus) {
    const opmerking = prompt(`Opmerking bij statuswijziging naar "${getStatusLabel(nieuweStatus)}":`);
    if (opmerking === null) return; // Cancelled
    
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
    
    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');
    
    body.innerHTML = `
        <h2 style="color: var(--primary-blue); margin-bottom: var(--space-lg);">
            📋 Aanvraag ${aanvraag.id}
        </h2>
        
        <div style="margin-bottom: var(--space-lg);">
            <span class="status-badge ${aanvraag.status}" style="font-size: 1rem; padding: var(--space-sm) var(--space-md);">
                ${getStatusLabel(aanvraag.status)}
            </span>
        </div>
        
        <h3 style="margin-bottom: var(--space-sm);">👤 Aanvrager</h3>
        <table style="width: 100%; margin-bottom: var(--space-lg);">
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Naam:</td><td>${escapeHtml(aanvraag.aanvragerNaam)}</td></tr>
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Email:</td><td><a href="mailto:${escapeHtml(aanvraag.aanvragerEmail)}">${escapeHtml(aanvraag.aanvragerEmail)}</a></td></tr>
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Straat:</td><td>${escapeHtml(aanvraag.aanvragerStraat)}</td></tr>
        </table>
        
        <h3 style="margin-bottom: var(--space-sm);">🎁 Ontvanger</h3>
        <table style="width: 100%; margin-bottom: var(--space-lg);">
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Naam:</td><td>${escapeHtml(aanvraag.ontvangerNaam)}</td></tr>
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Adres:</td><td>${escapeHtml(aanvraag.ontvangerAdres)}</td></tr>
        </table>
        
        <h3 style="margin-bottom: var(--space-sm);">📝 Details</h3>
        <table style="width: 100%; margin-bottom: var(--space-lg);">
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Reden:</td><td>${window.LiefLeed.getRedenLabel(aanvraag.reden)}</td></tr>
            ${aanvraag.redenAnders ? `<tr><td style="color: var(--gray-500); padding: 4px 0;">Toelichting:</td><td>${escapeHtml(aanvraag.redenAnders)}</td></tr>` : ''}
            ${aanvraag.toelichting ? `<tr><td style="color: var(--gray-500); padding: 4px 0;">Extra info:</td><td>${escapeHtml(aanvraag.toelichting)}</td></tr>` : ''}
            ${aanvraag.gewensteAttentie ? `<tr><td style="color: var(--gray-500); padding: 4px 0;">Gewenst:</td><td>${escapeHtml(aanvraag.gewensteAttentie)}</td></tr>` : ''}
            <tr><td style="color: var(--gray-500); padding: 4px 0;">Ingediend:</td><td>${window.LiefLeed.formatDateTime(aanvraag.datum)}</td></tr>
        </table>
        
        ${aanvraag.bonnetje ? `
        <h3 style="margin-bottom: var(--space-sm);">📎 Bonnetje</h3>
        <div style="margin-bottom: var(--space-lg);">
            <p><strong>${escapeHtml(aanvraag.bonnetjeNaam)}</strong></p>
            ${aanvraag.bonnetje.startsWith('data:image') ? `
                <img src="${aanvraag.bonnetje}" alt="Bonnetje" style="max-width: 100%; border-radius: var(--radius-md); margin-top: var(--space-sm);">
            ` : `
                <a href="${aanvraag.bonnetje}" download="${aanvraag.bonnetjeNaam}" class="btn btn-secondary btn-small">
                    📥 Download
                </a>
            `}
        </div>
        ` : ''}
        
        <h3 style="margin-bottom: var(--space-sm);">📜 Status geschiedenis</h3>
        <div style="background: var(--gray-100); border-radius: var(--radius-md); padding: var(--space-md);">
            ${aanvraag.statusGeschiedenis.map(s => `
                <div style="margin-bottom: var(--space-sm); padding-bottom: var(--space-sm); border-bottom: 1px solid var(--gray-200);">
                    <div style="display: flex; justify-content: space-between;">
                        <span class="status-badge ${s.status}">${getStatusLabel(s.status)}</span>
                        <span style="color: var(--gray-500); font-size: 0.875rem;">${window.LiefLeed.formatDateTime(s.datum)}</span>
                    </div>
                    ${s.opmerking ? `<p style="margin-top: var(--space-xs); font-size: 0.875rem;">${escapeHtml(s.opmerking)}</p>` : ''}
                </div>
            `).reverse().join('')}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

// === Statistieken ===

function showStats() {
    const section = document.getElementById('stats-section');
    statsVisible = !statsVisible;
    
    if (statsVisible) {
        section.classList.remove('hidden');
        updateStats();
    } else {
        section.classList.add('hidden');
    }
}

function updateStats() {
    if (!statsVisible) return;
    
    const aanvragen = window.LiefLeed.getAanvragen();
    const huidigJaar = new Date().getFullYear();
    const ditJaar = aanvragen.filter(a => new Date(a.datum).getFullYear() === huidigJaar);
    
    // Totalen
    document.getElementById('stat-totaal').textContent = aanvragen.length;
    document.getElementById('stat-behandeling').textContent = aanvragen.filter(a => a.status === 'in_behandeling').length;
    document.getElementById('stat-goedgekeurd').textContent = aanvragen.filter(a => a.status === 'goedgekeurd').length;
    document.getElementById('stat-uitgekeerd').textContent = aanvragen.filter(a => a.status === 'uitgekeerd').length;
    
    // Per straat
    const perStraat = {};
    ditJaar.forEach(a => {
        const straat = a.aanvragerStraat;
        perStraat[straat] = (perStraat[straat] || 0) + 1;
    });
    
    document.getElementById('stats-per-straat').innerHTML = Object.entries(perStraat)
        .sort((a, b) => b[1] - a[1])
        .map(([straat, aantal]) => `
            <span class="stat-item">${escapeHtml(straat)}: <strong>${aantal}</strong></span>
        `).join('') || '<span class="stat-item">Nog geen data</span>';
    
    // Per reden
    const perReden = {};
    ditJaar.forEach(a => {
        const reden = a.reden;
        perReden[reden] = (perReden[reden] || 0) + 1;
    });
    
    document.getElementById('stats-per-reden').innerHTML = Object.entries(perReden)
        .sort((a, b) => b[1] - a[1])
        .map(([reden, aantal]) => `
            <span class="stat-item">${window.LiefLeed.getRedenLabel(reden)}: <strong>${aantal}</strong></span>
        `).join('') || '<span class="stat-item">Nog geen data</span>';
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
        'Aanvrager Naam',
        'Aanvrager Email',
        'Aanvrager Straat',
        'Ontvanger Naam',
        'Ontvanger Adres',
        'Reden',
        'Toelichting',
        'Gewenste Attentie',
        'Bonnetje'
    ];
    
    const rows = aanvragen.map(a => [
        a.id,
        window.LiefLeed.formatDateTime(a.datum),
        getStatusLabel(a.status),
        a.aanvragerNaam,
        a.aanvragerEmail,
        a.aanvragerStraat,
        a.ontvangerNaam,
        a.ontvangerAdres,
        window.LiefLeed.getRedenLabel(a.reden) + (a.redenAnders ? ': ' + a.redenAnders : ''),
        a.toelichting || '',
        a.gewensteAttentie || '',
        a.bonnetjeNaam || 'Geen'
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
    link.download = `lief-leed-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}
