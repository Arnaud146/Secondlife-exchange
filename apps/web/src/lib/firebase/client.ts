import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Only connect to emulators when BOTH the env flag is set AND we are on localhost.
// The runtime hostname check is a safety net in case the env var is misconfigured
// during a production build (NEXT_PUBLIC_* vars are inlined at build time).
const isEmulatorEnv = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

if (isEmulatorEnv && isLocalhost) {
  const globalWithFirebase = globalThis as typeof globalThis & {
    __secondlifeFirebaseEmulatorsConnected?: boolean;
  };

  if (!globalWithFirebase.__secondlifeFirebaseEmulatorsConnected) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8082);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    globalWithFirebase.__secondlifeFirebaseEmulatorsConnected = true;
  }
}
