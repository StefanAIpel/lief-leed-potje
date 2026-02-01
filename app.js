// === Lief & Leed Potje - Hoofdapplicatie ===

// LocalStorage keys
const STORAGE_KEY = 'liefLeedAanvragen';
const CONFIG_KEY = 'liefLeedConfig';

// Configuratie
const config = {
    coordinatorEmail: 'stefan.dijkstra@gmail.com',
    maxAanvragenPerJaar: 2, // Waarschuwing bij meer dan 2
    bewaarTermijnJaren: 3
};

// === Data Management ===

function getAanvragen() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAanvragen(aanvragen) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aanvragen));
}

function generateId() {
    return 'LL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// === Aanvraag Check ===

function checkAantalAanvragen(naam, straat) {
    const aanvragen = getAanvragen();
    const huidigJaar = new Date().getFullYear();
    
    // Zoek aanvragen van dezelfde persoon dit jaar
    const aanvragenDitJaar = aanvragen.filter(a => {
        const aanvraagJaar = new Date(a.datum).getFullYear();
        return aanvraagJaar === huidigJaar && 
               a.aanvragerNaam.toLowerCase() === naam.toLowerCase() &&
               a.aanvragerStraat.toLowerCase() === straat.toLowerCase();
    });
    
    return aanvragenDitJaar.length;
}

function showWarningBanner(message) {
    const banner = document.getElementById('warning-banner');
    if (banner) {
        banner.querySelector('.warning-text').textContent = message;
        banner.classList.remove('hidden');
    }
}

function hideWarningBanner() {
    const banner = document.getElementById('warning-banner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

// === Form Handling ===

function initForm() {
    const form = document.getElementById('aanvraag-form');
    if (!form) return;
    
    // Reden "Anders" toggle
    const redenSelect = document.getElementById('reden');
    const andersContainer = document.getElementById('anders-container');
    
    redenSelect.addEventListener('change', function() {
        if (this.value === 'anders') {
            andersContainer.style.display = 'block';
            document.getElementById('reden-anders').required = true;
        } else {
            andersContainer.style.display = 'none';
            document.getElementById('reden-anders').required = false;
        }
    });
    
    // Check aantal aanvragen bij naam/straat wijziging
    const naamInput = document.getElementById('aanvrager-naam');
    const straatInput = document.getElementById('aanvrager-straat');
    
    function checkAndWarn() {
        const naam = naamInput.value.trim();
        const straat = straatInput.value.trim();
        
        if (naam && straat) {
            const aantal = checkAantalAanvragen(naam, straat);
            if (aantal >= config.maxAanvragenPerJaar) {
                showWarningBanner(`Let op: ${naam} heeft dit jaar al ${aantal}x een aanvraag ingediend. U kunt nog steeds doorgaan.`);
            } else {
                hideWarningBanner();
            }
        }
    }
    
    naamInput.addEventListener('blur', checkAndWarn);
    straatInput.addEventListener('blur', checkAndWarn);
    
    // File upload preview
    const fileInput = document.getElementById('bonnetje');
    const filePreview = document.getElementById('file-preview');
    
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            filePreview.innerHTML = `
                <span>📄</span>
                <span><strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)</span>
            `;
            filePreview.classList.remove('hidden');
        } else {
            filePreview.classList.add('hidden');
        }
    });
    
    // Form submit
    form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Verzamel data
    const aanvraag = {
        id: generateId(),
        datum: new Date().toISOString(),
        status: 'in_behandeling',
        
        // Aanvrager
        aanvragerNaam: formData.get('aanvrager-naam'),
        aanvragerEmail: formData.get('aanvrager-email'),
        aanvragerStraat: formData.get('aanvrager-straat'),
        
        // Ontvanger
        ontvangerNaam: formData.get('ontvanger-naam'),
        ontvangerAdres: formData.get('ontvanger-adres'),
        
        // Details
        reden: formData.get('reden'),
        redenAnders: formData.get('reden-anders') || '',
        toelichting: formData.get('toelichting') || '',
        gewensteAttentie: formData.get('gewenste-attentie') || '',
        
        // Bonnetje (als base64)
        bonnetje: null,
        bonnetjeNaam: null,
        
        // Tracking
        statusGeschiedenis: [{
            status: 'in_behandeling',
            datum: new Date().toISOString(),
            opmerking: 'Aanvraag ingediend'
        }]
    };
    
    // Verwerk bonnetje
    const bonnetjeFile = document.getElementById('bonnetje').files[0];
    if (bonnetjeFile) {
        try {
            aanvraag.bonnetje = await fileToBase64(bonnetjeFile);
            aanvraag.bonnetjeNaam = bonnetjeFile.name;
        } catch (err) {
            console.error('Fout bij uploaden bonnetje:', err);
        }
    }
    
    // Opslaan
    const aanvragen = getAanvragen();
    aanvragen.push(aanvraag);
    saveAanvragen(aanvragen);
    
    // Email notificatie (via Netlify Forms of Web3Forms)
    await sendEmailNotification(aanvraag);
    
    // Toon succes
    document.getElementById('aanvraag-form').classList.add('hidden');
    document.getElementById('success-message').classList.remove('hidden');
    
    console.log('Aanvraag opgeslagen:', aanvraag);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function sendEmailNotification(aanvraag) {
    // Optie 1: Netlify Forms (als je het form aanpast)
    // Optie 2: Web3Forms (gratis, geen backend nodig)
    // Optie 3: EmailJS
    
    // Voor nu: console log + localStorage flag
    console.log('📧 Email zou worden verzonden naar:', config.coordinatorEmail);
    console.log('Onderwerp: Nieuwe Lief & Leed aanvraag van', aanvraag.aanvragerNaam);
    
    // Probeer Web3Forms als het geconfigureerd is
    const web3formsKey = localStorage.getItem('web3formsKey');
    if (web3formsKey) {
        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_key: web3formsKey,
                    subject: `🌷 Nieuwe Lief & Leed aanvraag: ${getRedenLabel(aanvraag.reden)}`,
                    from_name: 'Lief & Leed Potje',
                    to: config.coordinatorEmail,
                    message: `
Nieuwe aanvraag ontvangen!

📋 AANVRAAG DETAILS
━━━━━━━━━━━━━━━━━━━
Referentie: ${aanvraag.id}
Datum: ${formatDateTime(aanvraag.datum)}

👤 AANVRAGER
Naam: ${aanvraag.aanvragerNaam}
Email: ${aanvraag.aanvragerEmail}
Straat: ${aanvraag.aanvragerStraat}

🎁 ONTVANGER
Naam: ${aanvraag.ontvangerNaam}
Adres: ${aanvraag.ontvangerAdres}

📝 REDEN
${getRedenLabel(aanvraag.reden)}
${aanvraag.redenAnders ? `Toelichting: ${aanvraag.redenAnders}` : ''}
${aanvraag.toelichting ? `Extra info: ${aanvraag.toelichting}` : ''}
${aanvraag.gewensteAttentie ? `Gewenste attentie: ${aanvraag.gewensteAttentie}` : ''}

📎 Bonnetje: ${aanvraag.bonnetjeNaam ? 'Ja, geüpload' : 'Nee'}

━━━━━━━━━━━━━━━━━━━
Bekijk alle aanvragen in het admin dashboard.
                    `.trim()
                })
            });
            
            if (response.ok) {
                console.log('✅ Email verzonden via Web3Forms');
            }
        } catch (err) {
            console.error('Email versturen mislukt:', err);
        }
    }
}

function getRedenLabel(reden) {
    const labels = {
        'geboorte': '🎀 Geboorte',
        'overlijden': '🕯️ Overlijden',
        'ziekte': '💐 Ziekte / Herstel',
        'huwelijk': '💒 Huwelijk / Jubileum',
        'verhuizing': '🏡 Welkom nieuwe buren',
        'afscheid': '👋 Afscheid (verhuizing)',
        'anders': '📝 Anders'
    };
    return labels[reden] || reden;
}

function resetForm() {
    document.getElementById('aanvraag-form').reset();
    document.getElementById('aanvraag-form').classList.remove('hidden');
    document.getElementById('success-message').classList.add('hidden');
    document.getElementById('file-preview').classList.add('hidden');
    hideWarningBanner();
}

// === Initialisatie ===

document.addEventListener('DOMContentLoaded', function() {
    initForm();
    
    // Demo data voor testing (verwijder in productie)
    if (getAanvragen().length === 0 && window.location.search.includes('demo')) {
        loadDemoData();
    }
});

function loadDemoData() {
    const demoData = [
        {
            id: 'LL-DEMO01',
            datum: '2025-01-15T10:30:00Z',
            status: 'uitgekeerd',
            aanvragerNaam: 'Marie de Vries',
            aanvragerEmail: 'marie@example.com',
            aanvragerStraat: 'Rozengracht',
            ontvangerNaam: 'Familie Jansen',
            ontvangerAdres: 'Rozengracht 12',
            reden: 'geboorte',
            redenAnders: '',
            toelichting: 'Eerste kindje!',
            gewensteAttentie: 'Bos bloemen',
            bonnetje: null,
            bonnetjeNaam: null,
            statusGeschiedenis: [
                { status: 'in_behandeling', datum: '2025-01-15T10:30:00Z', opmerking: 'Aanvraag ingediend' },
                { status: 'goedgekeurd', datum: '2025-01-15T14:00:00Z', opmerking: 'Goedgekeurd door Stefan' },
                { status: 'uitgekeerd', datum: '2025-01-16T09:00:00Z', opmerking: 'Bloemen bezorgd' }
            ]
        },
        {
            id: 'LL-DEMO02',
            datum: '2025-01-28T14:15:00Z',
            status: 'in_behandeling',
            aanvragerNaam: 'Pieter Bakker',
            aanvragerEmail: 'pieter@example.com',
            aanvragerStraat: 'Tulpenlaan',
            ontvangerNaam: 'Mevrouw van Dam',
            ontvangerAdres: 'Tulpenlaan 45',
            reden: 'ziekte',
            redenAnders: '',
            toelichting: 'Ligt in ziekenhuis na operatie',
            gewensteAttentie: 'Kaart en plantje',
            bonnetje: null,
            bonnetjeNaam: null,
            statusGeschiedenis: [
                { status: 'in_behandeling', datum: '2025-01-28T14:15:00Z', opmerking: 'Aanvraag ingediend' }
            ]
        },
        {
            id: 'LL-DEMO03',
            datum: '2025-01-25T09:00:00Z',
            status: 'goedgekeurd',
            aanvragerNaam: 'Linda Smit',
            aanvragerEmail: 'linda@example.com',
            aanvragerStraat: 'Kerkweg',
            ontvangerNaam: 'Familie de Boer',
            ontvangerAdres: 'Kerkweg 8',
            reden: 'overlijden',
            redenAnders: '',
            toelichting: 'Vader is overleden',
            gewensteAttentie: 'Rouwboeket',
            bonnetje: null,
            bonnetjeNaam: null,
            statusGeschiedenis: [
                { status: 'in_behandeling', datum: '2025-01-25T09:00:00Z', opmerking: 'Aanvraag ingediend' },
                { status: 'goedgekeurd', datum: '2025-01-25T11:30:00Z', opmerking: 'Goedgekeurd' }
            ]
        }
    ];
    
    saveAanvragen(demoData);
    console.log('Demo data geladen');
}

// Export functies voor andere modules
window.LiefLeed = {
    getAanvragen,
    saveAanvragen,
    formatDate,
    formatDateTime,
    getRedenLabel,
    config
};
