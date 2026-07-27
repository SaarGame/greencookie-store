import type { ActiveOrder } from "./order-service";
import { persistentAtom } from "@nanostores/persistent";
import { atom } from "nanostores";
import type { Notification } from "../../components/Notification";
import { ui, defaultLang } from "../../i18n/ui";
/**
 * Active order store. Will always contain the latest active order.
 */
export const $activeOrder = persistentAtom<ActiveOrder | null>(
  "activeOrder",
  null,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

/**
 * Global notification store. Will contain the latest notification.
 */
export const $notification = atom<Notification | null>(null);

/**
 * Controls whether the cart modal is visible.
 */
export const $cartOpen = atom<boolean>(false);

/**
 * Saved checkout details (customer + address) when "remember me" is checked.
 * Used to pre-fill the checkout form on next visit.
 */
export interface SavedCheckoutDetails {
  emailAddress: string;
  firstName: string;
  lastName: string;
  company: string;
  streetLine1: string;
  streetLine2: string;
  city: string;
  postalCode: string;
  countryCode: string;
}

export const $savedCheckoutDetails =
  persistentAtom<SavedCheckoutDetails | null>("savedCheckoutDetails", null, {
    encode: JSON.stringify,
    decode: JSON.parse,
  });

type TranslationKey = keyof (typeof ui)[typeof defaultLang];

/**
 * Translation function for the current locale.
 * Should only be used on the client side!
 *
 * Example: `t("cart.title")` returns "Shopping Cart"
 */
export function t(key: TranslationKey): string {
  const lang = (typeof window !== "undefined" ? window.__locale : defaultLang) as keyof typeof ui;
  return (ui[lang]?.[key] ?? ui[defaultLang][key]) as string;
}
