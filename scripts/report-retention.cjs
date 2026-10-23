#!/usr/bin/env node
// Read-only. Use a Firebase RTDB export of productEvents, or explicit Admin credentials.
const fs = require('node:fs');
const { summarizeRetention } = require('../functions/domain/retention');
const { summarizeGrowth } = require('../functions/domain/growthMetrics');

async function main() {
  const args = process.argv.slice(2);
  const option = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; };
  let events;
  if (option('--input')) events = JSON.parse(fs.readFileSync(option('--input'), 'utf8'));
  else if (option('--database-url')) {
    const admin = require('../functions/node_modules/firebase-admin');
    const app = admin.initializeApp({ credential: admin.credential.applicationDefault(), databaseURL: option('--database-url') });
    try { events = (await app.database().ref('productEvents').once('value')).val(); }
    finally { await app.delete(); }
  } else {
    throw new Error('Use --input /path/to/productEvents.json or --database-url https://YOUR_DATABASE_URL with Application Default Credentials.');
  }
  const now = option('--as-of') ? Date.parse(option('--as-of')) : Date.now();
  if (!Number.isFinite(now)) throw new Error('Invalid --as-of date');
  console.log(JSON.stringify({
    definition: 'UTC exact-day retention from first measured session; existing accounts may be included. Only fully elapsed return days count. Activation = pet created and health record saved or routine completed within 24h. Shared-link signup attribution is reported separately and does not establish household membership.',
    asOf: new Date(now).toISOString(), cohorts: summarizeRetention(events, now),
    growthDefinition: 'Unique measured accounts per action. Setup denominators include only signups with a fully elapsed 24h window. Shared-link attribution is captured at signup from an allowlisted source; anonymous views are not measured. Opt-outs are excluded.',
    growth: summarizeGrowth(events, now),
  }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
