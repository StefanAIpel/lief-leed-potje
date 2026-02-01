# 💰 Lief & Leed Potje

Een webapp voor straatambassadeurs in Vathorst & Hooglanderveen om hun €100 subsidie aan te vragen voor lief & leed activiteiten in hun straat.

**🏘️ Van de straat, voor de straat**

## ✨ Features

### 📝 Aanvraagformulier
- Selecteer je naam uit de ambassadeurslijst
- Automatisch straat invullen
- Reden kiezen: Geboorte, Diploma, Nieuwe bewoner, Ziekte, of eigen idee
- Bewijsstukken uploaden (foto's van bonnetjes)
- Administratie: zelf bewaren of naar kerngroep

### 📊 Admin Dashboard (PIN beveiligd)
- **PIN beveiliging:** 4-cijferige code (standaard: 2026)
- Overzicht van alle aanvragen
- Budget tracking per jaar
- Status beheer (nieuw → in behandeling → uitgekeerd)
- Excel export
- Filter op status, jaar, straat

### ℹ️ Info & Regels
- Uitleg Lief & Leed Potje (€100 per straat)
- Spelregels: max 2x per jaar, €10-15 per attentie
- Bonnetjes bewaren (3 jaar)
- Contact: straatambassadeursvhv@outlook.com

### 🎨 Huisstijl
- **Header:** Donkerblauw (#1a2744)
- **Accenten:** Goud/geel (#f4c542)
- **Logo:** Straatnaambord stijl
- **Footer:** Kleurrijke huisjes silhouet
- **Quote:** "Beter een goede buur dan een verre vriend" (Delfts blauw stijl)

### 📱 PWA (Progressive Web App)
- Installeerbaar op telefoon/tablet
- Offline beschikbaar
- App icons in alle formaten
- Service worker caching

## 🚀 Demo

Live: [lief-leed-potje.netlify.app](https://lief-leed-potje.netlify.app)

Voeg `?demo` toe aan de URL om testdata te laden.

## 🔐 Admin Toegang

De admin pagina is beveiligd met een PIN code:
- **Standaard PIN:** 2026
- **Wijzigen:** Via het PIN-icoon in de admin header
- **Vergrendelen:** Klik op 🔒

## 📁 Project Structuur

```
lief-leed-potje/
├── index.html          # Aanvraagformulier
├── admin.html          # Beheer dashboard
├── info.html           # Info & regels
├── styles.css          # Styling
├── app.js              # Formulier logica
├── admin.js            # Admin functionaliteit
├── sw.js               # Service worker
├── manifest.json       # PWA manifest
├── icons/              # App icons (PNG)
│   ├── icon.svg        # Bron icon
│   └── icon-*.png      # Gegenereerde icons
├── favicon.png         # Browser favicon
└── apple-touch-icon.png
```

## 🛠️ Development

### Icons genereren
```bash
npm install
node generate-icons.js
```

### Lokaal testen
Open `index.html` in je browser, of:
```bash
npx serve .
```

## 🙏 Credits

Gemaakt voor de Straatambassadeurs van Vathorst & Hooglanderveen.

---

© 2025 Straatambassadeurs VHV | Contact: straatambassadeursvhv@outlook.com
