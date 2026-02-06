import { aiProviderOutputSchema } from "@secondlife/shared";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "../../lib/firebase-admin.js";
import { logInfo } from "../../lib/logger.js";
import { createAiProvider } from "../../providers/ai/index.js";
import { assertDiversityRequirements } from "./diversity.js";

export type GenerateWeeklySuggestionsOptions = {
  force?: boolean;
  desiredCount?: number;
  language?: string;
  fallbackThemeSlug?: string;
};

export type GenerateWeeklySuggestionsResult =
  | {
      status: "skipped_no_theme";
      themeWeekId: null;
      generatedCount: 0;
      existingCount: 0;
    }
  | {
      status: "skipped_existing";
      themeWeekId: string;
      generatedCount: 0;
      existingCount: number;
    }
  | {
      status: "created";
      themeWeekId: string;
      generatedCount: number;
      existingCount: number;
    };

type ResolvedThemeWeek = {
  id: string;
  title: string;
  themeSlug: string;
  weekStartIso: string;
  weekEndIso: string;
};

function toDateSafe(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    const date = new Date((value as { seconds: number }).seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

async function resolveCurrentThemeWeek(): Promise<ResolvedThemeWeek | null> {
  const now = new Date();
  const snapshot = await adminDb
    .collection("themeWeeks")
    .where("weekStart", "<=", now)
    .orderBy("weekStart", "desc")
    .limit(24)
    .get();

  const currentDoc = snapshot.docs.find((doc) => {
    const weekEnd = toDateSafe(doc.data().weekEnd);
    return weekEnd !== null && weekEnd >= now;
  });

  if (!currentDoc) {
    return null;
  }

  const data = currentDoc.data();
  const weekStartDate = toDateSafe(data.weekStart);
  const weekEndDate = toDateSafe(data.weekEnd);
  const themeTitle = typeof data.title === "string" ? data.title.trim() : "";
  const themeSlug = typeof data.themeSlug === "string" ? data.themeSlug.trim() : "";

  if (!weekStartDate || !weekEndDate || !themeTitle || !themeSlug) {
    return null;
  }

  return {
    id: currentDoc.id,
    title: themeTitle,
    themeSlug,
    weekStartIso: weekStartDate.toISOString(),
    weekEndIso: weekEndDate.toISOString(),
  };
}

async function countSuggestionsForTheme(themeWeekId: string): Promise<number> {
  const snapshot = await adminDb
    .collection("aiSuggestions")
    .where("themeWeekId", "==", themeWeekId)
    .limit(500)
    .get();

  return snapshot.size;
}

export async function generateWeeklySuggestionsForCurrentTheme(
  options: GenerateWeeklySuggestionsOptions = {},
): Promise<GenerateWeeklySuggestionsResult> {
  const desiredCount = options.desiredCount ?? 8;
  const language = options.language ?? "fr";
  const force = options.force ?? false;

  const themeWeek = await resolveCurrentThemeWeek();
  if (!themeWeek) {
    logInfo("weekly_suggestions_skipped_no_active_theme");
    return {
      status: "skipped_no_theme",
      themeWeekId: null,
      generatedCount: 0,
      existingCount: 0,
    };
  }

  const existingCount = await countSuggestionsForTheme(themeWeek.id);
  if (!force && existingCount > 0) {
    logInfo("weekly_suggestions_skipped_existing", {
      themeWeekId: themeWeek.id,
      existingCount,
    });
    return {
      status: "skipped_existing",
      themeWeekId: themeWeek.id,
      generatedCount: 0,
      existingCount,
    };
  }

  const provider = createAiProvider();
  const generated = await provider.generateWeeklySuggestions({
    themeTitle: themeWeek.title,
    themeSlug: themeWeek.themeSlug || options.fallbackThemeSlug || "weekly-theme",
    weekStartIso: themeWeek.weekStartIso,
    weekEndIso: themeWeek.weekEndIso,
    desiredCount,
    language,
  });

  const parsedOutput = aiProviderOutputSchema.parse(generated);
  assertDiversityRequirements(parsedOutput.suggestions);

  const batch = adminDb.batch();
  for (const suggestion of parsedOutput.suggestions) {
    const ref = adminDb.collection("aiSuggestions").doc();
    batch.set(ref, {
      themeWeekId: themeWeek.id,
      title: suggestion.title,
      rationale: suggestion.rationale,
      tags: suggestion.tags,
      categoryHints: suggestion.categoryHints,
      diversityFlags: suggestion.diversityFlags,
      createdAt: FieldValue.serverTimestamp(),
      published: false,
      approvedBy: null,
    });
  }

  await batch.commit();

  logInfo("weekly_suggestions_created", {
    themeWeekId: themeWeek.id,
    generatedCount: parsedOutput.suggestions.length,
    existingCount,
    force,
  });

  return {
    status: "created",
    themeWeekId: themeWeek.id,
    generatedCount: parsedOutput.suggestions.length,
    existingCount,
  };
}
