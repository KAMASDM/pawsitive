#!/usr/bin/env node
// Dry run by default. This adds an ownership index; it never moves care records.
const { ownershipIndex } = require('../functions/domain/publicProfiles');

async function main() {
  const args = process.argv.slice(2);
  const index = args.indexOf('--database-url');
  const databaseURL = index >= 0 ? args[index + 1] : null;
  if (!databaseURL) throw new Error('Provide --database-url and Application Default Credentials. Add --apply only after reviewing the dry run.');
  const admin = require('../functions/node_modules/firebase-admin');
  const app = admin.initializeApp({ databaseURL, credential: admin.credential.applicationDefault() });
  try {
    const db = app.database();
    const [petsSnapshot, ownersSnapshot] = await Promise.all([db.ref('userPets').once('value'), db.ref('petOwners').once('value')]);
    const desired = ownershipIndex(petsSnapshot.val());
    const current = ownersSnapshot.val() || {};
    for (const [petId, ownerId] of Object.entries(desired)) if (current[petId] && current[petId] !== ownerId) throw new Error('An existing ownership reservation conflicts with a pet. No writes performed.');
    console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', pets: Object.keys(desired).length, newReservations: Object.keys(desired).filter((id) => !current[id]).length }));
    if (!args.includes('--apply')) return;
    const result = await db.ref('petOwners').transaction((latest) => {
      const next = { ...latest };
      for (const [petId, ownerId] of Object.entries(desired)) {
        if (next[petId] && next[petId] !== ownerId) return;
        next[petId] = ownerId;
      }
      return next;
    });
    if (!result.committed) throw new Error('Ownership changed during the migration. No index update committed; review and rerun.');
    console.log('Ownership index updated. Existing care records and reserved IDs were preserved.');
  } finally { await app.delete(); }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
