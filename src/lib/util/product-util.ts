import type { CollectionDetailVariant } from "../types";
import type { ProductDetail } from "../types";

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

type GroupedVariant = Omit<CollectionDetailVariant, "product"> & {
  priceWithTax: number;
};

type ProductWithVariants = Pick<
  ProductDetail,
  "id" | "name" | "slug" | "featuredAsset"
> & {
  variants: GroupedVariant[];
};

export function groupVariantsByProduct(
  variants: CollectionDetailVariant[],
): ProductWithVariants[] {
  const map = new Map<string, ProductWithVariants>();
  for (const variant of variants) {
    const { product, ...rest } = variant;
    if (!map.has(product.id)) {
      map.set(product.id, {
        id: product.id,
        name: product.name,
        slug: product.slug,
        featuredAsset: product.featuredAsset,
        variants: [],
      });
    }
    map.get(product.id)!.variants.push(rest as GroupedVariant);
  }
  return Array.from(map.values());
}
