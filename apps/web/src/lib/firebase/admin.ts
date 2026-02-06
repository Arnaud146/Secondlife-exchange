import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * Clean a PEM private key that may have been mangled by env-var handling.
 * Handles: surrounding quotes, literal \n sequences, escaped \\n, and
 * missing newlines between the PEM header/footer and the base64 body.
 */
function cleanPrivateKey(raw: string): string {
  let key = raw.trim();

  // Strip surrounding double or single quotes (common copy-paste mistake)
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  // Replace literal \n (two characters) with real newlines
  key = key.replace(/\\n/g, "\n");

  return key;
}

function getCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error("Missing Firebase Admin environment variables.");
  }

  const privateKey = cleanPrivateKey(rawPrivateKey);

  return cert({
    projectId,
    clientEmail,
    privateKey,
  });
}

const app = getApps().length > 0 ? getApp() : initializeApp({ credential: getCredential() });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
