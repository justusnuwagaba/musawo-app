// Seeds sample catalog items into the five bookable service collections
// behind the patient Home screen's service tiles (Lab, Vaccination, Health
// Screening, Pharmacy, Insurance — Chronic Illness moved to its own
// vitals-log + check-in screen, see ChronicHome.js, and no longer uses a
// catalog). These collections are write:false to clients (see
// firestore.rules) — real content management for them is presumably a
// future admin UI; this script is the interim way to get anything bookable
// in there at all, same spirit as seedTestDoctor.js.
//
// Usage:
//   node scripts/seedServiceCatalog.js
//
// Uses the same scripts/serviceAccountKey.json as bootstrapSuperadmin.js /
// seedTestDoctor.js. Safe to re-run — uses deterministic doc IDs, so it
// upserts rather than duplicating.

const path = require('path');
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = require(keyPath);
} catch {
  console.error(`Could not find ${keyPath}. See scripts/bootstrapSuperadmin.js for how to get one.`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const CATALOG = {
  lab: [
    { id: 'malaria-test', name: 'Malaria Test', description: 'Rapid diagnostic test for malaria.', price: 15000, icon: 'flask-outline', order: 1 },
    { id: 'full-blood-count', name: 'Full Blood Count', description: 'General blood panel, including white/red cell counts.', price: 25000, icon: 'flask-outline', order: 2 },
    { id: 'widal-test', name: 'Widal Test (Typhoid)', description: 'Screens for typhoid fever antibodies.', price: 20000, icon: 'flask-outline', order: 3 },
  ],
  vaccination: [
    { id: 'tetanus-booster', name: 'Tetanus Booster', description: 'Routine tetanus booster shot.', price: 10000, icon: 'shield-checkmark', order: 1 },
    { id: 'hepatitis-b', name: 'Hepatitis B', description: 'Hepatitis B vaccination series.', price: 30000, icon: 'shield-checkmark', order: 2 },
    { id: 'yellow-fever', name: 'Yellow Fever', description: 'Required for travel to several East African countries.', price: 25000, icon: 'shield-checkmark', order: 3 },
  ],
  // No chronicIllness entry — ChronicHome.js no longer routes through the
  // generic catalog/booking flow (see that file for why: chronic condition
  // management is an ongoing relationship, not a one-time purchase). Any
  // previously-seeded chronicIllness/{diabetes-plan,hypertension-followup}
  // docs are stale and get cleaned up alongside the pharmacy fix below.
  healthScreening: [
    { id: 'general-checkup', name: 'General Health Checkup', description: 'Full-body baseline health screening.', price: 50000, icon: 'medical-outline', order: 1 },
    { id: 'cancer-screening', name: 'Cancer Screening', description: 'Early-detection screening panel.', price: 80000, icon: 'medical-outline', order: 2 },
  ],
  // OTC (over-the-counter) items only. An earlier version of this catalog
  // included Amoxicillin — a prescription-only antibiotic — orderable with
  // no prescription check at all, since no prescription-issuing feature
  // exists anywhere in this app yet. That's a real safety/liability gap,
  // not a nice-to-have: don't add prescription-requiring items here until
  // pharmacy orders can be linked to a real prescription record.
  pharmacy: [
    { id: 'paracetamol-500', name: 'Paracetamol 500mg', description: 'Pack of 20 tablets. Pain and fever relief.', price: 5000, icon: 'basket-outline', order: 1 },
    { id: 'ors-sachets', name: 'Oral Rehydration Salts', description: 'Pack of 10 sachets — for dehydration and diarrhoea.', price: 4000, icon: 'basket-outline', order: 2 },
    { id: 'multivitamins', name: 'Multivitamin Tablets', description: 'Pack of 30 tablets.', price: 8000, icon: 'basket-outline', order: 3 },
  ],
  insurance: [
    { id: 'basic-plan', name: 'Basic Health Plan', description: 'Covers outpatient consultations and basic lab tests.', price: 100000, icon: 'document-text-outline', order: 1 },
    { id: 'family-plan', name: 'Family Cover Plan', description: 'Covers up to 5 family members, inpatient + outpatient.', price: 250000, icon: 'document-text-outline', order: 2 },
  ],
};

// Docs from an earlier version of this catalog that no longer belong:
// amoxicillin-250 (prescription-only, unsafe to self-serve — see the
// pharmacy comment above) and the two chronicIllness items (that whole
// collection is now unused — see ChronicHome.js). merge:true on CATALOG
// above won't remove docs that aren't listed in it anymore, so these need
// an explicit delete.
const STALE_DOCS = [
  ['pharmacy', 'amoxicillin-250'],
  ['chronicIllness', 'diabetes-plan'],
  ['chronicIllness', 'hypertension-followup'],
];

async function main() {
  let batch = db.batch();
  let count = 0;
  for (const [collectionName, items] of Object.entries(CATALOG)) {
    for (const { id, ...fields } of items) {
      batch.set(db.collection(collectionName).doc(id), fields, { merge: true });
      count += 1;
      if (count % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
  }
  for (const [collectionName, id] of STALE_DOCS) {
    batch.delete(db.collection(collectionName).doc(id));
  }
  await batch.commit();
  console.log(`Done. Seeded ${count} catalog items across ${Object.keys(CATALOG).length} collections, removed ${STALE_DOCS.length} stale item(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
