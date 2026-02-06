import type { AiProvider } from "./AiProvider.js";
import {
  weeklySuggestionsInputSchema,
  weeklySuggestionsOutputSchema,
  type WeeklySuggestionsInput,
  type WeeklySuggestionsOutput,
} from "./schemas.js";
import { extractStrictJson } from "./utils.js";

type OpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class OpenAIProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(params: { apiKey: string; model: string }) {
    this.apiKey = params.apiKey;
    this.model = params.model;
  }

  async generateWeeklySuggestions(input: WeeklySuggestionsInput): Promise<WeeklySuggestionsOutput> {
    const payload = weeklySuggestionsInputSchema.parse(input);

    const systemPrompt =
      "You generate second-hand item suggestions and must answer using strict JSON only.";
    const userPrompt = [
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
      `Theme: ${payload.themeTitle} (${payload.themeSlug})`,
      `Week: ${payload.weekStartIso} -> ${payload.weekEndIso}`,
      `Language: ${payload.language}`,
      `Count: ${payload.desiredCount}`,
      "Diversity constraints: include at least one vintage and one artisanal suggestion.",
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.3,
        response_format: {
          type: "json_object",
        },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OpenAiResponse;
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("OpenAI response did not contain content.");
    }

    const parsedJson = JSON.parse(extractStrictJson(text));
    return weeklySuggestionsOutputSchema.parse(parsedJson);
  }
}
