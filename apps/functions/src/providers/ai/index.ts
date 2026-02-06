import { env } from "../../config/env.js";
import type { AiProvider } from "./AiProvider.js";
import { GeminiProvider } from "./GeminiProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";

export function createAiProvider(): AiProvider {
  if (env.AI_PROVIDER === "openai") {
    if (!env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY for OpenAI provider.");
    }
    return new OpenAIProvider({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
    });
  }

  if (!env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY for Gemini provider.");
  }

  return new GeminiProvider({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
  });
}
