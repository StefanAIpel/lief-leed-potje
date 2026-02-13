#!/usr/bin/env node
// Setup script voor lokaal testen - genereert PINs en insert hashes in Supabase
// Gebruik: node scripts/setup-pins.js

const crypto = require('crypto');

const SUPABASE_URL = 'https://knxdefuncbzzbrunhlxg.supabase.co';
// Gebruik service role key als env var, of anon key als fallback voor test
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGRlZnVuY2J6emJydW5obHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjM0NzIsImV4cCI6MjA4NTU5OTQ3Mn0.QRQ0uxK65s_9EaVZkqpFMGOGCvpH5GKisHqg1ZZay3Y';

const KERNGROEP = [
  { naam: 'Stefan Dijkstra', email: 'stefan.dijkstra@gmail.com' },
  { naam: 'Bejanca Eilander', email: 'bejanca@gmail.com' },
  { naam: 'Carien Veldhuis', email: 'carienveldhuis@gmail.com' },
  { naam: 'Kundike Sinselmeijer', email: 'kundike@hotmail.com' },
  { naam: 'Richard Kamer', email: 'kamersvisie@gmail.com' },
  { naam: 'Gerry Rispens', email: 'gerryrispens@live.nl' }
];

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function generatePin() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

async function main() {
  console.log('🔐 Genereer PINs voor kerngroepleden...\n');

  const results = [];

  for (const member of KERNGROEP) {
    const pin = generatePin();
    const pinHash = sha256(pin);

    results.push({
      naam: member.naam,
      email: member.email,
      pin: pin,
      pin_hash: pinHash
    });

    // Upsert in Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kerngroep_pins`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        naam: member.naam,
        email: member.email,
        pin_hash: pinHash
      })
    });

    if (res.ok) {
      console.log(`✅ ${member.naam} — PIN: ${pin}`);
    } else {
      const err = await res.text();
      console.error(`❌ ${member.naam} — Fout: ${err}`);
    }
  }

  console.log('\n📋 Volledige output (voor email-stap):');
  console.log(JSON.stringify(results.map(r => ({ naam: r.naam, email: r.email, pin: r.pin })), null, 2));
  console.log('\n⚠️  Sla deze PINs NIET op — ze worden alleen gehashed in de database.');
}

main().catch(console.error);
