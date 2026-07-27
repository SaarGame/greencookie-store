import { formatMoney } from "../lib/util/format-money";
import { t } from "../lib/client/store";
import type { ActiveOrder } from "../lib/client/order-service";

export function CartSummary({
  order,
  className,
}: {
  order: ActiveOrder | null;
  className?: string;
}) {
  const subTotalWithoutDiscounts =
    order?.lines.reduce((acc, line) => acc + line.linePriceWithTax, 0) ?? 0;
  return (
    <div className={`rounded-box space-y-2 p-4 ${className}`}>
      <div className="flex justify-between">
        <span>{t("cart.subtotal")}</span>
        <span>{formatMoney(subTotalWithoutDiscounts)}</span>
      </div>
      {order?.discounts?.map((discount, i) => (
        <div key={i} className="text-success flex justify-between">
          <span>{discount.description}</span>
          <span>{formatMoney(discount.amountWithTax)}</span>
        </div>
      ))}
      {order?.shippingWithTax != undefined && (
        <div className="flex justify-between">
          <span>{t("cart.shipping")}</span>
          <span>{formatMoney(order?.shippingWithTax)}</span>
        </div>
      )}
      <div className="divider my-0"></div>
      <div className="flex justify-between text-lg font-bold">
        <span>{t("cart.total")}</span>
        <span>{formatMoney(order?.totalWithTax ?? 0)}</span>
      </div>
    </div>
  );
}
