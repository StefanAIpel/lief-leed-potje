# DNS Records — straatambassadeurs.nl

Instructies voor het instellen van DNS records bij **TransIP** voor het domein `straatambassadeurs.nl`.

## MX Records (e-mail ontvangen via ImprovMX)

Reeds ingesteld (controleer of deze correct staan):

| Type | Naam | Waarde | Prioriteit |
|------|------|--------|-----------|
| MX | @ | mx1.improvmx.com | 10 |
| MX | @ | mx2.improvmx.com | 20 |

## SPF Record (e-mail verzenden)

**Dit record moet worden toegevoegd.** Het voorkomt dat e-mails van straatambassadeurs.nl als spam worden gemarkeerd.

| Type | Naam | Waarde |
|------|------|--------|
| TXT | @ | `v=spf1 include:spf.improvmx.com include:amazonses.com ~all` |

### Wat doet dit?
- `include:spf.improvmx.com` — staat ImprovMX toe om e-mail te forwarden
- `include:amazonses.com` — staat Amazon SES (via Resend) toe om e-mail te verzenden namens @straatambassadeurs.nl
- `~all` — soft fail voor alle andere afzenders

## DKIM (e-mail authenticatie)

DKIM is al geconfigureerd via **Resend** (die Amazon SES gebruikt). Resend plaatst automatisch DKIM-handtekeningen op uitgaande e-mails.

> ⚠️ Check in het Resend dashboard of er DKIM DNS records moeten worden toegevoegd voor het domein. Meestal zijn dit 3 CNAME records die Resend aanlevert bij domeinverificatie.

## Hoe toe te voegen bij TransIP

1. Log in op [TransIP Controlpanel](https://www.transip.nl/cp/)
2. Ga naar **Domeinen** → `straatambassadeurs.nl`
3. Klik op **DNS** (of DNS-instellingen)
4. Voeg een nieuw **TXT record** toe:
   - **Naam:** `@` (of leeg laten, afhankelijk van TransIP)
   - **Type:** TXT
   - **Waarde:** `v=spf1 include:spf.improvmx.com include:amazonses.com ~all`
   - **TTL:** 3600 (standaard)
5. Sla op en wacht 1-24 uur op DNS propagatie

### Controleren

Na instelling kun je checken via:
- https://mxtoolbox.com/spf.aspx — voer `straatambassadeurs.nl` in
- https://mail-tester.com — stuur een test-e-mail
