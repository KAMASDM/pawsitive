import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Firebase configuration
// In production (Netlify), these will be injected via environment variables
// The Netlify function serves the same config but this allows the app to work immediately
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const emulatorConfig = { apiKey: 'demo-key', authDomain: 'demo-pawppy.firebaseapp.com', projectId: 'demo-pawppy', databaseURL: 'https://demo-pawppy-default-rtdb.firebaseio.com', storageBucket: 'demo-pawppy.appspot.com', appId: 'demo-pawppy', messagingSenderId: '000000000000' };
const app = getApps().length ? getApps()[0] : initializeApp(useEmulators ? emulatorConfig : firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();
// Development-only, explicitly enabled. Tests never connect to production data.
if (useEmulators && !globalThis.__pawppyEmulatorsConnected) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9098', { disableWarnings: true });
  connectDatabaseEmulator(database, '127.0.0.1', 9015);
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
  connectStorageEmulator(storage, '127.0.0.1', 9198);
  connectFunctionsEmulator(functions, '127.0.0.1', 5005);
  globalThis.__pawppyEmulatorsConnected = true;
}

export { googleProvider, signInWithPopup, database, auth, db, storage, functions };
