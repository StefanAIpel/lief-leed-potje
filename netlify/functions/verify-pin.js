// Verificeer kerngroep PIN server-side
// Vergelijkt SHA-256 hash van ingevoerde PIN met opgeslagen hash in Supabase

const crypto = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const { naam, pin } = JSON.parse(event.body);
        if (!naam || !pin) {
            return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Naam en PIN zijn verplicht' }) };
        }

        const SUPABASE_URL = 'https://knxdefuncbzzbrunhlxg.supabase.co';
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const MASTER_PIN = process.env.MASTER_PIN || process.env.ADMIN_PIN || '';

        const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
        const masterHash = crypto.createHash('sha256').update(MASTER_PIN).digest('hex');

        // Master PIN check
        if (pinHash === masterHash) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, naam })
            };
        }

        // Check member PIN in Supabase
        const resp = await fetch(
            `${SUPABASE_URL}/rest/v1/kerngroep_pins?naam=eq.${encodeURIComponent(naam)}&select=pin_hash`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        const members = await resp.json();

        if (members && members.length > 0 && members[0].pin_hash === pinHash) {
            // Update laatst_ingelogd
            fetch(`${SUPABASE_URL}/rest/v1/kerngroep_pins?naam=eq.${encodeURIComponent(naam)}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ laatst_ingelogd: new Date().toISOString() })
            }).catch(() => {});

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, naam })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: false, error: 'Onjuiste pincode' })
        };

    } catch (error) {
        console.error('Verify PIN error:', error);
        return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Er ging iets mis' }) };
    }
};
