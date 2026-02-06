import type { AiProviderOutput } from "@secondlife/shared";

export const MIN_DISTINCT_CATEGORY_HINTS = 3;

export type DiversityCheckSummary = {
  vintageCount: number;
  artisanalCount: number;
  distinctCategoryHints: string[];
};

function normalizeCategoryHint(value: string): string {
  return value.trim().toLowerCase();
}

export function summarizeDiversity(
  suggestions: AiProviderOutput["suggestions"],
): DiversityCheckSummary {
  let vintageCount = 0;
  let artisanalCount = 0;
  const categoryHints = new Set<string>();

  for (const suggestion of suggestions) {
    if (suggestion.diversityFlags.vintage) {
      vintageCount += 1;
    }
    if (suggestion.diversityFlags.artisanal) {
      artisanalCount += 1;
    }

    for (const categoryHint of suggestion.categoryHints) {
      categoryHints.add(normalizeCategoryHint(categoryHint));
    }
  }

  return {
    vintageCount,
    artisanalCount,
    distinctCategoryHints: Array.from(categoryHints),
  };
}

export function assertDiversityRequirements(
  suggestions: AiProviderOutput["suggestions"],
  minDistinctCategoryHints = MIN_DISTINCT_CATEGORY_HINTS,
) {
  const summary = summarizeDiversity(suggestions);

  if (summary.vintageCount < 1) {
    throw new Error("Weekly AI suggestions must include at least one vintage item.");
  }

  if (summary.artisanalCount < 1) {
    throw new Error("Weekly AI suggestions must include at least one artisanal item.");
  }

  if (summary.distinctCategoryHints.length < minDistinctCategoryHints) {
    throw new Error(
      `Weekly AI suggestions must include at least ${minDistinctCategoryHints} distinct category hints.`,
    );
  }
}
