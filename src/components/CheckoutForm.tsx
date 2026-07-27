import { useStore } from "@nanostores/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type ShippingMethodQuote,
  createMolliePaymentIntent,
  getEligibleShippingMethods,
  setCustomerForOrder,
  setOrderShippingAddress,
  setOrderShippingMethod,
} from "../lib/client/order-service";
import {
  $activeOrder,
  $notification,
  $savedCheckoutDetails,
  t,
} from "../lib/client/store";
import type { AvailableCountry } from "../lib/server/global-settings-service";
import { debounce } from "../lib/util/debounce";
import { formatMoney } from "../lib/util/format-money";
import { CartSummary } from "./CartSummary";

export function CheckoutForm({
  availableCountries,
}: {
  availableCountries: AvailableCountry[];
}) {
  const [eligibleShippingMethods, setEligibleShippingMethods] = useState<
    ShippingMethodQuote[]
  >([]);
  const [selectedShippingMethod, setSelectedShippingMethod] =
    useState<string>("");
  const [loading, setLoading] = useState(false);
  const customerFormRef = useRef<HTMLFormElement | null>(null);
  const addressFormRef = useRef<HTMLFormElement | null>(null);

  // Form defaults: order first, then persistent store, then empty
  let defaults: Record<string, string> = {};
  try {
    const o = $activeOrder.get();
    const s = $savedCheckoutDetails.get();
    defaults = {
      email: o?.customer?.emailAddress ?? s?.emailAddress ?? "",
      firstName: o?.customer?.firstName ?? s?.firstName ?? "",
      lastName: o?.customer?.lastName ?? s?.lastName ?? "",
      company: o?.shippingAddress?.company ?? s?.company ?? "",
      streetLine1: o?.shippingAddress?.streetLine1 ?? s?.streetLine1 ?? "",
      streetLine2: o?.shippingAddress?.streetLine2 ?? s?.streetLine2 ?? "",
      city: o?.shippingAddress?.city ?? s?.city ?? "",
      postalCode: o?.shippingAddress?.postalCode ?? s?.postalCode ?? "",
      countryCode: o?.shippingAddress?.countryCode ?? s?.countryCode ?? "NL",
    };
  } catch (error) {
    console.error(error);
  }

  // Set selected shipping method in form based on order and eligible shipping methods
  useEffect(() => {
    selectEligibleShippingMethod();
  }, []);

  if (!$activeOrder.get()?.totalQuantity) {
    return (
      <div className="py-12 text-center">
        <p className="text-base-content/70 mb-12">{t("cart.empty")}</p>
        <a href="/" className="btn btn-primary">
          {" "}
          Home
        </a>
      </div>
    );
  }

  /**
   * Set customer on order (email only)
   */
  async function handleCustomerFormSubmit(form: HTMLFormElement) {
    setLoading(true);
    try {
      const locale = window.__locale;
      const formData = new FormData(form);
      const email = (formData.get("email") as string) ?? "";
      if (!email) return;
      const currentOrder = $activeOrder.get();
      await setCustomerForOrder(locale, {
        firstName: currentOrder?.customer?.firstName ?? "",
        lastName: currentOrder?.customer?.lastName ?? "",
        emailAddress: email,
      });
      // Update selected shipping method because it may have changed due to the customer form submission
      await selectEligibleShippingMethod();
    } catch (err: unknown) {
      $notification.set({
        message: (err as Error)?.message ?? "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * Debounce the customer form submit by 300ms
   */
  const debounceHandleCustomerFormSubmit = useMemo(
    () => debounce(handleCustomerFormSubmit, 300),
    [],
  );

  /**
   * Set shipping and billing address. Accepts form and shouldRemember so it's safe to call from debounced handler.
   */
  async function handleAddressFormSubmit(form: HTMLFormElement) {
    setLoading(true);
    const locale = window.__locale;
    const formData = new FormData(form);
    const get = (key: string) => (formData.get(key) as string) ?? "";
    try {
      const firstName = get("firstName");
      const lastName = get("lastName");
      const currentOrder = $activeOrder.get();
      await setCustomerForOrder(locale, {
        firstName,
        lastName,
        emailAddress: currentOrder?.customer?.emailAddress ?? "",
      });
      await setOrderShippingAddress(locale, {
        fullName: [firstName, lastName].filter(Boolean).join(" "),
        company: get("company") || undefined,
        streetLine1: get("streetLine1"),
        streetLine2: get("streetLine2") || undefined,
        city: get("city"),
        postalCode: get("postalCode"),
        countryCode: get("countryCode"),
      });
      if (get("rememberMe") === "on") {
        // Save in persistent atom
        $savedCheckoutDetails.set({
          emailAddress: currentOrder?.customer?.emailAddress ?? "",
          firstName,
          lastName,
          company: get("company") || "",
          streetLine1: get("streetLine1"),
          streetLine2: get("streetLine2") || "",
          city: get("city"),
          postalCode: get("postalCode"),
          countryCode: get("countryCode"),
        });
      } else {
        // Remove from persistent atom
        $savedCheckoutDetails.set(null);
      }
      // Update selected shipping method because it may have changed due to the customer form submission
      await selectEligibleShippingMethod();
    } catch (err: unknown) {
      $notification.set({
        message: (err as Error)?.message ?? "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const debounceHandleAddressFormSubmit = useMemo(
    () => debounce(handleAddressFormSubmit, 300),
    [],
  );

  /**
   * Update the shipping method on the order in Vendure
   */
  async function handleSelectShippingMethod(methodId: string) {
    const locale = window.__locale;
    setLoading(true);
    try {
      setSelectedShippingMethod(methodId);
      await setOrderShippingMethod(locale, methodId);
    } catch (e: any) {
      $notification.set({
        message: e?.message ?? "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * Gets the eligible shipping methods for the current order and
   * selects the first method if no eligible method is currently selected on the order.
   *
   * This ensures we always have an eligible shipping method selected.
   */
  async function selectEligibleShippingMethod() {
    const locale = window.__locale;
    const eligibleMethods = await getEligibleShippingMethods(locale);
    setEligibleShippingMethods(eligibleMethods);
    // Use current order from store (closure order can be stale after address/method updates)
    const currentOrder = $activeOrder.get();
    let orderShippingMethodId = eligibleMethods.find(
      (m) => m.id === currentOrder?.shippingLines?.[0]?.shippingMethod?.id,
    )?.id;
    if (!orderShippingMethodId) {
      // If the order's shipping method is not currently eligible, select the first method
      orderShippingMethodId = eligibleMethods[0].id;
    }
    if (orderShippingMethodId == selectedShippingMethod) {
      // If the method is already selected, don't do anything
      return;
    }
    setSelectedShippingMethod(orderShippingMethodId);
    await setOrderShippingMethod(locale, orderShippingMethodId);
  }

  /**
   * Validates customer and address forms, re-submits both to the order, creates a Mollie payment intent,
   * then redirects the user to Mollie hosted checkout.
   */
  async function handleConfirmOrder() {
    const customerForm = customerFormRef.current;
    const addressForm = addressFormRef.current;
    if (!customerForm || !addressForm) return;

    const customerValid = customerForm.checkValidity();
    const addressValid = addressForm.checkValidity();

    if (!customerValid || !addressValid) {
      customerForm.reportValidity();
      addressForm.reportValidity();
      return;
    }

    setLoading(true);
    try {
      const locale = window.__locale;
      const currentOrder = $activeOrder.get();
      const redirectUrl = `https://${window.location.host}/${locale}/order/${currentOrder?.code}`;
      const url = await createMolliePaymentIntent(locale, { redirectUrl });
      window.location.href = url;
    } catch (err: unknown) {
      $notification.set({
        message: (err as Error)?.message ?? "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const order = useStore($activeOrder);
  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
      {/* Left column div */}
      <div>
        {/* Contact information */}
        <form
          id="customer-form"
          ref={customerFormRef}
          onSubmit={(e) => {
            e.preventDefault();
            debounceHandleCustomerFormSubmit(e.currentTarget);
          }}
          onChange={(e) => {
            e.currentTarget.requestSubmit();
          }}
        >
          <h2 className="text-lg">{t("checkout.contactInformation")}</h2>
          <div className="mt-4">
            <label htmlFor="email" className="block text-sm">
              {t("checkout.emailAddress")}
            </label>
            <div className="mt-2">
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                defaultValue={defaults.email}
                className="input w-full"
              />
            </div>
          </div>
        </form>

        {/* Shipping and billing address */}
        <form
          id="address-form"
          ref={addressFormRef}
          onSubmit={(e) => {
            e.preventDefault();
            debounceHandleAddressFormSubmit(e.currentTarget);
          }}
          onChange={(e) => {
            // Only submit if all required fields are filled
            const form = e.currentTarget;
            const requiredFields = Array.from(
              form.querySelectorAll("[required]"),
            ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];
            const allFilled = requiredFields.every(
              (field) => field.value.trim().length > 0,
            );
            if (allFilled) {
              form.requestSubmit();
            }
          }}
          className="mt-6"
        >
          <h2 className="text-lg">{t("checkout.shippingInformation")}</h2>
          <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
            <div>
              <label htmlFor="firstName" className="block text-sm">
                {t("checkout.firstName")}
              </label>
              <div className="mt-2">
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  required
                  defaultValue={defaults.firstName}
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm">
                {t("checkout.lastName")}
              </label>
              <div className="mt-2">
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  required
                  defaultValue={defaults.lastName}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="company" className="block text-sm">
                {t("checkout.company")}
              </label>
              <div className="mt-2">
                <input
                  id="company"
                  type="text"
                  name="company"
                  defaultValue={defaults.company}
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="postalCode" className="block text-sm">
                {t("checkout.postalCode")}
              </label>
              <div className="mt-2">
                <input
                  id="postalCode"
                  type="text"
                  name="postalCode"
                  autoComplete="postal-code"
                  required
                  defaultValue={defaults.postalCode}
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="streetLine2" className="block text-sm">
                {t("checkout.houseNumber")}
              </label>
              <div className="mt-2">
                <input
                  id="streetLine2"
                  type="text"
                  name="streetLine2"
                  required
                  defaultValue={defaults.streetLine2}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="streetLine1" className="block text-sm">
                {t("checkout.address")}
              </label>
              <div className="mt-2">
                <input
                  id="streetLine1"
                  type="text"
                  name="streetLine1"
                  autoComplete="street-address"
                  required
                  defaultValue={defaults.streetLine1}
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="city" className="block text-sm">
                {t("checkout.city")}
              </label>
              <div className="mt-2">
                <input
                  id="city"
                  type="text"
                  name="city"
                  autoComplete="address-level2"
                  required
                  defaultValue={defaults.city}
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="countryCode" className="block text-sm">
                {t("checkout.country")}
              </label>
              <div className="mt-2">
                <select
                  id="countryCode"
                  name="countryCode"
                  autoComplete="country"
                  required
                  defaultValue={defaults.countryCode}
                  className="select w-full"
                >
                  {availableCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-control mt-6">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="checkbox checkbox-sm bg-base-100"
                />
                <span className="label-text">{t("checkout.rememberMe")}</span>
              </label>
            </div>
          </div>
        </form>

        {/* Shipping methods */}
        {eligibleShippingMethods.length > 0 && (
          <div className="mt-10 pt-10">
            <fieldset>
              <legend className="text-lg">
                {t("checkout.deliveryMethod")}
              </legend>
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                {eligibleShippingMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`group bg-base-100 relative flex cursor-pointer rounded-lg p-4 ${
                      selectedShippingMethod === method.id
                        ? "ring-primary ring-2"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={method.id}
                      checked={selectedShippingMethod === method.id}
                      onChange={() => handleSelectShippingMethod(method.id)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <span className="block text-sm">{method.name}</span>
                      {method.description && (
                        <span className="text-base-content/60 mt-1 block text-sm">
                          {method.description}
                        </span>
                      )}
                      <span className="mt-6 block text-sm">
                        {formatMoney(method.priceWithTax)}
                      </span>
                    </div>
                    {selectedShippingMethod === method.id && (
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="text-primary size-5"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                        />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="mt-10 lg:mt-0">
        <h2 className="text-lg">{t("cart.orderSummary")}</h2>
        <div className="my-6 space-y-4">
          {order?.lines.map((line) => (
            <div key={line.id} className="flex gap-4">
              <div className="flex-1">
                <h4 className="font-semibold">{line.productVariant.name}</h4>
                <p className="text-base-content/70 text-sm">
                  {line.quantity} × {formatMoney(line.unitPriceWithTax)}
                </p>
              </div>
              <div className="font-semibold">
                {formatMoney(line.linePriceWithTax)}
              </div>
            </div>
          ))}

          <CartSummary className="bg-base-100" order={order} />

          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmOrder}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm" />{" "}
                {t("checkout.processing")}
              </>
            ) : (
              t("checkout.confirmOrder")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
