// src/context/UserProvider.js
// Central auth + role context. Wrap your entire app with this.
// Roles stored in Firestore under: users/{uid}.role ('patient' | 'doctor' | 'admin' | 'superadmin')
//
// Phone accounts: Firebase Auth needs an email under the hood, so phone
// sign-up/sign-in derives an internal, never-shown address
// ({e164Phone}@musawo.local) via phoneToInternalEmail(). This is a
// convenience login mechanism, NOT OTP/SMS verification — anyone can type
// any phone number at signup. Real SMS-OTP verification (via Africa's
// Talking, matching the future USSD channel) is a documented upgrade path,
// not built yet — see functions/index.js's sendOtp/confirmOtp stubs.

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { normalizePhone, phoneToInternalEmail, isValidEmail, isValidPassword } from '../utils/validators';

const ROLES = ['patient', 'doctor', 'admin', 'superadmin'];

// ─── Context ────────────────────────────────────────────────────────────────

const UserContext = createContext(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);          // Firebase Auth user object
  const [profile, setProfile] = useState(null);    // Firestore profile document
  const [role, setRole] = useState(null);          // 'patient' | 'doctor' | 'admin' | 'superadmin'
  const [loading, setLoading] = useState(true);    // true while resolving auth state
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null);
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        try {
          // Custom claims (role) only ride on freshly-minted ID tokens. Without
          // this, a user promoted/demoted by an admin action (setUserRole,
          // reviewDoctorApplication) keeps their old permissions enforced by
          // Firestore rules until their cached token naturally expires (~1hr).
          await firebaseUser.getIdToken(true);

          const userRef = doc(db, 'users', firebaseUser.uid);
          // A live listener, not a one-time getDoc — without this, a
          // self-service change made mid-session (e.g. applying to become a
          // doctor, which flips this same account's own role field) would
          // never show up in the UI until the next sign-out/sign-in, since
          // nothing else would ever re-fetch the profile.
          unsubscribeProfile = onSnapshot(
            userRef,
            async (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                setProfile(data);
                setRole(data.role ?? 'patient');
              } else {
                // Shouldn't normally happen (signUp() below creates the doc),
                // but covers accounts created outside the app (e.g. Firebase console).
                const defaultProfile = {
                  uid: firebaseUser.uid,
                  phone: null,
                  authEmail: firebaseUser.email,
                  contactEmail: firebaseUser.email,
                  displayName: firebaseUser.displayName ?? '',
                  photoURL: firebaseUser.photoURL ?? '',
                  role: 'patient',
                  isVerified: false,
                  verificationStatus: 'unsubmitted',
                  isBanned: false,
                  preferredLanguage: 'en',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                };
                await setDoc(userRef, defaultProfile);
                setProfile(defaultProfile);
                setRole('patient');
              }
              setUser(firebaseUser);
              setLoading(false);
            },
            (err) => {
              console.error('[UserProvider] Firestore error:', err);
              setError(err.message);
              setLoading(false);
            }
          );
        } catch (err) {
          console.error('[UserProvider] Firestore error:', err);
          setError(err.message);
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // ── Auth actions ─────────────────────────────────────────────────────────

  /**
   * Creates a new account by phone or email.
   * method: 'phone' | 'email'
   */
  async function signUp({ method, identifier, password, displayName }) {
    if (!isValidPassword(password)) throw new Error('auth.passwordTooShort');

    let authEmail;
    let phone = null;
    let contactEmail = null;

    if (method === 'phone') {
      const normalized = normalizePhone(identifier);
      if (!normalized) throw new Error('auth.invalidPhone');
      phone = normalized;
      authEmail = phoneToInternalEmail(normalized);
    } else {
      if (!isValidEmail(identifier)) throw new Error('auth.invalidEmail');
      authEmail = identifier.trim();
      contactEmail = authEmail;
    }

    const credential = await createUserWithEmailAndPassword(auth, authEmail, password);
    const newProfile = {
      uid: credential.user.uid,
      phone,
      authEmail,
      contactEmail,
      displayName: displayName ?? '',
      photoURL: '',
      role: 'patient',
      isVerified: false,
      verificationStatus: 'unsubmitted',
      isBanned: false,
      preferredLanguage: 'en',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', credential.user.uid), newProfile);
    return credential.user;
  }

  /**
   * Signs in by phone or email.
   * method: 'phone' | 'email'
   */
  async function signIn({ method, identifier, password }) {
    let authEmail;
    if (method === 'phone') {
      const normalized = normalizePhone(identifier);
      if (!normalized) throw new Error('auth.invalidPhone');
      authEmail = phoneToInternalEmail(normalized);
    } else {
      if (!isValidEmail(identifier)) throw new Error('auth.invalidEmail');
      authEmail = identifier.trim();
    }
    const credential = await signInWithEmailAndPassword(auth, authEmail, password);
    return credential.user;
  }

  /**
   * Sends a password reset email. Only meaningful for accounts that signed
   * up with a real email — phone accounts have no real inbox behind their
   * internal @musawo.local address (see module comment above).
   */
  async function resetPasswordByEmail(email) {
    if (!isValidEmail(email)) throw new Error('auth.invalidEmail');
    await sendPasswordResetEmail(auth, email.trim());
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Dev-only convenience to try out different roles without the real
   * admin-approval flow. Real role changes go through the setUserRole /
   * reviewDoctorApplication Cloud Functions (functions/index.js), which use
   * the Admin SDK to set custom claims — firestore.rules blocks clients from
   * writing role/isVerified/isBanned/verificationStatus directly.
   */
  async function switchRole(newRole) {
    if (!__DEV__) throw new Error('switchRole is only available in development builds');
    if (!user) return;
    if (!ROLES.includes(newRole)) throw new Error(`Invalid role: ${newRole}`);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { role: newRole, updatedAt: serverTimestamp() }, { merge: true });
      setRole(newRole);
      setProfile((prev) => ({ ...prev, role: newRole }));
    } catch (err) {
      console.error('[UserProvider] switchRole error:', err);
      throw err;
    }
  }

  /**
   * Update arbitrary non-protected fields on the user's Firestore profile
   * (e.g. displayName, preferredLanguage). Protected fields (role,
   * isVerified, isBanned, verificationStatus) are rejected by firestore.rules
   * even if included here.
   */
  async function updateProfile(fields) {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { ...fields, updatedAt: serverTimestamp() }, { merge: true });
      setProfile((prev) => ({ ...prev, ...fields }));
    } catch (err) {
      console.error('[UserProvider] updateProfile error:', err);
      throw err;
    }
  }

  /**
   * Sign out and clear state.
   */
  async function logout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setRole(null);
  }

  // ── Derived booleans ─────────────────────────────────────────────────────

  const isPatient = role === 'patient';
  const isDoctor = role === 'doctor';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isSuperAdmin = role === 'superadmin';
  const isVerifiedDoctor = isDoctor && profile?.isVerified === true;
  const isAuthenticated = !!user;

  const value = {
    user,
    profile,
    role,
    userRole: role,
    loading,
    isLoading: loading,
    error,
    isAuthenticated,
    isPatient,
    isDoctor,
    isAdmin,
    isSuperAdmin,
    isVerifiedDoctor,
    signUp,
    signIn,
    resetPasswordByEmail,
    switchRole,
    updateProfile,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export { useUser as useUserContext };
