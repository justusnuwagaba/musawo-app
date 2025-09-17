// firebaseConfig.js 
import { initializeApp } from 'firebase/app'; 
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth'; // For authentication 
import { getFirestore } from 'firebase/firestore'; // For Firestore 
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import Async Storage 
// Firebase configuration 
const firebaseConfig = { 
  apiKey: "AIzaSyD9SKnue02vJzqnW_jiFqwDFc9x2jZNYeU", 
  authDomain: "telehealthapp-9ac64.firebaseapp.com", 
  projectId: "telehealthapp-9ac64", 
  storageBucket: "telehealthapp-9ac64.appspot.com", 
  messagingSenderId: "779415155067", 
  appId: "1:779415155067:web:5508e830dfa17031fb8dde", 
  measurementId: "G-P3P1DCK9D1" 
}; 
// Initialize Firebase 
const app = initializeApp(firebaseConfig); 
// Initialize Auth with Async Storage for persistence 
const auth = initializeAuth(app, { 
  persistence: getReactNativePersistence(AsyncStorage), 
}); 
// Initialize Firestore 
const firestore = getFirestore(app); 
// Export the auth and firestore instances 
export { auth, firestore };