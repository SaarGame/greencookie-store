import { useEffect, useRef, useState } from "react";
import { type ActiveOrder, getOrderByCode } from "../lib/client/order-service";
import { m } from "../lib/client/store";
import { CartSummary } from "./CartSummary";
import { formatMoney } from "../lib/util/format-money";

/**
 * Polls the order status every second for up to 10 seconds after being redirected
 * back from Mollie. Once the order is found (payment settled), stops polling and
 * renders the confirmation view. If the order is not found within 10 seconds,
 * shows a failure message.
 *
 * Uses a ref (`foundRef`) instead of state for the timeout check because React
 * state updates are async — reading `order` from the timeout closure would always
 * be `null` regardless of whether the order was found.
 *
 * @param code - The Vendure order code (e.g. "KBN5GRD6K3JZMJ8Q")
 */
export function OrderConfirmation({ code }: { code: string }) {
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [failed, setFailed] = useState(false);
  const foundRef = useRef(false);

  /**
   * Polls every 1 second, stops when order is found or after 10 seconds.
   * Uses `foundRef` (not state) for the timeout check so the closure always sees
   * the current value without relying on async state updates.
   */
  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    async function poll() {
      const result = await getOrderByCode(window.__locale, code);
      if (!cancelled && result) {
        foundRef.current = true;
        setOrder(result);
        clearInterval(intervalId);
      }
    }

    poll();
    intervalId = setInterval(poll, 1000);

    const timeout = setTimeout(() => {
      cancelled = true;
      clearInterval(intervalId);
      if (!foundRef.current) {
        setFailed(true);
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      clearTimeout(timeout);
    };
  }, [code]);

  if (failed) {
    return (
      <div className="py-12 text-center">
        <p className="text-base-content/70 mb-6">{m.order_paymentFailed({})}</p>
        <a href="/" className="btn btn-primary">
          {m.order_backToHome({})}
        </a>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span className="loading loading-spinner loading-xl"></span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-center text-3xl font-bold">
        {m.order_confirmed({})}
      </h1>

      <div className="rounded-box bg-base-100 mb-8 p-2">
        <div className="mb-6 space-y-4 p-4">
          {order.lines.map((line) => (
            <div key={line.id} className="flex items-center gap-4">
              {line.featuredAsset?.preview ? (
                <img
                  src={line.featuredAsset.preview}
                  alt={line.productVariant.name}
                  className="size-16 rounded-lg object-cover"
                />
              ) : (
                <div className="bg-base-300 size-16 rounded-lg" />
              )}
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
        </div>

        <CartSummary order={order} />
      </div>

      {order.shippingAddress && (
        <div className="rounded-box bg-base-100 p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {m.checkout_shippingInformation({})}
          </h2>
          <p className="text-sm">
            {order.shippingAddress.fullName}
            {order.shippingAddress.company && (
              <>, {order.shippingAddress.company}</>
            )}
            <br />
            {order.shippingAddress.streetLine1}
            {order.shippingAddress.streetLine2 && (
              <> {order.shippingAddress.streetLine2}</>
            )}
            <br />
            {order.shippingAddress.postalCode} {order.shippingAddress.city}
            <br />
            {order.shippingAddress.country}
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <a href="/" className="btn btn-outline">
          {m.continueShopping({})}
        </a>
      </div>
    </div>
  );
}
