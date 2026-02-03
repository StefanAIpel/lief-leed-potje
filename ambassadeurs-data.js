// Straatambassadeurs Data - Vathorst & Hooglanderveen
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

// Populate dropdown
function populateAmbassadeurs() {
    const select = document.getElementById('ambassadeur');
    if (!select) return;
    
    // Clear existing options except first
    select.innerHTML = '<option value="">-- Selecteer je naam --</option>';
    
    // Sort alphabetically by name
    const sorted = [...straatambassadeurs].sort((a, b) => a.naam.localeCompare(b.naam));
    
    sorted.forEach(sa => {
        const option = document.createElement('option');
        option.value = sa.code;
        option.textContent = sa.naam;
        option.dataset.straat = sa.straat;
        select.appendChild(option);
    });
    
    // Auto-fill straat on selection
    select.addEventListener('change', function() {
        const straatInput = document.getElementById('straat');
        if (straatInput && this.selectedOptions[0]) {
            straatInput.value = this.selectedOptions[0].dataset.straat || '';
        }
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', populateAmbassadeurs);
