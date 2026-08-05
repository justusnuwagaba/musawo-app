import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD9SKnue02vJzqnW_jiFqwDFc9x2jZNYeU",
  authDomain: "telehealthapp-9ac64.firebaseapp.com",
  projectId: "telehealthapp-9ac64",
  storageBucket: "telehealthapp-9ac64.appspot.com",
  messagingSenderId: "779415155067",
  appId: "1:779415155067:web:5508e830dfa17031fb8dde",
  measurementId: "G-P3P1DCK9D1"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);