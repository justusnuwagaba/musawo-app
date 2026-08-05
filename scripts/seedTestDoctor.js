// Creates (or updates) a verified test doctor account for manual testing,
// bypassing reviewDoctorApplication (blocked until the project is on Blaze).
// Mirrors exactly what that Cloud Function would have set: the isVerified
// flag, the 'doctor' custom claim, and the Firestore profile fields
// FindDoctorScreen/DoctorProfileScreen expect.
//
// Usage:
//   node scripts/seedTestDoctor.js doctor@example.com "Dr. Test Doctor"
//
// Uses the same scripts/serviceAccountKey.json as bootstrapSuperadmin.js.

const path = require('path');
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));
const { geohashForLocation } = require(path.join(__dirname, '..', 'node_modules', 'geofire-common'));

const email = process.argv[2];
const displayName = process.argv[3] || 'Dr. Test Doctor';
const password = process.argv[4] || 'testpass123';

if (!email) {
  console.error('Usage: node scripts/seedTestDoctor.js <email> ["Display Name"] [password]');
  process.exit(1);
}

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = require(keyPath);
} catch {
  console.error(`Could not find ${keyPath}. See scripts/bootstrapSuperadmin.js for how to get one.`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Kampala, Uganda — swap for wherever you want the test doctor to appear "nearby".
const LAT = 0.3476;
const LNG = 32.5825;

async function main() {
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch {
    user = await admin.auth().createUser({ email, password, displayName });
  }

  await admin.auth().setCustomUserClaims(user.uid, { role: 'doctor' });

  await admin.firestore().collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      authEmail: email,
      contactEmail: email,
      phone: null,
      displayName,
      role: 'doctor',
      isVerified: true,
      verificationStatus: 'approved',
      isBanned: false,
      preferredLanguage: 'en',
      specialty: 'General Medicine',
      specialties: ['General Medicine'],
      bio: 'Seeded test doctor account for manual QA.',
      consultationFee: 20000,
      location: { lat: LAT, lng: LNG },
      geohash: geohashForLocation([LAT, LNG]),
      languagesSpoken: ['en'],
      rating: 4.8,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`Done. ${user.uid} (${email}) is now a verified test doctor.`);
  console.log(`Sign in with email "${email}" and password "${password}" to test the doctor side.`);
  console.log('The account signing in must sign out/in fresh to pick up the new custom claim.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
