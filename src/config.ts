import { SwrCache, type Cache } from "./lib/util/swr-cache";

export const vendureApi = (locale: string) =>
  `https://vendure.noharmdone.nl/shop-api?languageCode=${locale}`;
export const DEFAULT_LOCALE = "nl";
export const ENABLED_LOCALES = ["nl"];

export const cache: Cache = new SwrCache(60 * 60 * 24); // 24 hours default TTL. Can be overridden per entry.

// Uncomment this line to disable caching
// export const cache: Cache = new NoOpCache();
