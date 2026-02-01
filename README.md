# 🌷 Lief & Leed Potje

Een webapp voor straatambassadeurs Vathorst om attenties aan te vragen bij bijzondere gebeurtenissen in de buurt.

## ✨ Features

### Must-haves ✅
- **Aanvraagformulier** met naam, straat, reden (dropdown), en details
- **Bonnetjes upload** met duidelijke melding over 3 jaar bewaren (belasting)
- **Email notificatie** naar coördinator bij nieuwe aanvraag
- **Status tracking**: in behandeling → goedgekeurd → uitgekeerd
- **Waarschuwing** als iemand al 2x dit jaar heeft aangevraagd (blokkeert niet)
- **Huisstijl**: blauw/geel met Delfts blauw accenten

### Nice-to-haves ✅
- **Admin dashboard** met overzicht alle aanvragen
- **Export naar Excel** (CSV formaat)
- **Statistieken** per straat en per reden

## 🚀 Deployment op Netlify

### Optie 1: Via Git
1. Push naar GitHub/GitLab
2. Verbind repo met Netlify
3. Deploy automatisch

### Optie 2: Drag & Drop
1. Ga naar [netlify.com](https://netlify.com)
2. Sleep de hele `lief-leed-potje` map naar de dropzone
3. Klaar!

## 📧 Email configuratie

De app ondersteunt email notificaties via [Web3Forms](https://web3forms.com/) (gratis, geen backend nodig).

### Setup:
1. Ga naar [web3forms.com](https://web3forms.com/)
2. Maak gratis account aan
3. Kopieer je access key
4. Open de browser console op de app en voer uit:
   ```javascript
   localStorage.setItem('web3formsKey', 'JOUW_ACCESS_KEY');
   ```

### Alternatief: Netlify Forms
Pas het formulier aan om Netlify Forms te gebruiken:
```html
<form name="aanvraag" method="POST" data-netlify="true">
```

## 🧪 Demo modus

Voeg `?demo` toe aan de URL om demo data te laden:
```
https://jouw-site.netlify.app/?demo
```

## 📁 Bestanden

```
lief-leed-potje/
├── index.html      # Aanvraagformulier
├── admin.html      # Beheer dashboard
├── styles.css      # Huisstijl
├── app.js          # Hoofdlogica
├── admin.js        # Admin functionaliteit
├── netlify.toml    # Netlify configuratie
└── README.md       # Deze documentatie
```

## 🎨 Huisstijl

| Element | Kleur |
|---------|-------|
| Primary Blue | `#1e3a5f` |
| Delft Blue | `#2c5aa0` |
| Accent Yellow | `#f4c430` |
| Light Blue | `#e8f1f8` |

## 📱 Responsive

De app werkt op alle apparaten: desktop, tablet en mobiel.

## 💾 Data opslag

Alle data wordt opgeslagen in localStorage. Dit betekent:
- ✅ Geen backend nodig
- ✅ Privacy-vriendelijk (data blijft lokaal)
- ⚠️ Data is per browser (niet gedeeld tussen apparaten)
- ⚠️ Wissen browserdata = data kwijt

Voor een gedeelde database, overweeg:
- Firebase Firestore (gratis tier)
- Supabase
- Airtable

---

Gemaakt met 💙 voor de buurt | © 2025 Straatambassadeurs Vathorst
