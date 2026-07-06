/**
 * Firebase Service — StellarNest
 *
 * Initializes Firebase once on import. All services import from here.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ─── Config from environment variables ───────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// ─── Validate ───────────────────────────────────────────────────
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v || v === 'undefined')
  .map(([k]) => k);

if (missingKeys.length > 0) {
  console.warn(
    `[StellarNest] Firebase config missing: ${missingKeys.join(', ')}. ` +
    `Copy .env.example → .env.local and fill in your Firebase credentials.`
  );
}

// ─── Singleton initialization (runs once on import) ──────────────
const existingApps = getApps();
const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the app too
export { app };
