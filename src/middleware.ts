import { defineMiddleware, sequence } from "astro:middleware";
import { createMessageFn } from "./lib/util/locale-util";
import { translations } from "./translations";
import { ENABLED_LOCALES, DEFAULT_LOCALE } from "./config";

const i18nMiddleware = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // Skip locale detection for specific routes
  if (
    pathname.startsWith("/_image") ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/api/")
  ) {
    return next();
  }

  let locale = pathname.split("/")?.[1];
  if (!locale || !ENABLED_LOCALES.includes(locale)) {
    // We assume that the first part of the path is the NOT a locale,
    // so we rewrite to the default locale and append current path
    locale = DEFAULT_LOCALE;
    const newUrl = new URL(context.url);
    newUrl.search = context.url.search;
    newUrl.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return context.redirect(newUrl.href);
  }
  const translatedMessages = translations[locale as keyof typeof translations];
  context.locals.locale = locale;
  context.locals.m = createMessageFn(translatedMessages);
  return next();
});

export const onRequest = sequence(i18nMiddleware);
