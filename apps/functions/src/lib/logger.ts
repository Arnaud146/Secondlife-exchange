import { logger } from "firebase-functions";

export function logInfo(event: string, payload?: Record<string, unknown>) {
  logger.info(event, payload ?? {});
}

export function logError(event: string, payload?: Record<string, unknown>) {
  logger.error(event, payload ?? {});
}
