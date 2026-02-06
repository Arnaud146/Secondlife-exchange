import { aiProviderOutputSchema } from "@secondlife/shared";
import { describe, expect, it } from "vitest";

import { assertDiversityRequirements, summarizeDiversity } from "./diversity.js";

describe("ai suggestion diversity", () => {
  it("validates strict zod output and satisfies diversity rules", () => {
    const parsed = aiProviderOutputSchema.parse({
      suggestions: [
        {
          title: "Vintage glass jars set",
          rationale: "Reusable kitchen storage with long durability and easy maintenance.",
          tags: ["kitchen", "reuse"],
          categoryHints: ["storage", "kitchen"],
          diversityFlags: {
            vintage: true,
            artisanal: false,
            repairable: true,
          },
        },
        {
          title: "Handmade wooden shelf",
          rationale:
            "Local artisan shelf that extends furniture lifetime and avoids fast decor waste.",
          tags: ["furniture", "artisan"],
          categoryHints: ["furniture", "decor"],
          diversityFlags: {
            vintage: false,
            artisanal: true,
            localCraft: true,
          },
        },
        {
          title: "Repair-ready lamp body",
          rationale:
            "Refurbishable lamp with replaceable elements to reduce e-waste and keep utility.",
          tags: ["lighting", "repair"],
          categoryHints: ["lighting", "electronics"],
          diversityFlags: {
            vintage: false,
            artisanal: false,
            repairable: true,
          },
        },
      ],
    });

    assertDiversityRequirements(parsed.suggestions, 3);

    const summary = summarizeDiversity(parsed.suggestions);
    expect(summary.vintageCount).toBe(1);
    expect(summary.artisanalCount).toBe(1);
    expect(summary.distinctCategoryHints.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects output when artisanal requirement is missing", () => {
    const suggestions = aiProviderOutputSchema.parse({
      suggestions: [
        {
          title: "Vintage frame bundle",
          rationale:
            "Second-life frames avoid new production and keep functional materials in use.",
          tags: ["decor", "vintage"],
          categoryHints: ["decor"],
          diversityFlags: {
            vintage: true,
            artisanal: false,
          },
        },
        {
          title: "Refill bottle pack",
          rationale: "Reusable bottle set decreases single-use packaging in daily routines.",
          tags: ["home", "reuse"],
          categoryHints: ["home"],
          diversityFlags: {
            vintage: false,
            artisanal: false,
          },
        },
        {
          title: "Second-hand toolbox",
          rationale:
            "Shared repair toolkits reduce duplication and support longer product lifespan.",
          tags: ["repair", "tools"],
          categoryHints: ["tools"],
          diversityFlags: {
            vintage: false,
            artisanal: false,
          },
        },
      ],
    }).suggestions;

    expect(() => assertDiversityRequirements(suggestions, 3)).toThrow(
      "Weekly AI suggestions must include at least one artisanal item.",
    );
  });
});
