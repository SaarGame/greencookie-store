import { useMemo, useState } from "react";
import type { ProductDetail } from "../lib/server/product-service";
import { formatMoney } from "../lib/util/format-money";
import { addItemToOrder } from "../lib/client/order-service";
import { QuantitySelector } from "./QuantitySelector";
import {
  getLowestPriceVariant,
  isVariantSoldOut,
} from "../lib/util/product-util";

type ProductSelectorProps = {
  product: ProductDetail;
  addToCartLabel: string;
  soldOutLabel: string;
  moreLabel: string;
};

export function ProductSelector({
  product,
  addToCartLabel,
  soldOutLabel,
  moreLabel,
}: ProductSelectorProps) {
  const defaultVariant = getLowestPriceVariant(product.variants);

  // Map of optionGroupId -> optionId for the current selection
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    if (defaultVariant) {
      for (const option of defaultVariant.options) {
        initial[option.group.id] = option.id;
      }
    }
    return initial;
  });

  // Derive the currently "active" variant and whether the exact selection is sold out
  const { currentVariant, soldOut } = useMemo(() => {
    const { variants } = product;

    if (variants.length === 0) {
      return { currentVariant: undefined, soldOut: true };
    } else if (variants.length === 1) {
      return {
        currentVariant: variants[0],
        soldOut: isVariantSoldOut(variants[0]),
      };
    }
    // Else map selected options to available variant
    const groupIds = Object.keys(selectedOptions);
    const exactMatch = variants.find(
      (variant) =>
        variant.options.length === groupIds.length &&
        variant.options.every(
          (option) => selectedOptions[option.group.id] === option.id,
        ),
    );
    return {
      currentVariant: exactMatch,
      soldOut: exactMatch ? isVariantSoldOut(exactMatch) : true,
    };
  }, [product.optionGroups.length, product.variants, selectedOptions]);

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Update the selected option for a single option group
  function handleSelectOption(groupId: string, optionId: string) {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: optionId,
    }));
  }

  // Add the currently selected variant to the active order
  async function handleAddToCart() {
    if (!currentVariant || typeof window === "undefined") return;
    const locale = window.__locale;
    setAdding(true);
    try {
      await addItemToOrder(locale, currentVariant.id, quantity);
    } finally {
      setAdding(false);
    }
  }

  const price =
    currentVariant?.priceWithTax ?? defaultVariant?.priceWithTax ?? 0;

  return (
    <div className="mt-6 space-y-6">
      <p
        className={`text-3xl tracking-tight ${
          soldOut ? "text-base-content/40 line-through" : "text-base-content"
        }`}
      >
        {formatMoney(price)} {soldOut ? `(${soldOutLabel})` : ""}
      </p>

      {product.optionGroups.length > 0 && (
        <div className="flex flex-wrap gap-8">
          {product.optionGroups.map((group) => (
            <div key={group.id} className="flex flex-col">
              <h3 className="text-base-content/70 text-sm font-medium">
                {group.name}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const isSelected = selectedOptions[group.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`btn btn-sm ${
                        isSelected ? "border-base-content" : "border-base-300"
                      }`}
                      onClick={() => handleSelectOption(group.id, option.id)}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <QuantitySelector
          moreLabel={moreLabel}
          quantity={quantity}
          onQuantityChange={setQuantity}
          className="h-10 shrink-0"
        />
        <button
          type="button"
          className="btn btn-primary min-w-0 flex-1"
          onClick={handleAddToCart}
          disabled={adding || !currentVariant || soldOut}
        >
          {adding ? (
            <span className="loading loading-spinner loading-sm" />
          ) : soldOut ? (
            `${soldOutLabel}`
          ) : (
            addToCartLabel
          )}
        </button>
      </div>
    </div>
  );
}
