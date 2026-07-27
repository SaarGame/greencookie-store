import { type ResultOf, type VariablesOf } from "gql.tada";
import {
  getErrorMessage,
  isErrorResult,
  type ErrorResult,
} from "../util/error-util";
import {
  ActiveOrderFragment,
  ActiveOrderQuery,
  AddItemToOrderMutation,
  AdjustOrderLineMutation,
  ApplyCouponCodeMutation,
  RemoveCouponCodeMutation,
  SetCustomerForOrderMutation,
  SetOrderShippingAddressMutation,
  EligibleShippingMethodsQuery,
  SetOrderShippingMethodMutation,
  TransitionOrderToStateMutation,
  AddPaymentToOrderMutation,
  EligiblePaymentMethodsQuery,
  CreateMolliePaymentIntentMutation,
  OrderByCodeQuery,
} from "./order-queries";
import { $activeOrder, $cartOpen, $notification, t } from "./store";
import { vendureClient } from "../util/vendure-client";

export type ActiveOrder = NonNullable<ResultOf<typeof ActiveOrderFragment>>;

/**
 * Fetch the active order from Vendure and persist it in the store.
 */
export async function getActiveOrder(locale: string): Promise<void> {
  const { activeOrder } = await vendureClient(locale).request(ActiveOrderQuery);
  $activeOrder.set(activeOrder);
}

export async function addItemToOrder(
  locale: string,
  productVariantId: string,
  quantity: number,
): Promise<void> {
  const { addItemToOrder } = await vendureClient(locale)
    .request(AddItemToOrderMutation, { productVariantId, quantity })
    .catch((error) => {
      $notification.set({ message: getErrorMessage(error), type: "error" });
      throw error;
    });
  const error = isErrorResult(addItemToOrder);
  if (error) {
    $notification.set({ message: error.message, type: "error" });
    throw error;
  }
  $activeOrder.set(addItemToOrder as ActiveOrder);
  const variant =
    $activeOrder
      .get()
      ?.lines.find((line) => line.productVariant.id == productVariantId)
      ?.productVariant.name ?? "";
  $notification.set({
    message: `<strong>${variant}</strong> ${t("cart.itemAdded")}`,
    type: "success",
    cta: {
      text: t("cart.viewCart"),
      callback: () => {
        $cartOpen.set(true);
      },
    },
  });
}

export async function adjustOrderLine(
  locale: string,
  orderLineId: string,
  quantity: number,
): Promise<void> {
  const { adjustOrderLine } = await vendureClient(locale).request(
    AdjustOrderLineMutation,
    { orderLineId, quantity },
  );
  const error = isErrorResult(adjustOrderLine);
  if (error) {
    $notification.set({ message: error.message, type: "error" });
    return;
  }
  $activeOrder.set(adjustOrderLine as ActiveOrder);
}

export async function removeOrderLine(
  locale: string,
  orderLineId: string,
): Promise<void> {
  return await adjustOrderLine(locale, orderLineId, 0);
}

export async function applyCouponCode(
  locale: string,
  couponCode: string,
): Promise<ErrorResult | undefined> {
  const { applyCouponCode } = await vendureClient(locale)
    .request(ApplyCouponCodeMutation, { couponCode })
    .catch((error) => {
      $notification.set({ message: getErrorMessage(error), type: "error" });
      throw error;
    });
  const error = isErrorResult(applyCouponCode);
  if (error) {
    return error;
  }
  $activeOrder.set(applyCouponCode as ActiveOrder);
}

export async function removeCouponCode(
  locale: string,
  couponCode: string,
): Promise<void> {
  const { removeCouponCode } = await vendureClient(locale)
    .request(RemoveCouponCodeMutation, { couponCode })
    .catch((error) => {
      $notification.set({ message: getErrorMessage(error), type: "error" });
      throw error;
    });
  $activeOrder.set(removeCouponCode);
}

export type ShippingMethodQuote = ResultOf<
  typeof EligibleShippingMethodsQuery
>["eligibleShippingMethods"][number];
export type EligiblePaymentMethod = ResultOf<
  typeof EligiblePaymentMethodsQuery
>["eligiblePaymentMethods"][number];
type MolliePaymentIntentResult = ResultOf<
  typeof CreateMolliePaymentIntentMutation
>["createMolliePaymentIntent"];
type MolliePaymentIntentInput = VariablesOf<
  typeof CreateMolliePaymentIntentMutation
>["input"];

export async function setCustomerForOrder(
  locale: string,
  input: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber?: string;
  },
): Promise<void> {
  const { setCustomerForOrder } = await vendureClient(locale).request(
    SetCustomerForOrderMutation,
    { input },
  );
  const error = isErrorResult(setCustomerForOrder);
  if (error) {
    $notification.set({ message: error.message, type: "error" });
    throw error;
  }
  $activeOrder.set(setCustomerForOrder as ActiveOrder);
}

export async function setOrderShippingAddress(
  locale: string,
  input: {
    fullName?: string;
    company?: string;
    streetLine1: string;
    streetLine2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    countryCode: string;
    phoneNumber?: string;
  },
): Promise<void> {
  const { setOrderShippingAddress } = await vendureClient(locale).request(
    SetOrderShippingAddressMutation,
    { input },
  );
  const error = isErrorResult(setOrderShippingAddress);
  if (error) {
    $notification.set({ message: error.message, type: "error" });
    throw error;
  }
  $activeOrder.set(setOrderShippingAddress as ActiveOrder);
}

export async function getEligibleShippingMethods(
  locale: string,
): Promise<ShippingMethodQuote[]> {
  const { eligibleShippingMethods } = await vendureClient(locale).request(
    EligibleShippingMethodsQuery,
  );
  return eligibleShippingMethods;
}

export async function setOrderShippingMethod(
  locale: string,
  shippingMethodId: string,
): Promise<void> {
  const { setOrderShippingMethod } = await vendureClient(locale).request(
    SetOrderShippingMethodMutation,
    { id: [shippingMethodId] },
  );
  const error = isErrorResult(setOrderShippingMethod);
  if (error) {
    $notification.set({ message: error.message, type: "error" });
    throw error;
  }
  $activeOrder.set(setOrderShippingMethod as ActiveOrder);
}

export async function transitionOrderToState(
  locale: string,
  state: string,
): Promise<void> {
  const { transitionOrderToState } = await vendureClient(locale).request(
    TransitionOrderToStateMutation,
    { state },
  );
  const error = isErrorResult(transitionOrderToState);
  if (error) {
    $notification.set({ message: error.message, type: "error" });
    throw error;
  }
  $activeOrder.set(transitionOrderToState as ActiveOrder);
}

export async function addPaymentToOrder(
  locale: string,
  method: string,
  metadata: Record<string, any> = {},
): Promise<string | undefined> {
  const { addPaymentToOrder } = await vendureClient(locale).request(
    AddPaymentToOrderMutation,
    { input: { method, metadata } },
  );
  const error = isErrorResult(addPaymentToOrder);
  if (error) return error.message;
  $activeOrder.set(addPaymentToOrder as ActiveOrder);
}

export async function getEligiblePaymentMethods(
  locale: string,
): Promise<EligiblePaymentMethod[]> {
  const { eligiblePaymentMethods } = await vendureClient(locale).request(
    EligiblePaymentMethodsQuery,
  );
  return eligiblePaymentMethods;
}

/**
 * Creates a Mollie payment intent for the active order and returns the hosted checkout URL.
 * Redirect the user to this URL to complete payment on Mollie.
 * @param locale - Storefront locale (used for the GraphQL client).
 * @returns The Mollie checkout URL to redirect to.
 * @throws On MolliePaymentIntentError or request failure.
 */
export async function createMolliePaymentIntent(
  locale: string,
  input: MolliePaymentIntentInput,
): Promise<string> {
  const { createMolliePaymentIntent: result } = await vendureClient(
    locale,
  ).request(CreateMolliePaymentIntentMutation, { input });
  if ("errorCode" in result) {
    const message = result.message ?? "Unable to create Mollie payment.";
    $notification.set({ message, type: "error" });
    throw new Error(message);
  }

  return (
    result as Extract<
      MolliePaymentIntentResult,
      { __typename?: "MolliePaymentIntent" }
    >
  ).url;
}

export async function getOrderByCode(
  locale: string,
  code: string,
): Promise<ActiveOrder | null> {
  const { orderByCode } = await vendureClient(locale).request(
    OrderByCodeQuery,
    { code },
  );
  return orderByCode ?? null;
}
