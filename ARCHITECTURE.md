# 🏗️ Straatambassadeurs VHV — Technische Architectuur

## Voor wie is dit document?
Externe ontwikkelaars, beheerders, of iedereen die de codebase wil begrijpen of eraan wil bijdragen.

---

## 📋 Overzicht

**Wat:** Website + admin dashboard voor Straatambassadeurs Vathorst & Hooglanderveen (Amersfoort).
**Doel:** Beheer van ~40 ambassadeurs, €100 lief & leed subsidie per straat, aanvragen, afrekeningen, nieuws en contact.
**Live:** https://straatambassadeurs.nl (Netlify)

---

## 🏛️ Architectuur

### Stack
| Component | Technologie | Toelichting |
|-----------|-------------|-------------|
| **Frontend** | Vanilla HTML/CSS/JS | Geen framework, geen build step |
| **Styling** | `styles.css` (custom) | Huisstijl: donkerblauw (#1a2744) + goud (#f4c542) |
| **Database** | Supabase (PostgreSQL) | Hosted, EU (eu-central-1) |
| **Auth** | PIN-based (custom) | Geen Supabase Auth, eigen PIN systeem via Netlify Functions |
| **Email** | Resend API | Transactional emails (welkom, toewijzing, afwijzing) |
| **Spam** | Cloudflare Turnstile | CAPTCHA op formulieren |
| **Hosting** | Netlify | Static site + serverless functions |
| **DNS** | TransIP | straatambassadeurs.nl → Netlify |
| **PWA** | Service Worker | Installeerbaar, offline-capable |

### Waarom geen framework?
Bewuste keuze. De site is:
- Klein genoeg voor vanilla JS (~11.000 regels totaal)
- Geen build step = makkelijker te onderhouden
- Instant deploybaar (HTML bestanden → Netlify)
- Elke HTML pagina is zelfstandig (eigen inline JS)

---

## 📁 Bestandsstructuur

```
lief-leed-potje/
├── index.html                 # Homepage (landing page)
├── admin.html                 # 🔒 Admin dashboard (PIN beveiligd)
├── aanmelden.html             # Aanmeldformulier nieuwe ambassadeurs
├── contact.html               # Contactformulier
├── handleiding.html           # Handleiding voor ambassadeurs
├── handleiding-kerngroep.html # Handleiding voor kerngroep
├── kaart.html                 # Google Maps kaart met alle ambassadeurs
├── nieuws.html                # Nieuwspagina (uit Supabase)
├── over-sa.html               # Over Straatambassadeurs
├── over-kerngroep.html        # Over de kerngroep
├── potje-aanvragen.html       # Lief & Leed potje aanvraagformulier
├── potje-afrekenen.html       # Afrekening/bonnetjes formulier
├── privacy.html               # Privacyverklaring (AVG)
├── taskflow.html              # Intern taakbeheer
│
├── styles.css                 # Centrale stylesheet
├── supabase-config.js         # Supabase client initialisatie
├── form-validation.js         # Gedeelde validatie (telefoon, IBAN, email)
├── search.js                  # Full-text zoekfunctie
├── search-index.js            # Zoekindex (gegenereerd)
├── build-search-index.js      # Script om zoekindex te bouwen
├── ambassadeurs-data.js       # Statische ambassadeurslijst (fallback)
│
├── netlify/functions/         # Serverless functions
│   ├── admin-api.js           # Admin operaties (CRUD)
│   ├── notify.js              # Email notificaties via Resend
│   ├── verify-pin.js          # PIN verificatie
│   ├── reset-pin.js           # PIN reset
│   └── send-initial-pins.js   # Initiële PIN distributie
│
├── netlify.toml               # Netlify config (redirects, headers)
├── _redirects                 # Netlify redirect regels
├── manifest.json              # PWA manifest
├── sw.js                      # Service Worker
│
├── docs/                      # Documenten (PDF)
│   ├── notulen-kerngroep.pdf
│   ├── supabase-dpa.pdf       # Data Processing Agreement
│   └── supabase-tia.pdf       # Transfer Impact Assessment
│
└── icons/                     # App icons
```

---

## 🗃️ Database (Supabase)

**Project:** `knxdefuncbzzbrunhlxg`
**Region:** EU Central 1 (Frankfurt)

### Tabellen

| Tabel | Doel | Sleutelvelden |
|-------|------|---------------|
| `ambassadeurs` | Alle ambassadeurs | id (UUID), naam, straat, email, telefoon, status |
| `aanvragen` | Lief & Leed aanvragen | id, ambassadeur_id (FK), reden, bedrag, status |
| `potje_toekenningen` | €100 toekenningen | id, ambassadeur_id, jaar, bedrag |
| `potje_uitgaven` | Uitgaven/bonnetjes | id, toekenning_id, omschrijving, bedrag |
| `potje_afrekeningen` | Afrekeningen | id, ambassadeur_id, periode, totaal |
| `financien` | Financieel overzicht | id, kostenplaats (KPL), bedrag, omschrijving |
| `notulen` | Vergadernotulen | id, datum, inhoud |
| `contactberichten` | Contactformulier | id, naam, email, bericht, beantwoord |
| `nieuws` | Nieuwsberichten | id, titel, inhoud, gepubliceerd, datum |

### Belangrijke details
- `ambassadeurs.id` = **UUID type** (niet bigint!) — cruciaal bij foreign keys
- Alle tabellen hebben `created_at` timestamp
- Row Level Security (RLS) is aan, policies per tabel
- `supabaseClient` (niet `supabase.from()`) gebruiken in frontend

### Kostenplaatsen (KPL)
| Code | Omschrijving |
|------|-------------|
| 10 | Gerry (<2025) |
| 20 | SME VHV H1 2025 |
| 30 | SPM Dijkstra H2 2025 |
| 31 | SPM Dijkstra 2026 |
| 90 | Overig |

---

## 🔒 Authenticatie

Geen Supabase Auth. Custom PIN systeem:
1. Admin opent `admin.html`
2. Voert 6-cijferige PIN in
3. `verify-pin.js` (Netlify Function) checkt PIN tegen env var `ADMIN_PIN`
4. Bij succes: sessie opgeslagen in `sessionStorage`
5. Elke admin actie stuurt PIN mee als verificatie

**Admin PIN:** Opgeslagen als `ADMIN_PIN` environment variable in Netlify.

---

## 📧 Email (Resend)

- **Domein:** straatambassadeurs.nl (geverifieerd)
- **From:** noreply@straatambassadeurs.nl
- **Netlify Function:** `notify.js` handelt alle emails af
- **Templates:** Inline HTML in de function
- **Types:** Welkom, toewijzing €100, afwijzing, contactbevestiging

---

## 🛡️ Beveiliging

- **Cloudflare Turnstile** op alle publieke formulieren
- **Security headers** via `netlify.toml` (X-Frame-Options, nosniff, referrer-policy)
- **Supabase RLS** op alle tabellen
- **PIN auth** voor admin (niet token-based, bewuste keuze voor eenvoud)
- **IBAN validatie** met mod-97 check
- **Telefoon validatie** (NL format)

---

## 🎨 Design Systeem

### Kleuren
```css
--primary: #1a2744;      /* Donkerblauw (header, nav) */
--accent: #f4c542;       /* Goud/geel (buttons, accenten) */
--text: #333;            /* Body tekst */
--bg: #f5f5f5;           /* Achtergrond */
--card-bg: #ffffff;      /* Kaart achtergrond */
```

### Componenten
- **Header:** Donkerblauw met logo + hamburger menu (mobiel)
- **Cards:** Wit met subtiele schaduw
- **Buttons:** Goud met donkerblauwe tekst
- **Footer:** Kleurrijke huisjes silhouet + "Beter een goede buur dan een verre vriend"
- **Modal systeem:** `openModal(title, bodyHtml, footerHtml, options)` — altijd deze functie gebruiken

### Responsive
- Mobile-first
- Hamburger menu op <768px
- Cards stapelen verticaal op mobiel
- Tabellen worden scrollbaar op small screens

---

## 🚀 Deployment

### Netlify
- **Site:** straatambassadeurs.nl (Netlify site ID: cd611c88-7323-43d0-a143-772ee3cf0d4d)
- **Deploy:** Handmatig via `netlify deploy --prod --dir=.` of Git push
- **Functions:** Automatisch uit `netlify/functions/`
- **Env vars nodig:**
  - `ADMIN_PIN` — Admin PIN code
  - `RESEND_API_KEY` — Resend email API
  - `SUPABASE_SERVICE_ROLE_KEY` — Voor server-side DB operaties
  - `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile verificatie

### DNS (TransIP)
- `@` A record → 75.2.60.5 (Netlify)
- `www` CNAME → apex-loadbalancer.netlify.com
- MX → mail.transip.email (email forwarding)

---

## 🔧 Lokaal Ontwikkelen

```bash
# Clone
git clone https://github.com/StefanAIpel/lief-leed-potje.git
cd lief-leed-potje

# Serveer lokaal
npx serve . -p 3000

# Of gewoon index.html openen in browser
# (Supabase werkt direct, is CDN-based)
```

### Zoekindex updaten
```bash
node build-search-index.js
# Genereert search-index.js met content van alle pagina's
```

---

## ⚠️ Bekende Aandachtspunten

1. **Supabase namespace:** Gebruik `supabaseClient.from()` of `supabaseDb.from()`, NIET `supabase.from()` (CDN conflict)
2. **UUID's:** ambassadeurs.id is UUID, niet auto-increment integer
3. **Modal systeem:** Altijd `openModal()` gebruiken, `modal-body`/`modal-overlay` klassen bestaan NIET
4. **Inline styles:** Overschrijven CSS — altijd checken bij font-size wijzigingen
5. **CSS cache:** Na wijzigingen `styles.css?v=xxx` versie-string updaten
6. **Email FROM:** Altijd `noreply@straatambassadeurs.nl` (niet outlook adres)
7. **Firebase:** NIET gebruikt — alles draait op Supabase

---

## 📞 Contact

- **Kerngroep:** straatambassadeursvhv@outlook.com
- **Technisch:** Stefan Appel (via Chris AI assistent)
- **Repo:** github.com/StefanAIpel/lief-leed-potje

---

*Laatst bijgewerkt: 14 februari 2026*
