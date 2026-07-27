interface ImportMetaEnv {
  /**
   * Random secret to prevent unauthorized cache invalidation calls
   */
  CACHE_INVALIDATION_SECRET: string;
  /**
   * Vendure Shop API endpoint URL.
   */
  PUBLIC_VENDURE_SHOP_API: string;
  /**
   * Vendure channel token. If set, it is sent as the `vendure-token` header on every Shop API request.
   */
  PUBLIC_VENDURE_CHANNEL_TOKEN?: string;
  /**
   * Default locale code, e.g. `en`.
   */
  PUBLIC_DEFAULT_LOCALE: string;
  /**
   * Comma-separated list of enabled locale codes, e.g. `en,nl,de`.
   */
  PUBLIC_ENABLED_LOCALES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    locale: string;
  }
}

interface Window {
  __locale: string;
}
