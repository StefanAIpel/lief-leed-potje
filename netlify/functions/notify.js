// Email notificatie functie voor Straatambassadeurs
// Stuurt email naar kerngroep + bevestiging naar aanvrager

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const { type, data, turnstileToken } = JSON.parse(event.body);

        // Honeypot check — als een honeypot veld is ingevuld, reject silently
        if (data.website || data.company) {
            console.log('🍯 Honeypot triggered — spam rejected');
            return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }

        // Cloudflare Turnstile verificatie
        // TODO: Voeg TURNSTILE_SECRET_KEY toe als environment variable in Netlify
        const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
        if (TURNSTILE_SECRET && turnstileToken) {
            const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: TURNSTILE_SECRET,
                    response: turnstileToken
                })
            });
            const turnstileResult = await turnstileResponse.json();
            if (!turnstileResult.success) {
                console.log('❌ Turnstile verificatie mislukt:', turnstileResult);
                return {
                    statusCode: 403,
                    body: JSON.stringify({ error: 'Beveiligingscheck mislukt. Probeer het opnieuw.' })
                };
            }
            console.log('✅ Turnstile verificatie geslaagd');
        }

        // Email configuratie (via environment variables in Netlify)
        const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'straatambassadeursvhv@outlook.com';
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const FROM_EMAIL = process.env.FROM_EMAIL || 'Straatambassadeurs <noreply@straatambassadeurs.nl>';
        
        let kerngroepSubject, kerngroepBody;
        let aanvragerSubject, aanvragerBody, aanvragerEmail;
        
        if (type === 'aanmelding') {
            // Email naar kerngroep
            kerngroepSubject = `🙋 Nieuwe aanmelding: ${data.naam}`;
            kerngroepBody = `
Nieuwe aanmelding als straatambassadeur!

Naam: ${data.naam}
Straat: ${data.straat}
Telefoon: ${data.telefoon}
Email: ${data.email || '-'}
Groepsapp: ${data.groepsapp ? 'Ja' : 'Nee'}
Bron: ${data.bron || '-'}
Motivatie: ${data.motivatie || '-'}

Datum: ${new Date().toLocaleString('nl-NL')}

Neem contact op via: ${data.telefoon}
            `.trim();
            
            // Bevestigingsmail naar aanvrager
            if (data.email) {
                aanvragerEmail = data.email;
                aanvragerSubject = `Bedankt voor je aanmelding als Straatambassadeur! 🙋`;
                aanvragerBody = `
Beste ${data.naam},

Bedankt voor je aanmelding als straatambassadeur voor ${data.straat}!

Iemand van de kerngroep neemt binnenkort contact met je op om je aanmelding definitief te maken.

Heb je in de tussentijd vragen? Stuur dan een berichtje naar straatambassadeursvhv@outlook.com

Met vriendelijke groet,
De Kerngroep Straatambassadeurs
Vathorst & Hooglanderveen

---
Van de straat, voor de straat 🧡
                `.trim();
            }
            
        } else if (type === 'potje') {
            // Email naar kerngroep
            kerngroepSubject = `🧡 Nieuwe potje aanvraag: ${data.ambassadeur_naam || data.naam}`;
            kerngroepBody = `
Nieuwe Lief & Leed potje aanvraag!

Ambassadeur: ${data.ambassadeur_naam || data.naam}
Straat: ${data.straat}
Telefoon: ${data.telefoon}

Doel: ${data.doel}

Betaalgegevens:
IBAN: ${data.iban}
Tenaamstelling: ${data.tenaamstelling}

Administratie: ${data.administratie === 'zelf' ? 'Bewaart zelf' : 'Levert aan bij kerngroep'}

${data.bonnetjes_urls ? `Bijlagen:\n${(() => { try { return JSON.parse(data.bonnetjes_urls).map(b => `- ${b.name}: ${b.url}`).join('\n'); } catch(e) { return '-'; }})()}` : ''}

${data.ervaring ? `Gedeelde ervaring:\n${data.ervaring}` : ''}

Datum: ${new Date().toLocaleString('nl-NL')}
            `.trim();
            
            // Bevestigingsmail naar aanvrager
            if (data.email) {
                aanvragerEmail = data.email;
                aanvragerSubject = `Je Lief & Leed potje aanvraag is ontvangen! 🧡`;
                aanvragerBody = `
Beste ${data.ambassadeur_naam || data.naam},

Bedankt voor je aanvraag voor een Lief & Leed potje!

De kerngroep neemt je aanvraag in behandeling. Je ontvangt bericht wanneer het potje van €100 is overgemaakt naar:
IBAN: ${data.iban}
t.n.v.: ${data.tenaamstelling}

Heb je vragen? Stuur een berichtje naar straatambassadeursvhv@outlook.com

Met vriendelijke groet,
De Kerngroep Straatambassadeurs
Vathorst & Hooglanderveen

---
Van de straat, voor de straat 🧡
                `.trim();
            }
            
        } else if (type === 'toewijzing') {
            // Email naar kerngroep
            kerngroepSubject = `✅ Potje toegewezen: ${data.ambassadeur_naam}`;
            kerngroepBody = `
Lief & Leed potje is toegewezen!

Ambassadeur: ${data.ambassadeur_naam}
Straat: ${data.straat}
Doel: ${data.doel}

Bedrag: €${data.bedrag || 100}
IBAN: ${data.iban}
Tenaamstelling: ${data.tenaamstelling}

Status: UITGEKEERD ✅

Toegewezen door: Kerngroep beheerder
Datum: ${new Date().toLocaleString('nl-NL')}
            `.trim();
            
            // Bevestigingsmail naar aanvrager
            if (data.email) {
                aanvragerEmail = data.email;
                aanvragerSubject = `Goed nieuws! Je Lief & Leed potje is toegekend 🎉`;
                aanvragerBody = `
Beste ${data.ambassadeur_naam},

Goed nieuws! Je aanvraag voor het Lief & Leed potje is goedgekeurd door de kerngroep! 🎉

Het bedrag van €${data.bedrag || 100} wordt zo spoedig mogelijk overgemaakt naar:
IBAN: ${data.iban}
t.n.v.: ${data.tenaamstelling}

📋 Vergeet niet:
- Bewaar de bonnetjes/facturen van je uitgaven
- ${data.administratie === 'zelf' ? 'Je hebt aangegeven zelf de administratie te bewaren (minimaal 3 jaar)' : 'Lever je bonnetjes aan bij de kerngroep'}
- Het potje is bedoeld voor: ${data.doel}

Heel veel plezier met jullie buurtactiviteit! 🧡

Heb je vragen? Stuur een berichtje naar straatambassadeursvhv@outlook.com

Met hartelijke groet,
De Kerngroep Straatambassadeurs
Vathorst & Hooglanderveen

---
Van de straat, voor de straat 🧡
                `.trim();
            }
            
        } else if (type === 'afrekening') {
            const keuzeLabels = {
                'doorgaan': '✅ Gaat door met huidig potje',
                'nieuw_potje': '🔄 Wil nieuw potje aanvragen',
                'stoppen': '🛑 Stopt als straatambassadeur'
            };
            kerngroepSubject = `📋 Potje afrekening: ${data.ambassadeur_naam} - ${data.straat}`;
            kerngroepBody = `
Er is een potje afrekening ingediend.

Ambassadeur: ${data.ambassadeur_naam}
Straat: ${data.straat}
Telefoon: ${data.telefoon || '-'}
Email: ${data.email || '-'}

Totaal uitgaven: € ${data.afrekening_totaal || '0,00'}
Keuze: ${keuzeLabels[data.keuze] || data.keuze}

${data.bonnetjes_urls ? `Bijlagen:\n${(() => { try { return JSON.parse(data.bonnetjes_urls).map(b => `- ${b.name}: ${b.url}`).join('\n'); } catch(e) { return '-'; }})()}` : ''}

Datum: ${new Date().toLocaleString('nl-NL')}

Bekijk de details in het admin panel:
https://straatambassadeurs.nl/admin.html
            `.trim();

            if (data.email) {
                aanvragerEmail = data.email;
                aanvragerSubject = `Bevestiging: je potje afrekening is ontvangen`;
                
                let keuzeText = '';
                if (data.keuze === 'doorgaan') {
                    keuzeText = 'Je hebt aangegeven door te gaan met je huidige potje. Fijn dat je actief blijft als straatambassadeur! 🧡';
                } else if (data.keuze === 'nieuw_potje') {
                    keuzeText = 'Je hebt aangegeven een nieuw potje te willen aanvragen. Dat kan direct via:\nhttps://straatambassadeurs.nl/potje-aanvragen.html';
                } else if (data.keuze === 'stoppen') {
                    keuzeText = `Je hebt aangegeven te willen stoppen als straatambassadeur. Bedankt voor je inzet!\n\nHeb je nog geld over van je potje? Maak het resterende bedrag over naar:\n\nS.P.M. Dijkstra\nNL95 RABO 0316 4897 51\no.v.v. afrekening potje ${data.straat}`;
                }

                aanvragerBody = `
Beste ${data.ambassadeur_naam},

Bedankt voor het indienen van je potje afrekening. De kerngroep heeft je gegevens ontvangen en zal deze verwerken.

${keuzeText}

Heb je vragen? Mail ons via info@straatambassadeurs.nl

Met hartelijke groet,
De Kerngroep Straatambassadeurs
Vathorst & Hooglanderveen

---
Van de straat, voor de straat 🧡
                `.trim();
            }

        } else if (type === 'afwijzing') {
            // Email naar kerngroep
            kerngroepSubject = `❌ Potje afgewezen: ${data.ambassadeur_naam}`;
            kerngroepBody = `
Lief & Leed potje aanvraag is afgewezen.

Ambassadeur: ${data.ambassadeur_naam}
Straat: ${data.straat}
Doel: ${data.doel}

Reden: ${data.reden || 'Geen reden opgegeven'}

Status: AFGEWEZEN ❌

Afgewezen door: Kerngroep beheerder
Datum: ${new Date().toLocaleString('nl-NL')}
            `.trim();
            
            // Email naar aanvrager
            if (data.email) {
                aanvragerEmail = data.email;
                aanvragerSubject = `Update over je Lief & Leed potje aanvraag`;
                aanvragerBody = `
Beste ${data.ambassadeur_naam},

Bedankt voor je aanvraag voor het Lief & Leed potje.

Helaas heeft de kerngroep besloten om je aanvraag op dit moment niet toe te kennen.

${data.reden ? `Reden: ${data.reden}` : ''}

We begrijpen dat dit teleurstellend kan zijn. Neem gerust contact op met de kerngroep als je vragen hebt of als je de aanvraag opnieuw wilt indienen:
📧 straatambassadeursvhv@outlook.com

We waarderen je inzet als straatambassadeur enorm! 🧡

Met vriendelijke groet,
De Kerngroep Straatambassadeurs
Vathorst & Hooglanderveen

---
Van de straat, voor de straat 🧡
                `.trim();
            }
            
        } else if (type === 'aanmelding_goedgekeurd') {
            // Email naar kerngroep
            kerngroepSubject = `✅ Aanmelding goedgekeurd: ${data.naam}`;
            kerngroepBody = `
Nieuwe ambassadeur goedgekeurd!

Naam: ${data.naam}
Straat: ${data.straat}
Telefoon: ${data.telefoon}
Email: ${data.email || '-'}

Status: GOEDGEKEURD ✅

Datum: ${new Date().toLocaleString('nl-NL')}
            `.trim();
            
            // Welkomstmail naar nieuwe ambassadeur
            if (data.email) {
                aanvragerEmail = data.email;
                aanvragerSubject = `Welkom als Straatambassadeur! 🎉🧡`;
                aanvragerBody = `
Beste ${data.naam},

Geweldig nieuws — je bent officieel straatambassadeur voor ${data.straat}! 🎉

Wat betekent dit?
- Je bent het aanspreekpunt voor lief & leed in jouw straat
- Je kunt een Lief & Leed potje aanvragen (€100 beschikbaar)
- Je maakt deel uit van een netwerk van betrokken buurtbewoners

💰 Potje aanvragen?
Ga naar straatambassadeurs.nl en klik op "Potje aanvragen" wanneer je een mooi initiatief hebt voor jouw straat.

Heb je vragen? De kerngroep staat altijd voor je klaar:
📧 straatambassadeursvhv@outlook.com

Welkom bij de Straatambassadeurs! 🧡

Met hartelijke groet,
De Kerngroep Straatambassadeurs
Vathorst & Hooglanderveen

---
Van de straat, voor de straat 🧡
                `.trim();
            }
            
        } else if (type === 'aanmelding_afgewezen') {
            // Email naar kerngroep
            kerngroepSubject = `❌ Aanmelding afgewezen: ${data.naam}`;
            kerngroepBody = `
Aanmelding als ambassadeur afgewezen.

Naam: ${data.naam}
Straat: ${data.straat}
Reden: ${data.reden || 'Geen reden opgegeven'}

Datum: ${new Date().toLocaleString('nl-NL')}
            `.trim();
            
            // Email naar afgewezen aanmelder
            if (data.email) {
                aanvragerEmail = data.email;
                aanvragerSubject = `Update over je aanmelding als Straatambassadeur`;
                aanvragerBody = `
Beste ${data.naam},

Bedankt voor je interesse om straatambassadeur te worden voor ${data.straat}.

Helaas kunnen we je aanmelding op dit moment niet goedkeuren.

${data.reden ? `Reden: ${data.reden}` : ''}

Neem gerust contact op als je vragen hebt:
📧 straatambassadeursvhv@outlook.com

Met vriendelijke groet,
De Kerngroep Straatambassadeurs
Vathorst & Hooglanderveen

---
Van de straat, voor de straat 🧡
                `.trim();
            }
            
        } else if (type === 'meer_info_aanvraag') {
            // Kerngroep notificatie
            kerngroepSubject = `ℹ️ Meer info gevraagd: ${data.ambassadeur_naam}`;
            kerngroepBody = `
Meer informatie gevraagd voor potje aanvraag.

Ambassadeur: ${data.ambassadeur_naam}
Straat: ${data.straat}
Doel: ${data.doel}

Gestelde vraag: ${data.vraag}

Status: INFO GEVRAAGD ℹ️

Datum: ${new Date().toLocaleString('nl-NL')}
            `.trim();
            
            // Email naar aanvrager
            if (data.email) {
                aanvragerEmail = data.email;
                aanvragerSubject = `Vraag over je Lief & Leed potje aanvraag`;
                aanvragerBody = `
Beste ${data.ambassadeur_naam},

Bedankt voor je aanvraag voor het Lief & Leed potje voor ${data.straat}.

De kerngroep heeft je aanvraag bekeken en heeft nog een vraag:

${data.vraag}

Je kunt reageren door te mailen naar straatambassadeursvhv@outlook.com

Met vriendelijke groet,
De Kerngroep Straatambassadeurs
Vathorst & Hooglanderveen

---
Van de straat, voor de straat 🧡
                `.trim();
            }
            
        } else if (type === 'meer_info_aanmelding') {
            // Kerngroep notificatie
            kerngroepSubject = `ℹ️ Meer info gevraagd: ${data.naam}`;
            kerngroepBody = `
Meer informatie gevraagd voor aanmelding als ambassadeur.

Naam: ${data.naam}
Straat: ${data.straat}

Gestelde vraag: ${data.vraag}

Status: INFO GEVRAAGD ℹ️

Datum: ${new Date().toLocaleString('nl-NL')}
            `.trim();
            
            // Email naar aanmelder
            if (data.email) {
                aanvragerEmail = data.email;
                aanvragerSubject = `Vraag over je aanmelding als Straatambassadeur`;
                aanvragerBody = `
Beste ${data.naam},

Bedankt voor je aanmelding als straatambassadeur voor ${data.straat}!

De kerngroep heeft je aanmelding bekeken en heeft nog een vraag:

${data.vraag}

Je kunt reageren door te mailen naar straatambassadeursvhv@outlook.com

Met vriendelijke groet,
De Kerngroep Straatambassadeurs
Vathorst & Hooglanderveen

---
Van de straat, voor de straat 🧡
                `.trim();
            }
            
        } else if (type === 'contact') {
            kerngroepSubject = `📬 Contactformulier: ${data.onderwerp}`;
            kerngroepBody = `
Nieuw bericht via contactformulier

Naam: ${data.naam}
Email: ${data.email}
Onderwerp: ${data.onderwerp}

Bericht:
${data.bericht}

Datum: ${new Date().toLocaleString('nl-NL')}
            `.trim();
            
            // Bevestigingsmail naar afzender
            if (data.email) {
                aanvragerEmail = data.email;
                aanvragerSubject = `Bericht ontvangen — ${data.onderwerp} 📬`;
                aanvragerBody = `
Beste ${data.naam},

Bedankt voor je bericht! We hebben het volgende ontvangen:

Onderwerp: ${data.onderwerp}

Je bericht:
${data.bericht}

We proberen binnen een paar dagen te reageren.

Heb je in de tussentijd vragen? Mail ons gerust op straatambassadeursvhv@outlook.com

Met vriendelijke groet,
De Kerngroep Straatambassadeurs
Vathorst & Hooglanderveen

---
Van de straat, voor de straat 🧡
straatambassadeurs.nl
                `.trim();
            }
        }

        // Log voor debugging (Netlify logs)
        console.log(`📧 Notification: ${kerngroepSubject}`);
        console.log(`To kerngroep: ${NOTIFY_EMAIL}`);
        if (aanvragerEmail) {
            console.log(`Bevestiging naar: ${aanvragerEmail}`);
        }
        
        // HTML email template wrapper
        function wrapInHtmlTemplate(textBody, recipientName) {
            const lines = textBody.split('\n').map(line => {
                if (line.startsWith('---')) return '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">';
                if (line.trim() === '') return '<br>';
                return `<p style="margin: 0 0 8px 0; line-height: 1.6;">${line}</p>`;
            }).join('\n');
            
            return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background: linear-gradient(135deg, #1a2744 0%, #2855a3 100%); padding: 24px 32px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 4px;">🧡</div>
          <h1 style="color: #f4c542; margin: 0; font-size: 18px; font-weight: 700;">Straatambassadeurs</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Vathorst & Hooglanderveen</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding: 32px; color: #1f2937; font-size: 15px;">
          ${lines}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Straatambassadeurs Vathorst & Hooglanderveen</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #9ca3af;">Van de straat, voor de straat 🧡</p>
          <p style="margin: 8px 0 0; font-size: 11px; color: #d1d5db;"><a href="https://straatambassadeurs.nl" style="color: #2855a3; text-decoration: none;">straatambassadeurs.nl</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
        }
        
        // Verstuur emails via Resend als API key beschikbaar is
        if (RESEND_API_KEY) {
            const sendEmail = async (to, subject, text, useHtml = false) => {
                const payload = {
                    from: FROM_EMAIL,
                    to: to,
                    subject: subject,
                    text: text
                };
                
                // Add HTML version for aanvrager emails (nicer formatting)
                if (useHtml) {
                    payload.html = wrapInHtmlTemplate(text);
                }
                
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const error = await response.text();
                    console.error(`Email error: ${error}`);
                    throw new Error(`Email failed: ${error}`);
                }
                
                return response.json();
            };
            
            // Stuur naar kerngroep (plain text is fine)
            await sendEmail(NOTIFY_EMAIL, kerngroepSubject, kerngroepBody, false);
            console.log('✅ Kerngroep email verstuurd');
            
            // Stuur bevestiging naar aanvrager (HTML formatted)
            if (aanvragerEmail && aanvragerSubject && aanvragerBody) {
                await sendEmail(aanvragerEmail, aanvragerSubject, aanvragerBody, true);
                console.log('✅ Bevestigingsmail verstuurd naar aanvrager');
            }
            
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Emails verstuurd' })
            };
        } else {
            // Geen API key - alleen loggen
            console.log('⚠️ Geen RESEND_API_KEY - emails niet verstuurd');
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Notification logged (no email service configured)' })
            };
        }
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process notification' })
        };
    }
};
