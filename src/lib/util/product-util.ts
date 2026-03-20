/**
 * Get's the variant with the lowest price
 */
export function getLowestPriceVariant<T extends { priceWithTax: number }>(
  variants: T[],
): T | undefined {
  if (variants.length === 0) {
    return undefined;
  }
  return variants.reduce((lowest, variant) =>
    variant.priceWithTax < lowest.priceWithTax ? variant : lowest,
  );
}

export function isVariantSoldOut<T extends { stockLevel: string }>(
  variant: T,
): boolean {
  return variant.stockLevel === "OUT_OF_STOCK";
}
