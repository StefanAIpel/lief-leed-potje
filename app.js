// === Lief & Leed Potje - €100 Subsidie Systeem ===

// LocalStorage keys
const STORAGE_KEY = 'liefLeedAanvragen';
const CONFIG_KEY = 'liefLeedConfig';

// Configuratie
const config = {
    coordinatorEmail: 'stefan.dijkstra@gmail.com',
    coordinatorNaam: 'Stefan Dijkstra',
    bedragPerAanvraag: 100,
    maxAanvragenPerJaar: 2, // Waarschuwing bij meer dan dit
    bewaarTermijnJaren: 3,
    jaarBudget: 5000 // Optioneel: totaal budget per jaar
};

// === Straatambassadeurs Data ===
const straatambassadeurs = [
    { code: 'S1', naam: 'Alie Blanken', straat: 'Paulinapolder' },
    { code: 'S3', naam: 'Marjolijn Winter Visser', straat: 'Heideweg' },
    { code: 'S4', naam: 'Frank Venema', straat: 'Hofstede' },
    { code: 'S6', naam: 'Angelique Blom', straat: 'Johannes van Rossumlaan' },
    { code: 'S7', naam: 'Esther Arentsen', straat: 'Geulemerberg' },
    { code: 'S9', naam: 'Bejanca Eilander', straat: 'Zeisum' },
    { code: 'S10', naam: 'Lia Stok', straat: 'Hoekveen' },
    { code: 'S11', naam: 'Carien Veldhuis', straat: 'Lofoten' },
    { code: 'S13', naam: 'Miranda en Hans van Kley', straat: 'Dirk van Weelaan' },
    { code: 'S16', naam: 'Annemiek van Raalten', straat: 'Durgerdamhaven' },
    { code: 'S17', naam: 'Purdey Hof', straat: 'Laaxumstraat' },
    { code: 'S18', naam: 'Florance Palm', straat: 'Laakboulevard' },
    { code: 'S20', naam: 'Kundike Sinselmeijer', straat: 'De Gavel' },
    { code: 'S22', naam: 'Ellen Siegers', straat: 'Weteringkade' },
    { code: 'S23', naam: 'Monica de Jong', straat: 'Archemerberg' },
    { code: 'S25', naam: 'Henny Rouwhorst', straat: 'Heideweg' },
    { code: 'S26', naam: 'Stefan Dijkstra', straat: 'Beemster' },
    { code: 'S27', naam: 'Sanne Poort', straat: 'Tankenberg' },
    { code: 'S28', naam: 'Eline Stoffer', straat: 'Riesenberg' },
    { code: 'S29', naam: 'Corrine van Wee', straat: 'Landweg' },
    { code: 'S30', naam: 'Judith Jonkers', straat: 'Zwarte Zee' },
    { code: 'S31', naam: 'Bianca Blom', straat: 'Boterberg' },
    { code: 'S32', naam: 'Richard Kamer', straat: 'Lauwersmeer' },
    { code: 'S33', naam: 'Karin Heinen', straat: 'Zijpenberg' },
    { code: 'S34', naam: 'Janine Frederiks', straat: 'Ameliapolder' },
    { code: 'S35', naam: 'Jet Kroes', straat: 'Emminkhuizerberg' },
    { code: 'S36', naam: 'Rene van de Most', straat: 'Suzannepolder' },
    { code: 'S37', naam: 'Anika Blessing', straat: 'Straat van Dover' },
    { code: 'S38', naam: 'Esther Visser', straat: 'Eilandspolder' },
    { code: 'S39', naam: 'Ingrid Siepel', straat: 'Eschberg' },
    { code: 'S40', naam: 'Jeannette Bijl', straat: 'Braamberg' },
    { code: 'S41', naam: 'Hanna Herbers', straat: 'Vijlenerberg' },
    { code: 'S42', naam: 'Ewa Albering', straat: 'Kolhornkade' },
    { code: 'S43', naam: 'Miranda van Buitenen', straat: 'Laan van Bovenduist' }
];

// === Data Management ===

function getAanvragen() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAanvragen(aanvragen) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aanvragen));
}

function generateId() {
    return 'LP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
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

// === Ambassadeur functies ===

function getAmbassadeurByCode(code) {
    return straatambassadeurs.find(a => a.code === code);
}

function getAmbassadeurByNaam(naam) {
    return straatambassadeurs.find(a => a.naam.toLowerCase() === naam.toLowerCase());
}

// === Aanvraag Check ===

function getAanvragenVoorAmbassadeur(ambassadeurCode, jaar = null) {
    const aanvragen = getAanvragen();
    const targetJaar = jaar || new Date().getFullYear();
    
    return aanvragen.filter(a => {
        const aanvraagJaar = new Date(a.datum).getFullYear();
        return aanvraagJaar === targetJaar && a.ambassadeurCode === ambassadeurCode;
    });
}

function checkVorigeAanvragen(ambassadeurCode) {
    const aanvragen = getAanvragen();
    // Alle aanvragen van deze ambassadeur, gesorteerd op datum
    return aanvragen
        .filter(a => a.ambassadeurCode === ambassadeurCode)
        .sort((a, b) => new Date(b.datum) - new Date(a.datum));
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
    
    // Vul ambassadeurs dropdown
    const ambassadeurSelect = document.getElementById('ambassadeur');
    const straatInput = document.getElementById('straat');
    
    straatambassadeurs.forEach(amb => {
        const option = document.createElement('option');
        option.value = amb.code;
        option.textContent = `${amb.naam} - ${amb.straat}`;
        ambassadeurSelect.appendChild(option);
    });
    
    // Update straat bij selectie
    ambassadeurSelect.addEventListener('change', function() {
        const ambassadeur = getAmbassadeurByCode(this.value);
        if (ambassadeur) {
            straatInput.value = ambassadeur.straat;
            checkAmbassadeurHistory(ambassadeur);
        } else {
            straatInput.value = '';
            hideWarningBanner();
            document.getElementById('vorige-pot-section').style.display = 'none';
        }
    });
    
    // IBAN validatie en formatting
    const ibanInput = document.getElementById('iban');
    if (ibanInput) {
        ibanInput.addEventListener('input', function(e) {
            // Verwijder alles behalve letters en cijfers
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            
            // Format met spaties (NL00 BANK 0000 0000 00)
            let formatted = '';
            for (let i = 0; i < value.length && i < 18; i++) {
                if (i === 4 || i === 8 || i === 12 || i === 16) {
                    formatted += ' ';
                }
                formatted += value[i];
            }
            e.target.value = formatted;
            
            // Validatie feedback
            const hint = document.getElementById('iban-hint');
            if (value.length > 0 && value.length < 18) {
                hint.style.color = '#dc2626';
                hint.textContent = 'IBAN is nog niet compleet';
            } else if (value.length === 18 && value.startsWith('NL')) {
                hint.style.color = '#059669';
                hint.textContent = '✓ IBAN ziet er goed uit';
            } else if (value.length === 18) {
                hint.style.color = '#d97706';
                hint.textContent = 'Let op: geen Nederlands IBAN';
            } else {
                hint.style.color = '#6b7280';
                hint.textContent = 'Nederlands IBAN formaat: NL## XXXX 0000 0000 00';
            }
        });
    }
    
    // Reden dropdown - toon/verberg eigen idee veld
    const redenSelect = document.getElementById('reden');
    const eigenIdeeGroup = document.getElementById('eigen-idee-group');
    const eigenIdeeInput = document.getElementById('eigen-idee');
    
    if (redenSelect && eigenIdeeGroup) {
        redenSelect.addEventListener('change', function() {
            if (this.value === 'eigen_idee') {
                eigenIdeeGroup.style.display = 'block';
                eigenIdeeInput.required = true;
            } else {
                eigenIdeeGroup.style.display = 'none';
                eigenIdeeInput.required = false;
                eigenIdeeInput.value = '';
            }
        });
    }
    
    // File upload preview
    const fileInput = document.getElementById('bewijsstukken');
    const filePreview = document.getElementById('file-preview');
    
    if (fileInput && filePreview) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                const fileList = Array.from(this.files).map(file => 
                    `<div class="file-item">📄 <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)</div>`
                ).join('');
                filePreview.innerHTML = fileList;
                filePreview.classList.remove('hidden');
            } else {
                filePreview.classList.add('hidden');
            }
        });
    }
    
    // Form submit
    form.addEventListener('submit', handleFormSubmit);
}

function checkAmbassadeurHistory(ambassadeur) {
    const vorigeAanvragen = checkVorigeAanvragen(ambassadeur.code);
    const aanvragenDitJaar = getAanvragenVoorAmbassadeur(ambassadeur.code);
    const vorigePotSection = document.getElementById('vorige-pot-section');
    
    // Toon vorige pot sectie als er eerdere aanvragen zijn
    if (vorigeAanvragen.length > 0) {
        vorigePotSection.style.display = 'block';
    } else {
        vorigePotSection.style.display = 'none';
    }
    
    // Waarschuwing bij meerdere aanvragen dit jaar
    if (aanvragenDitJaar.length >= config.maxAanvragenPerJaar) {
        showWarningBanner(
            `Let op: ${ambassadeur.naam} heeft dit jaar al ${aanvragenDitJaar.length}x een potje aangevraagd. ` +
            `Je kunt nog steeds doorgaan, maar controleer of dit correct is.`
        );
    } else if (aanvragenDitJaar.length > 0) {
        showWarningBanner(
            `${ambassadeur.naam} heeft dit jaar al ${aanvragenDitJaar.length}x een potje aangevraagd. ` +
            `Nog ${config.maxAanvragenPerJaar - aanvragenDitJaar.length} aanvra${config.maxAanvragenPerJaar - aanvragenDitJaar.length === 1 ? 'ag' : 'gen'} mogelijk.`
        );
    } else {
        hideWarningBanner();
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const ambassadeurCode = formData.get('ambassadeur');
    const ambassadeur = getAmbassadeurByCode(ambassadeurCode);
    
    if (!ambassadeur) {
        alert('Selecteer een geldige straatambassadeur');
        return;
    }
    
    // Bepaal reden
    let reden = formData.get('reden');
    if (reden === 'eigen_idee') {
        const eigenIdee = formData.get('eigen-idee');
        if (!eigenIdee || !eigenIdee.trim()) {
            alert('Vul je eigen idee in');
            return;
        }
        reden = eigenIdee.trim();
    }
    
    // Verzamel data
    const aanvraag = {
        id: generateId(),
        datum: new Date().toISOString(),
        status: 'nieuw',
        
        // Ambassadeur info
        ambassadeurCode: ambassadeur.code,
        ambassadeurNaam: ambassadeur.naam,
        straat: ambassadeur.straat,
        telefoon: formData.get('telefoon') || '',
        
        // Aanvraag details
        reden: reden,
        vorigeToelichting: formData.get('vorige-toelichting') || '',
        doel: formData.get('doel') || '',
        
        // Betaalgegevens
        rekeninghouder: formData.get('rekeninghouder') || '',
        iban: formData.get('iban') || '',
        
        // Verhaal (optioneel)
        straatverhaal: formData.get('straatverhaal') || '',
        
        // Administratie
        administratie: formData.get('administratie'),
        
        // Bewijsstukken (als base64)
        bewijsstukken: [],
        
        // Bedrag
        bedrag: config.bedragPerAanvraag,
        
        // Tracking
        statusGeschiedenis: [{
            status: 'nieuw',
            datum: new Date().toISOString(),
            opmerking: 'Aanvraag ingediend'
        }]
    };
    
    // Verwerk bewijsstukken
    const bewijsstukkenFiles = document.getElementById('bewijsstukken').files;
    if (bewijsstukkenFiles && bewijsstukkenFiles.length > 0) {
        for (const file of bewijsstukkenFiles) {
            try {
                const base64 = await fileToBase64(file);
                aanvraag.bewijsstukken.push({
                    naam: file.name,
                    type: file.type,
                    data: base64
                });
            } catch (err) {
                console.error('Fout bij uploaden bestand:', err);
            }
        }
    }
    
    // Opslaan
    const aanvragen = getAanvragen();
    aanvragen.push(aanvraag);
    saveAanvragen(aanvragen);
    
    // Email notificatie
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
    // Console log voor nu
    console.log('📧 Email zou worden verzonden naar:', config.coordinatorEmail);
    console.log('Onderwerp: Nieuwe Lief & Leed Potje aanvraag van', aanvraag.ambassadeurNaam);
    
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
                    subject: `💰 Nieuwe Potje aanvraag: ${aanvraag.ambassadeurNaam} (${aanvraag.straat})`,
                    from_name: 'Lief & Leed Potje',
                    to: config.coordinatorEmail,
                    message: `
Nieuwe aanvraag voor €100 Lief & Leed Potje!

📋 AANVRAAG DETAILS
━━━━━━━━━━━━━━━━━━━
Referentie: ${aanvraag.id}
Datum: ${formatDateTime(aanvraag.datum)}
Bedrag: €${aanvraag.bedrag}

👤 STRAATAMBASSADEUR
Naam: ${aanvraag.ambassadeurNaam}
Straat: ${aanvraag.straat}
Code: ${aanvraag.ambassadeurCode}
${aanvraag.telefoon ? `Telefoon: ${aanvraag.telefoon}` : ''}

🎯 REDEN
${aanvraag.reden}

${aanvraag.doel ? `📝 TOELICHTING
${aanvraag.doel}

` : ''}${aanvraag.vorigeToelichting ? `📋 VORIG POTJE GEBRUIKT VOOR:
${aanvraag.vorigeToelichting}

` : ''}📁 ADMINISTRATIE
${aanvraag.administratie === 'zelf' ? 'Ambassadeur bewaart zelf de administratie' : 'Administratie naar kerngroep sturen'}

📎 Bewijsstukken: ${aanvraag.bewijsstukken.length > 0 ? `${aanvraag.bewijsstukken.length} bestand(en) geüpload` : 'Geen'}

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

function resetForm() {
    const form = document.getElementById('aanvraag-form');
    form.reset();
    form.classList.remove('hidden');
    document.getElementById('success-message').classList.add('hidden');
    document.getElementById('file-preview').classList.add('hidden');
    document.getElementById('vorige-pot-section').style.display = 'none';
    document.getElementById('straat').value = '';
    
    const eigenIdeeGroup = document.getElementById('eigen-idee-group');
    if (eigenIdeeGroup) {
        eigenIdeeGroup.style.display = 'none';
    }
    
    hideWarningBanner();
}

// === PWA / Service Worker ===

function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    }
}

// === Initialisatie ===

document.addEventListener('DOMContentLoaded', function() {
    initForm();
    initServiceWorker();
    
    // Demo data voor testing (verwijder in productie)
    if (getAanvragen().length === 0 && window.location.search.includes('demo')) {
        loadDemoData();
    }
});

function loadDemoData() {
    const demoData = [
        {
            id: 'LP-DEMO01',
            datum: '2025-01-10T10:30:00Z',
            status: 'uitgekeerd',
            ambassadeurCode: 'S27',
            ambassadeurNaam: 'Sanne Poort',
            straat: 'Tankenberg',
            telefoon: '',
            reden: 'Geboorte',
            vorigeToelichting: '',
            doel: 'Bloemen voor familie van Dijk bij geboorte tweeling, kaartje voor buurman na operatie.',
            administratie: 'zelf',
            bewijsstukken: [],
            bedrag: 100,
            statusGeschiedenis: [
                { status: 'nieuw', datum: '2025-01-10T10:30:00Z', opmerking: 'Aanvraag ingediend' },
                { status: 'in_behandeling', datum: '2025-01-10T14:00:00Z', opmerking: 'In behandeling genomen' },
                { status: 'uitgekeerd', datum: '2025-01-12T09:00:00Z', opmerking: '€100 overgemaakt' }
            ]
        },
        {
            id: 'LP-DEMO02',
            datum: '2025-01-28T14:15:00Z',
            status: 'nieuw',
            ambassadeurCode: 'S31',
            ambassadeurNaam: 'Bianca Blom',
            straat: 'Boterberg',
            telefoon: '06-12345678',
            reden: 'Nieuwe bewoner',
            vorigeToelichting: '',
            doel: 'Welkomstpakket voor 3 nieuwe gezinnen in de straat.',
            administratie: 'kerngroep',
            bewijsstukken: [],
            bedrag: 100,
            statusGeschiedenis: [
                { status: 'nieuw', datum: '2025-01-28T14:15:00Z', opmerking: 'Aanvraag ingediend' }
            ]
        },
        {
            id: 'LP-DEMO03',
            datum: '2025-01-25T09:00:00Z',
            status: 'in_behandeling',
            ambassadeurCode: 'S26',
            ambassadeurNaam: 'Stefan Dijkstra',
            straat: 'Beemster',
            telefoon: '',
            reden: 'Buurtborrel',
            vorigeToelichting: 'Vorig jaar gebruikt voor kerstpakketten voor alleenstaande ouderen.',
            doel: 'Buurtborrel organiseren voor nieuwe bewoners.',
            administratie: 'zelf',
            bewijsstukken: [],
            bedrag: 100,
            statusGeschiedenis: [
                { status: 'nieuw', datum: '2025-01-25T09:00:00Z', opmerking: 'Aanvraag ingediend' },
                { status: 'in_behandeling', datum: '2025-01-25T11:30:00Z', opmerking: 'Wordt bekeken' }
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
    config,
    straatambassadeurs,
    getAmbassadeurByCode,
    getAmbassadeurByNaam
};
