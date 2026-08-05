// Phone numbers are normalized to E.164 and used as the real, user-facing
// identifier for phone accounts. Firebase Auth still needs an email under
// the hood, so we derive an internal, never-shown address from the number
// (see phoneToInternalEmail) — see src/context/UserProvider.js for why.

const DEFAULT_COUNTRY_CODE = '256'; // Uganda

/** Normalizes a user-typed phone number to E.164 (e.g. "+256772123456"). Returns null if it doesn't look like a valid number. */
export function normalizePhone(input, defaultCountryCode = DEFAULT_COUNTRY_CODE) {
  if (!input) return null;
  const digits = input.replace(/[^\d+]/g, '');

  let normalized;
  if (digits.startsWith('+')) {
    normalized = digits;
  } else if (digits.startsWith('00')) {
    normalized = `+${digits.slice(2)}`;
  } else if (digits.startsWith('0')) {
    normalized = `+${defaultCountryCode}${digits.slice(1)}`;
  } else {
    normalized = `+${defaultCountryCode}${digits}`;
  }

  // E.164: "+" followed by 8-15 digits total.
  return /^\+\d{8,15}$/.test(normalized) ? normalized : null;
}

/** Derives the internal Firebase Auth email address for a phone account. Never shown to the user. */
export function phoneToInternalEmail(e164Phone) {
  return `${e164Phone.replace('+', '')}@musawo.local`;
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}
