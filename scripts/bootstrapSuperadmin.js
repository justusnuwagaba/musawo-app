// One-off script to create the very first superadmin account.
//
// Why this exists: setUserRole (functions/index.js) requires the caller to
// already hold the superadmin custom claim, so there is no in-app way to
// create the first one. This script uses the Admin SDK directly instead.
//
// Setup:
//   1. Firebase Console > Project Settings > Service Accounts >
//      "Generate new private key". Save the downloaded file as
//      scripts/serviceAccountKey.json (already gitignored — never commit it).
//   2. npm install firebase-admin --prefix scripts   (or run from functions/,
//      which already has firebase-admin installed)
//   3. node scripts/bootstrapSuperadmin.js you@example.com
//   4. Delete scripts/serviceAccountKey.json (or revoke the key in the
//      console) once you're done — it's a permanent, powerful credential.
//
// After running, the user must sign out and back in (or get a fresh ID
// token) for the new custom claim to take effect on the client.

const path = require('path');
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));

const identifier = process.argv[2];
if (!identifier) {
  console.error('Usage: node scripts/bootstrapSuperadmin.js <email-or-uid>');
  process.exit(1);
}

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = require(keyPath);
} catch {
  console.error(`Could not find ${keyPath}.\nDownload it from Firebase Console > Project Settings > Service Accounts > Generate new private key.`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function main() {
  const user = identifier.includes('@')
    ? await admin.auth().getUserByEmail(identifier)
    : await admin.auth().getUser(identifier);

  await admin.auth().setCustomUserClaims(user.uid, { role: 'superadmin' });
  await admin.firestore().collection('users').doc(user.uid).set(
    { role: 'superadmin', isVerified: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );

  console.log(`Done. ${user.uid} (${user.email || identifier}) is now a superadmin.`);
  console.log('They must sign out and sign back in for the change to take effect.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
