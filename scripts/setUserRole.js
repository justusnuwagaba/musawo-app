// Grants or revokes admin/superadmin access for an existing account —
// the interim workaround for UserManagementTab.js's "Make admin"/"Remove
// admin" buttons, which call a Cloud Function (setUserRole) that can't run
// until this project is on the Blaze plan.
//
// Generalized version of bootstrapSuperadmin.js — same setup, reusable for
// any role change, not just the very first superadmin.
//
// Setup: see scripts/bootstrapSuperadmin.js for how to get
// scripts/serviceAccountKey.json if you don't already have it from that.
//
// Usage:
//   node scripts/setUserRole.js <email-or-uid> <role>
//   role is one of: patient | doctor | admin | superadmin
//
// After running, the affected user must sign out and back in (or wait for
// their token to naturally refresh) for the new custom claim to take effect
// — same as every other role change in this app.

const path = require('path');
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));

const VALID_ROLES = ['patient', 'doctor', 'admin', 'superadmin'];

const identifier = process.argv[2];
const role = process.argv[3];

if (!identifier || !VALID_ROLES.includes(role)) {
  console.error('Usage: node scripts/setUserRole.js <email-or-uid> <patient|doctor|admin|superadmin>');
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

  await admin.auth().setCustomUserClaims(user.uid, { role });
  await admin.firestore().collection('users').doc(user.uid).set(
    { role, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );

  console.log(`Done. ${user.uid} (${user.email || identifier}) is now: ${role}.`);
  console.log('They must sign out and sign back in for the change to take effect.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
