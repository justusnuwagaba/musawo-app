// Maps errors thrown by UserProvider's signUp/signIn/resetPasswordByEmail to
// a translated, user-facing message. Our own validators throw Error objects
// whose `message` is already an i18n key (e.g. "auth.invalidPhone"); Firebase
// Auth throws errors with a `.code` like "auth/wrong-password" instead.

const FIREBASE_CODE_TO_KEY = {
  'auth/wrong-password': 'auth.wrongPassword',
  'auth/invalid-credential': 'auth.wrongPassword',
  'auth/user-not-found': 'auth.noAccountFound',
  'auth/invalid-email': 'auth.invalidEmail',
  'auth/email-already-in-use': 'auth.accountExists',
  'auth/weak-password': 'auth.passwordTooShort',
};

export function mapAuthError(err, t, fallbackKey = 'auth.signInError') {
  if (err?.code && FIREBASE_CODE_TO_KEY[err.code]) {
    return t(FIREBASE_CODE_TO_KEY[err.code]);
  }
  if (err?.message?.startsWith('auth.')) {
    return t(err.message);
  }
  return t(fallbackKey);
}
