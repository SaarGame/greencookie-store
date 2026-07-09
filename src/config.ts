const VENDURE_SHOP_API = import.meta.env.PUBLIC_VENDURE_SHOP_API;
const VENDURE_CHANNEL_TOKEN = import.meta.env.PUBLIC_VENDURE_CHANNEL_TOKEN;
const DEFAULT_LOCALE_ENV = import.meta.env.PUBLIC_DEFAULT_LOCALE;
const ENABLED_LOCALES_ENV = import.meta.env.PUBLIC_ENABLED_LOCALES;

export const CHANNEL_TOKEN = VENDURE_CHANNEL_TOKEN;

export const vendureApi = (locale: string) =>
  `${VENDURE_SHOP_API}?languageCode=${locale}`;

export const DEFAULT_LOCALE = DEFAULT_LOCALE_ENV || "en";

export const ENABLED_LOCALES = ENABLED_LOCALES_ENV
  ? ENABLED_LOCALES_ENV.split(",").map((l: string) => l.trim())
  : ["en"];