// Seeds sample catalog items into the six service collections behind the
// patient Home screen's service tiles (Lab, Vaccination, Chronic Illness,
// Health Screening, Pharmacy, Insurance). These collections are
// write:false to clients (see firestore.rules) — real content management
// for them is presumably a future admin UI; this script is the interim way
// to get anything bookable in there at all, same spirit as
// seedTestDoctor.js.
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
  chronicIllness: [
    { id: 'diabetes-plan', name: 'Diabetes Management Plan', description: 'Ongoing monitoring and consultation plan.', price: 40000, icon: 'heart-circle-outline', order: 1 },
    { id: 'hypertension-followup', name: 'Hypertension Follow-up', description: 'Routine blood-pressure follow-up consultation.', price: 35000, icon: 'heart-circle-outline', order: 2 },
  ],
  healthScreening: [
    { id: 'general-checkup', name: 'General Health Checkup', description: 'Full-body baseline health screening.', price: 50000, icon: 'medical-outline', order: 1 },
    { id: 'cancer-screening', name: 'Cancer Screening', description: 'Early-detection screening panel.', price: 80000, icon: 'medical-outline', order: 2 },
  ],
  pharmacy: [
    { id: 'paracetamol-500', name: 'Paracetamol 500mg', description: 'Pack of 20 tablets.', price: 5000, icon: 'basket-outline', order: 1 },
    { id: 'amoxicillin-250', name: 'Amoxicillin 250mg', description: 'Pack of 21 capsules — prescription required.', price: 12000, icon: 'basket-outline', order: 2 },
  ],
  insurance: [
    { id: 'basic-plan', name: 'Basic Health Plan', description: 'Covers outpatient consultations and basic lab tests.', price: 100000, icon: 'document-text-outline', order: 1 },
    { id: 'family-plan', name: 'Family Cover Plan', description: 'Covers up to 5 family members, inpatient + outpatient.', price: 250000, icon: 'document-text-outline', order: 2 },
  ],
};

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
  await batch.commit();
  console.log(`Done. Seeded ${count} catalog items across ${Object.keys(CATALOG).length} collections.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
