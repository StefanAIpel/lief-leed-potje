# 💰 Lief & Leed Potje

Een webapp voor straatambassadeurs in Vathorst & Hooglanderveen om hun €100 subsidie aan te vragen voor lief & leed activiteiten in hun straat.

## 🎯 Wat is het?

- ~50 straatambassadeurs kunnen €100 per keer aanvragen
- Maximum 1-2x per jaar (waarschuwing, niet geblokkeerd)
- Stefan Dijkstra beheert de subsidiegelden
- Zolang de voorraad (jaarbudget) strekt

## ✨ Features

### Aanvraagformulier
- Dropdown met alle 34 straatambassadeurs (naam + straat)
- Automatisch straat invullen bij selectie
- Telefoonnummer (optioneel, voor verificatie)
- Toelichting vorig potje (als eerder aangevraagd)
- Doel nieuwe €100 beschrijving
- Administratie keuze: zelf bewaren OF naar kerngroep
- Bewijsstukken uploaden (optioneel, meerdere bestanden)

### Admin Dashboard
- Budget overzicht met progress bar
- Status flow: Nieuw → In behandeling → Uitgekeerd
- Filters: status, jaar, straat, zoeken
- Statistieken per status
- Excel export
- Instelbaar jaarbudget

## 🎨 Huisstijl

- Blauw/geel kleurenschema
- Delfts blauw accenten
- Nunito font
- Responsive design

## 🚀 Deployment

Statische site - deploy naar Netlify, Vercel, of GitHub Pages.

```bash
# Via Netlify CLI
netlify deploy --prod

# Of gewoon de bestanden uploaden naar je hosting
```

## 📁 Bestanden

```
lief-leed-potje/
├── index.html      # Aanvraagformulier
├── admin.html      # Beheer dashboard
├── app.js          # Hoofdapplicatie + ambassadeurs data
├── admin.js        # Admin dashboard logica
├── styles.css      # Huisstijl
├── netlify.toml    # Netlify configuratie
└── README.md       # Dit bestand
```

## 🗃️ Data

Data wordt opgeslagen in localStorage. Voor productie wordt aanbevolen:
- Netlify Forms of Web3Forms voor email notificaties
- Airtable, Supabase, of Firebase voor persistente opslag

### Straatambassadeurs

34 ambassadeurs zijn ingebouwd in `app.js`:
- S1 t/m S43 (niet alle nummers gebruikt)
- Elk met code, naam en straat

## 🔧 Configuratie

In `app.js`:
```javascript
const config = {
    coordinatorEmail: 'stefan.dijkstra@gmail.com',
    bedragPerAanvraag: 100,
    maxAanvragenPerJaar: 2,
    bewaarTermijnJaren: 3
};
```

Budget kan worden ingesteld in het admin dashboard (opgeslagen in localStorage).

## 📧 Email Notificaties

Optioneel via Web3Forms:
1. Registreer op web3forms.com
2. Verkrijg je access key
3. Sla op in localStorage: `localStorage.setItem('web3formsKey', 'jouw-key')`

## 🧪 Demo Modus

Voeg `?demo` toe aan de URL om demo data te laden:
- `index.html?demo`
- `admin.html?demo`

## 📜 Licentie

MIT - Vrij te gebruiken voor de buurt!

---

Gemaakt met 💙 voor Straatambassadeurs Vathorst & Hooglanderveen
