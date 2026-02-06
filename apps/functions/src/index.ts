import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { env } from "./config/env.js";
import { getSessionContextHandler } from "./features/auth/http.js";
import { adminListUsersHandler } from "./features/admin/http.js";
import {
  adminGenerateWeeklySuggestionsHandler,
  approveAiSuggestionHandler,
  deleteAiSuggestionHandler,
  listPendingAiSuggestionsHandler,
  listPublishedAiSuggestionsHandler,
} from "./features/ai-suggestions/http.js";
import {
  adminCreateEcoContentHandler,
  adminListEcoContentsHandler,
  getEcoContentDetailHandler,
  listEcoContentsHandler,
  trackEcoViewHandler,
} from "./features/eco/http.js";
import { generateWeeklySuggestionsForCurrentTheme } from "./features/ai-suggestions/service.js";
import {
  addItemMediaHandler,
  archiveItemHandler,
  createItemHandler,
  getItemDetailHandler,
  listItemsHandler,
  updateItemHandler,
} from "./features/items/http.js";
import {
  createThemeWeekHandler,
  getCurrentThemeWeekHandler,
  listThemeWeeksHandler,
} from "./features/themes/http.js";
import { getMyProfileHandler, upsertMyProfileHandler } from "./features/users/http.js";
import { type HttpHandler, handleHttpError, sendJson, withCors } from "./lib/http.js";
import { logError, logInfo } from "./lib/logger.js";
import { assertWithinRateLimit } from "./lib/rate-limit.js";

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 10,
});

/**
 * Helper that creates an `onRequest` function with manual CORS support via
 * the `withCors` wrapper. We intentionally do NOT use Firebase's built-in
 * `cors: true` option because it intercepts OPTIONS preflight requests at the
 * infrastructure level and can silently fail (especially during cold starts),
 * returning responses without the required `Access-Control-Allow-Origin`
 * header. By handling CORS entirely in our own wrapper, we guarantee the
 * correct headers are always set for every request, including OPTIONS.
 */
const corsRequest = (handler: HttpHandler) => onRequest(withCors(handler));

export const health = corsRequest(async (req, res) => {
  try {
    const ip = req.ip ?? "unknown";
    assertWithinRateLimit({
      key: `health:${ip}`,
      maxTokens: env.RATE_LIMIT_MAX,
      refillWindowMs: env.RATE_LIMIT_WINDOW_MS,
    });

    sendJson(res, 200, {
      success: true,
      data: {
        service: "secondlife-functions",
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleHttpError(res, error);
  }
});

export const getSessionContext = corsRequest(getSessionContextHandler);
export const getMyProfile = corsRequest(getMyProfileHandler);
export const upsertMyProfile = corsRequest(upsertMyProfileHandler);
export const adminListUsers = corsRequest(adminListUsersHandler);
export const createItem = corsRequest(createItemHandler);
export const listItems = corsRequest(listItemsHandler);
export const getItemDetail = corsRequest(getItemDetailHandler);
export const updateItem = corsRequest(updateItemHandler);
export const archiveItem = corsRequest(archiveItemHandler);
export const addItemMedia = corsRequest(addItemMediaHandler);
export const getCurrentThemeWeek = corsRequest(getCurrentThemeWeekHandler);
export const listThemeWeeks = corsRequest(listThemeWeeksHandler);
export const createThemeWeek = corsRequest(createThemeWeekHandler);
export const listPublishedAiSuggestions = corsRequest(listPublishedAiSuggestionsHandler);
export const listPendingAiSuggestions = corsRequest(listPendingAiSuggestionsHandler);
export const approveAiSuggestion = corsRequest(approveAiSuggestionHandler);
export const deleteAiSuggestion = corsRequest(deleteAiSuggestionHandler);
export const adminGenerateWeeklySuggestions = corsRequest(adminGenerateWeeklySuggestionsHandler);
export const listEcoContents = corsRequest(listEcoContentsHandler);
export const getEcoContentDetail = corsRequest(getEcoContentDetailHandler);
export const trackEcoView = corsRequest(trackEcoViewHandler);
export const adminListEcoContents = corsRequest(adminListEcoContentsHandler);
export const adminCreateEcoContent = corsRequest(adminCreateEcoContentHandler);

export const generateWeeklySuggestions = onSchedule(
  {
    schedule: "0 8 * * 1",
    timeZone: "Europe/Paris",
    memory: "256MiB",
    timeoutSeconds: 120,
    retryCount: 1,
  },
  async () => {
    try {
      const result = await generateWeeklySuggestionsForCurrentTheme({
        force: false,
        desiredCount: 8,
        language: "fr",
      });

      logInfo("weekly_suggestions_scheduler_result", result);
    } catch (error) {
      logError("weekly_suggestions_generation_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    }
  },
);
