import type { AiProvider } from "./AiProvider.js";
import {
  weeklySuggestionsInputSchema,
  weeklySuggestionsOutputSchema,
  type WeeklySuggestionsInput,
  type WeeklySuggestionsOutput,
} from "./schemas.js";
import { extractStrictJson } from "./utils.js";

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export class GeminiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(params: { apiKey: string; model: string }) {
    this.apiKey = params.apiKey;
    this.model = params.model;
  }

  async generateWeeklySuggestions(input: WeeklySuggestionsInput): Promise<WeeklySuggestionsOutput> {
    const payload = weeklySuggestionsInputSchema.parse(input);

    const prompt = [
      "You generate second-hand exchange object suggestions.",
      "Return STRICT JSON only with no markdown and no extra text.",
      "Expected JSON shape:",
      JSON.stringify(
        {
          suggestions: [
            {
              title: "string",
              rationale: "string",
              tags: ["string"],
              categoryHints: ["string"],
              diversityFlags: {
                vintage: true,
                artisanal: true,
                upcycled: true,
                repairable: true,
                localCraft: true,
              },
            },
          ],
        },
        null,
        2,
      ),
      `Theme context: ${payload.themeTitle} (${payload.themeSlug})`,
      `Week range: ${payload.weekStartIso} -> ${payload.weekEndIso}`,
      `Language: ${payload.language}`,
      `Suggestion count: ${payload.desiredCount}`,
      "Diversity constraints: include at least one vintage and one artisanal suggestion.",
      "Cover multiple categories and include practical, repairable, and low-impact ideas.",
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 0.95,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini response did not contain text.");
    }

    const parsedJson = JSON.parse(extractStrictJson(text));
    return weeklySuggestionsOutputSchema.parse(parsedJson);
  }
}
