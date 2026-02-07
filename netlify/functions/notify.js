// Email notificatie functie voor Straatambassadeurs
// Stuurt email naar kerngroep + bevestiging naar aanvrager

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const { type, data } = JSON.parse(event.body);
        
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

De kerngroep neemt je aanvraag in behandeling. Je ontvangt bericht wanneer de €100 is overgemaakt naar:
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
        
        // Verstuur emails via Resend als API key beschikbaar is
        if (RESEND_API_KEY) {
            const sendEmail = async (to, subject, text) => {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: FROM_EMAIL,
                        to: to,
                        subject: subject,
                        text: text
                    })
                });
                
                if (!response.ok) {
                    const error = await response.text();
                    console.error(`Email error: ${error}`);
                    throw new Error(`Email failed: ${error}`);
                }
                
                return response.json();
            };
            
            // Stuur naar kerngroep
            await sendEmail(NOTIFY_EMAIL, kerngroepSubject, kerngroepBody);
            console.log('✅ Kerngroep email verstuurd');
            
            // Stuur bevestiging naar aanvrager
            if (aanvragerEmail && aanvragerSubject && aanvragerBody) {
                await sendEmail(aanvragerEmail, aanvragerSubject, aanvragerBody);
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
