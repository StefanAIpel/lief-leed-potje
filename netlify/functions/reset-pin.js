// Reset PIN functie voor kerngroep leden
// Genereert nieuwe 5-cijferige PIN, hasht met SHA-256, slaat op in Supabase, stuurt via Resend

const crypto = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const { naam } = JSON.parse(event.body);
        if (!naam) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Naam is verplicht' }) };
        }

        const SUPABASE_URL = 'https://knxdefuncbzzbrunhlxg.supabase.co';
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const FROM_EMAIL = process.env.FROM_EMAIL || 'Straatambassadeurs <noreply@straatambassadeurs.nl>';

        if (!SUPABASE_KEY || !RESEND_API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Server configuratie ontbreekt' }) };
        }

        // Zoek lid in kerngroep_pins
        const lookupResp = await fetch(
            `${SUPABASE_URL}/rest/v1/kerngroep_pins?naam=eq.${encodeURIComponent(naam)}&select=id,naam,email`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        const members = await lookupResp.json();

        if (!members || members.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Naam niet gevonden' }) };
        }

        const member = members[0];
        if (!member.email) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Geen e-mailadres bekend. Neem contact op met de kerngroep.' }) };
        }

        // Genereer nieuwe 5-cijferige PIN
        const newPin = String(10000 + crypto.randomInt(90000));
        const pinHash = crypto.createHash('sha256').update(newPin).digest('hex');

        // Update hash in Supabase
        const updateResp = await fetch(
            `${SUPABASE_URL}/rest/v1/kerngroep_pins?id=eq.${member.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ pin_hash: pinHash })
            }
        );

        if (!updateResp.ok) {
            console.error('Supabase update failed:', await updateResp.text());
            return { statusCode: 500, body: JSON.stringify({ error: 'Kon PIN niet opslaan' }) };
        }

        // Stuur email met nieuwe PIN
        const voornaam = member.naam.split(' ')[0];
        const emailResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: member.email,
                subject: '🔑 Je nieuwe PIN voor Straatambassadeurs Beheer',
                html: `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#1a2744 0%,#2855a3 100%);padding:24px 32px;text-align:center;">
<div style="font-size:24px;margin-bottom:4px;">🔑</div>
<h1 style="color:#f4c542;margin:0;font-size:18px;font-weight:700;">Nieuwe PIN</h1>
<p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">Straatambassadeurs Beheer</p>
</td></tr>
<tr><td style="padding:32px;color:#1f2937;font-size:15px;">
<p>Beste ${voornaam},</p>
<p>Je hebt een nieuwe PIN aangevraagd voor het beheerpaneel van de Straatambassadeurs.</p>
<div style="text-align:center;margin:24px 0;">
<div style="display:inline-block;background:#f0f9ff;border:2px solid #2855a3;border-radius:12px;padding:16px 32px;">
<span style="font-size:28px;font-weight:700;letter-spacing:8px;color:#1a2744;">${newPin}</span>
</div>
</div>
<p>Ga naar <a href="https://straatambassadeurs.nl/admin.html" style="color:#2855a3;">straatambassadeurs.nl/admin.html</a>, selecteer je naam en voer deze PIN in.</p>
<p style="font-size:13px;color:#6b7280;margin-top:24px;">⚠️ Deel deze PIN niet met anderen. Je kunt altijd een nieuwe aanvragen.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;color:#9ca3af;">Van de straat, voor de straat 🧡</p>
<p style="margin:4px 0 0;font-size:11px;"><a href="https://straatambassadeurs.nl" style="color:#2855a3;text-decoration:none;">straatambassadeurs.nl</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
            })
        });

        if (!emailResp.ok) {
            const err = await emailResp.text();
            console.error('Resend error:', err);
            return { statusCode: 500, body: JSON.stringify({ error: 'Kon email niet versturen' }) };
        }

        console.log(`✅ Nieuwe PIN verstuurd naar ${member.email} voor ${member.naam}`);
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('Reset PIN error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Er ging iets mis' }) };
    }
};
