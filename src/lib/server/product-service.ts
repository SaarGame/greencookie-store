import { type ResultOf } from "gql.tada";
import request from "graphql-request";
import { vendureApi, cache } from "../../config";
import { graphql } from "../../graphql/graphql";

const ProductDetailFragment = graphql(`
  fragment ProductDetail on Product @_unmask {
    id
    name
    slug
    description
    featuredAsset {
      id
      preview
    }
    assets {
      id
      preview
    }
    optionGroups {
      id
      code
      name
      options {
        id
        code
        name
      }
    }
    variants {
      id
      name
      sku
      stockLevel
      currencyCode
      priceWithTax
      options {
        id
        code
        name
        group {
          id
          name
        }
      }
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
      }
    }
    collections {
      id
      name
      slug
      breadcrumbs {
        id
        name
        slug
      }
    }
  }
`);

const PopularProductsQuery = graphql(
  `
    query GetPopularProducts($limit: Int!) {
      products(options: { take: $limit }) {
        items {
          ...ProductDetail
        }
      }
    }
  `,
  [ProductDetailFragment],
);

const ProductBySlugQuery = graphql(
  `
    query GetProductBySlug($slug: String!) {
      product(slug: $slug) {
        ...ProductDetail
      }
    }
  `,
  [ProductDetailFragment],
);

export type ProductDetail = NonNullable<ResultOf<typeof ProductDetailFragment>>;

/**
 * Gets the first 5 products from Vendure
 */
export async function getPopularProducts(
  locale: string,
  limit: number = 4,
): Promise<ProductDetail[]> {
  const getPopularProducts = () =>
    request(vendureApi(locale), PopularProductsQuery, {
      limit,
    });
  const {
    products: { items },
  } = await cache.get(`popular-products-${limit}`, getPopularProducts);
  return items;
}

export async function getProductBySlug(
  locale: string,
  slug: string,
): Promise<ProductDetail | null> {
  const getProductBySlug = () =>
    request(vendureApi(locale), ProductBySlugQuery, {
      slug,
    });
  const { product } = await cache.get(`product-${slug}`, getProductBySlug);
  return product;
}

const SitemapProductsQuery = graphql(`
  query GetSitemapProducts($skip: Int!, $take: Int!) {
    products(options: { skip: $skip, take: $take }) {
      items {
        slug
        updatedAt
      }
      totalItems
    }
  }
`);

export type SitemapProductEntry = ResultOf<
  typeof SitemapProductsQuery
>["products"]["items"][number];

/**
 * Fetches all product slugs and updatedAt for sitemap.
 */
export async function getSitemapProducts(
  locale: string,
): Promise<SitemapProductEntry[]> {
  const SITEMAP_BATCH_SIZE = 100;
  const out: SitemapProductEntry[] = [];
  let skip = 0;
  let hasMore = true;
  while (hasMore) {
    const { products } = await request(
      vendureApi(locale),
      SitemapProductsQuery,
      {
        skip,
        take: SITEMAP_BATCH_SIZE,
      },
    );
    out.push(...products.items);
    skip += SITEMAP_BATCH_SIZE;
    hasMore =
      products.items.length === SITEMAP_BATCH_SIZE &&
      skip < products.totalItems;
  }
  return out;
}
