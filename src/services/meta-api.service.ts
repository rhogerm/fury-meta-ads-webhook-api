import { env } from "../config/env.js";
import type { TakedownJobResult } from "../types/takedown.js";

export class MetaApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetaApiError";
  }
}

export const requestMetaTakedown = async (): Promise<TakedownJobResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.META_API_TIMEOUT_MS);

  try {
    const response = await fetch(env.META_API_URL, {
      method: "GET",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new MetaApiError(
        `Meta API returned ${response.status} ${response.statusText}`
      );
    }

    return {
      metaApiStatus: response.status,
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof MetaApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new MetaApiError(
        `Meta API request timed out after ${env.META_API_TIMEOUT_MS}ms`
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    throw new MetaApiError(`Meta API request failed: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
};
