// Email notificatie functie voor Straatambassadeurs
// Stuurt email naar kerngroep bij nieuwe aanvragen/aanmeldingen

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const { type, data } = JSON.parse(event.body);
        
        // Email configuratie (via environment variables in Netlify)
        const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'straatambassadeursvhv@outlook.com';
        
        let subject, body;
        
        if (type === 'aanmelding') {
            subject = `🙋 Nieuwe aanmelding: ${data.naam}`;
            body = `
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
        } else if (type === 'potje') {
            subject = `🧡 Nieuwe potje aanvraag: ${data.ambassadeur_naam}`;
            body = `
Nieuwe Lief & Leed potje aanvraag!

Ambassadeur: ${data.ambassadeur_naam}
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
        } else if (type === 'contact') {
            subject = `📬 Contactformulier: ${data.onderwerp}`;
            body = `
Nieuw bericht via contactformulier

Naam: ${data.naam}
Email: ${data.email}
Onderwerp: ${data.onderwerp}

Bericht:
${data.bericht}

Datum: ${new Date().toLocaleString('nl-NL')}
            `.trim();
        }

        // Log voor debugging (Netlify logs)
        console.log(`📧 Sending notification: ${subject}`);
        console.log(`To: ${NOTIFY_EMAIL}`);
        
        // Hier zou je een email service kunnen koppelen zoals:
        // - SendGrid
        // - Mailgun
        // - AWS SES
        // Voor nu loggen we alleen
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Notification logged' })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process notification' })
        };
    }
};
