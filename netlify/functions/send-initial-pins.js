const crypto = require('crypto');

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function generatePin() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

const KERNGROEP = [
  { naam: 'Stefan Dijkstra', email: 'stefan.dijkstra@gmail.com' },
  { naam: 'Bejanca Eilander', email: 'bejanca@gmail.com' },
  { naam: 'Carien Veldhuis', email: 'carienveldhuis@gmail.com' },
  { naam: 'Kundike Sinselmeijer', email: 'kundike@hotmail.com' },
  { naam: 'Richard Kamer', email: 'kamersvisie@gmail.com' },
  { naam: 'Gerry Rispens', email: 'gerryrispens@live.nl' }
];

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Beveilig met secret
  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PIN;
  const providedSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];

  if (!providedSecret || providedSecret !== ADMIN_SECRET) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Niet geautoriseerd' }) };
  }

  const SUPABASE_URL = 'https://knxdefuncbzzbrunhlxg.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuratie ontbreekt' }) };
  }

  try {
    let sent = 0;
    const errors = [];

    for (const member of KERNGROEP) {
      const pin = generatePin();
      const pinHash = sha256(pin);
      const voornaam = member.naam.split(' ')[0];

      // Upsert in Supabase
      const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/kerngroep_pins`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          naam: member.naam,
          email: member.email,
          pin_hash: pinHash
        })
      });

      if (!upsertRes.ok) {
        const errText = await upsertRes.text();
        errors.push(`${member.naam}: DB error - ${errText}`);
        continue;
      }

      // Stuur email
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Straatambassadeurs <noreply@straatambassadeurs.nl>',
          to: [member.email],
          subject: 'Je PIN voor Straatambassadeurs Admin',
          html: `<p>Hoi ${voornaam},</p><p>Welkom bij het admin-paneel van straatambassadeurs.nl!</p><p>Je persoonlijke PIN is: <strong style="font-size: 1.5em; letter-spacing: 3px;">${pin}</strong></p><p>Gebruik deze om in te loggen op <a href="https://straatambassadeurs.nl/admin">straatambassadeurs.nl/admin</a>.</p><p>Deel deze code met niemand.</p><p>PIN vergeten? Klik op 'PIN vergeten' op de inlogpagina.</p><p>Met vriendelijke groet,<br>Straatambassadeurs Vathorst & Hooglanderveen</p>`
        })
      });

      if (emailRes.ok) {
        sent++;
      } else {
        const emailErr = await emailRes.text();
        errors.push(`${member.naam}: Email error - ${emailErr}`);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sent,
        total: KERNGROEP.length,
        errors: errors.length > 0 ? errors : undefined
      })
    };

  } catch (error) {
    console.error('Send initial pins error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Er ging iets mis' }) };
  }
};
