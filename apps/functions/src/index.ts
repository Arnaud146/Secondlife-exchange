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
import { handleHttpError, sendJson } from "./lib/http.js";
import { logError, logInfo } from "./lib/logger.js";
import { assertWithinRateLimit } from "./lib/rate-limit.js";

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 10,
});

export const health = onRequest({ cors: true }, async (req, res) => {
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

export const getSessionContext = onRequest({ cors: true }, getSessionContextHandler);
export const getMyProfile = onRequest({ cors: true }, getMyProfileHandler);
export const upsertMyProfile = onRequest({ cors: true }, upsertMyProfileHandler);
export const adminListUsers = onRequest({ cors: true }, adminListUsersHandler);
export const createItem = onRequest({ cors: true }, createItemHandler);
export const listItems = onRequest({ cors: true }, listItemsHandler);
export const getItemDetail = onRequest({ cors: true }, getItemDetailHandler);
export const updateItem = onRequest({ cors: true }, updateItemHandler);
export const archiveItem = onRequest({ cors: true }, archiveItemHandler);
export const addItemMedia = onRequest({ cors: true }, addItemMediaHandler);
export const getCurrentThemeWeek = onRequest({ cors: true }, getCurrentThemeWeekHandler);
export const listThemeWeeks = onRequest({ cors: true }, listThemeWeeksHandler);
export const createThemeWeek = onRequest({ cors: true }, createThemeWeekHandler);
export const listPublishedAiSuggestions = onRequest(
  { cors: true },
  listPublishedAiSuggestionsHandler,
);
export const listPendingAiSuggestions = onRequest({ cors: true }, listPendingAiSuggestionsHandler);
export const approveAiSuggestion = onRequest({ cors: true }, approveAiSuggestionHandler);
export const deleteAiSuggestion = onRequest({ cors: true }, deleteAiSuggestionHandler);
export const adminGenerateWeeklySuggestions = onRequest(
  { cors: true },
  adminGenerateWeeklySuggestionsHandler,
);
export const listEcoContents = onRequest({ cors: true }, listEcoContentsHandler);
export const getEcoContentDetail = onRequest({ cors: true }, getEcoContentDetailHandler);
export const trackEcoView = onRequest({ cors: true }, trackEcoViewHandler);
export const adminListEcoContents = onRequest({ cors: true }, adminListEcoContentsHandler);
export const adminCreateEcoContent = onRequest({ cors: true }, adminCreateEcoContentHandler);

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
