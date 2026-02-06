import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

type EnvConfig = {
  projectId: string;
  adminUid: string;
  adminEmail: string;
};

function readEnvConfig(): EnvConfig {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID ?? "secondlife-exchange-dev",
    adminUid: process.env.SEED_ADMIN_UID ?? "admin-placeholder",
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@example.local",
  };
}

function initializeFirebase(projectId: string) {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      projectId,
    });
  }

  return initializeApp({
    projectId,
  });
}

function getWeekRange() {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const diffToMonday = (utcDay + 6) % 7;

  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  weekStart.setUTCDate(weekStart.getUTCDate() - diffToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

async function run() {
  const config = readEnvConfig();
  initializeFirebase(config.projectId);
  const db = getFirestore();

  const { weekStart, weekEnd } = getWeekRange();
  const themeWeekId = `seed-${weekStart.toISOString().slice(0, 10)}`;

  const batch = db.batch();

  const adminUserRef = db.collection("users").doc(config.adminUid);
  batch.set(
    adminUserRef,
    {
      email: config.adminEmail,
      role: "admin",
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const themeRef = db.collection("themeWeeks").doc(themeWeekId);
  batch.set(
    themeRef,
    {
      weekStart,
      weekEnd,
      themeSlug: "seed-weekly-theme",
      title: "Seed weekly theme",
      ecoImpactSummary: "Seed data for local development and test scenarios.",
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const ecoContents = [
    {
      type: "article",
      title: "Repair first: extending product lifetime",
      summary: "Practical actions to reduce waste by repairing common household objects.",
      sourceUrl: "https://example.org/eco/repair-first",
      tags: ["repair", "reuse", "circular"],
      lang: "en",
    },
    {
      type: "video",
      title: "Community swap best practices",
      summary: "How local exchange events cut emissions while building social ties.",
      sourceUrl: "https://example.org/eco/swap-video",
      tags: ["community", "swap", "local"],
      lang: "en",
    },
    {
      type: "stat",
      title: "Reuse impact snapshot",
      summary: "Key metrics comparing second-hand reuse and new item production footprints.",
      sourceUrl: "https://example.org/eco/reuse-stats",
      tags: ["stats", "impact", "reuse"],
      lang: "en",
    },
  ] as const;

  ecoContents.forEach((content, index) => {
    const ref = db.collection("ecoContents").doc(`seed-eco-${index + 1}`);
    batch.set(
      ref,
      {
        themeWeekId,
        ...content,
        publishedAt: new Date(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();

  console.log("Seed completed.");
  console.log(`Admin placeholder UID: ${config.adminUid}`);
  console.log(`Theme week: ${themeWeekId}`);
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
