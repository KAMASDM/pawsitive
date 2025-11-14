import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Fetch Firebase config from Netlify function for better security
let firebaseConfigPromise;

const getFirebaseConfig = async () => {
  if (!firebaseConfigPromise) {
    firebaseConfigPromise = fetch('/.netlify/functions/firebase-config')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch Firebase config');
        }
        return response.json();
      })
      .catch(error => {
        console.error('Error fetching Firebase config, falling back to env vars:', error);
        // Fallback to environment variables for local development
        return {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
          measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
          databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        };
      });
  }
  return firebaseConfigPromise;
};

// Initialize Firebase app
let app;
let auth;
let db;
let database;
let storage;

const initializeFirebase = async () => {
  if (!app) {
    const config = await getFirebaseConfig();
    app = getApps().length ? getApps()[0] : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    database = getDatabase(app);
    storage = getStorage(app);
  }
  return { auth, db, database, storage };
};

// Initialize immediately
const firebaseInit = initializeFirebase();

// Export a promise-based initialization
export const getFirebaseServices = () => firebaseInit;

// Export individual services (will be undefined until initialized)
export { auth, db, database, storage };

// Export for backward compatibility with existing code
const googleProvider = new GoogleAuthProvider();
export { googleProvider, signInWithPopup };
