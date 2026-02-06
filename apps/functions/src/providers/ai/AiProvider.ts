import type { WeeklySuggestionsInput, WeeklySuggestionsOutput } from "./schemas.js";

export interface AiProvider {
  generateWeeklySuggestions(input: WeeklySuggestionsInput): Promise<WeeklySuggestionsOutput>;
}
