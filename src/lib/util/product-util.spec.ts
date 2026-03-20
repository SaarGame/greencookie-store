import { describe, it, expect } from "vitest";
import { groupVariantsByProduct } from "./product-util";

describe("groupVariantsByProduct", () => {
  const createVariant = (
    id: string,
    productId: string,
    productName: string,
    productSlug: string,
  ) => ({
    id,
    name: `Variant ${id}`,
    sku: `SKU-${id}`,
    stockLevel: "IN_STOCK",
    currencyCode: "USD" as const,
    priceWithTax: 100,
    options: [],
    featuredAsset: null,
    assets: [],
    product: {
      id: productId,
      name: productName,
      slug: productSlug,
      featuredAsset: null,
    },
  });

  it("returns empty array for empty input", () => {
    const result = groupVariantsByProduct([]);
    expect(result).toEqual([]);
  });

  it("groups single variant into one product", () => {
    const variants = [createVariant("v1", "p1", "Product 1", "product-1")];
    const result = groupVariantsByProduct(variants);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p1");
    expect(result[0].name).toBe("Product 1");
    expect(result[0].slug).toBe("product-1");
    expect(result[0].variants).toHaveLength(1);
    expect(result[0].variants[0].id).toBe("v1");
  });

  it("groups multiple variants of same product together", () => {
    const variants = [
      createVariant("v1", "p1", "Product 1", "product-1"),
      createVariant("v2", "p1", "Product 1", "product-1"),
      createVariant("v3", "p1", "Product 1", "product-1"),
    ];
    const result = groupVariantsByProduct(variants);

    expect(result).toHaveLength(1);
    expect(result[0].variants).toHaveLength(3);
    expect(result[0].variants.map((v) => v.id)).toEqual(["v1", "v2", "v3"]);
  });

  it("separates variants of different products into different groups", () => {
    const variants = [
      createVariant("v1", "p1", "Product 1", "product-1"),
      createVariant("v2", "p2", "Product 2", "product-2"),
      createVariant("v3", "p1", "Product 1", "product-1"),
    ];
    const result = groupVariantsByProduct(variants);

    expect(result).toHaveLength(2);
    expect(result.find((p) => p.id === "p1")?.variants).toHaveLength(2);
    expect(result.find((p) => p.id === "p2")?.variants).toHaveLength(1);
  });

  it("preserves order by first variant seen", () => {
    const variants = [
      createVariant("v1", "p2", "Product 2", "product-2"),
      createVariant("v2", "p1", "Product 1", "product-1"),
      createVariant("v3", "p3", "Product 3", "product-3"),
    ];
    const result = groupVariantsByProduct(variants);

    expect(result.map((p) => p.id)).toEqual(["p2", "p1", "p3"]);
  });

  it("maintains product featuredAsset from first variant", () => {
    const variants = [
      {
        id: "v1",
        name: "Variant 1",
        sku: "SKU-1",
        stockLevel: "IN_STOCK",
        currencyCode: "USD" as const,
        priceWithTax: 100,
        options: [],
        featuredAsset: null,
        assets: [],
        product: {
          id: "p1",
          name: "Product 1",
          slug: "product-1",
          featuredAsset: { id: "a1", preview: "image.jpg" },
        },
      },
      {
        id: "v2",
        name: "Variant 2",
        sku: "SKU-2",
        stockLevel: "IN_STOCK",
        currencyCode: "USD" as const,
        priceWithTax: 150,
        options: [],
        featuredAsset: null,
        assets: [],
        product: {
          id: "p1",
          name: "Product 1",
          slug: "product-1",
          featuredAsset: { id: "a2", preview: "other.jpg" },
        },
      },
    ];
    const result = groupVariantsByProduct(variants);

    expect(result[0].featuredAsset).toEqual({ id: "a1", preview: "image.jpg" });
  });
});
