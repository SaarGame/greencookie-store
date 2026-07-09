import { graphql, type ResultOf } from "gql.tada";
import { cache } from "../../config";
import { vendureClient } from "../util/vendure-client";

export type NavigationCollection = NonNullable<
  ResultOf<typeof NavigationCollectionsQuery>
>["collections"]["items"][number];


const NavigationCollectionsQuery = graphql(`
  query {
    collections(options: { topLevelOnly: true, take: 10 }) {
      items {
        id
        name
        description
        slug
        featuredAsset {
          preview
        }
        children {
          id
          name
          slug
          featuredAsset {
            preview
          }
        }
      }
    }
  }
`);

/**
 * Get the top level collections with children for the navigation
 */
export async function getNavigationCollections(
  locale: string,
): Promise<NavigationCollection[]> {
  const fetchNavigationCollections = () =>
    vendureClient(locale).request(NavigationCollectionsQuery);
  const {
    collections: { items },
  } = await cache.get(locale, fetchNavigationCollections);
  return items;
}

const CollectionDetailQuery = graphql(
  `
    query GetCollectionDetail($slug: String!) {
      collection(slug: $slug) {
        id
        name
        slug
        description
        featuredAsset {
          preview
        }
        children {
          id
          name
          slug
          description
          featuredAsset {
            preview
          }
        }
        productVariants {
          items {
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
            product {
              id
              name
              slug
              featuredAsset {
                id
                preview
              }
            }
          }
        }
      }
    }
  `,
  [],
);

export type CollectionDetail = NonNullable<
  ResultOf<typeof CollectionDetailQuery>["collection"]
>;

export type CollectionDetailVariant =
  CollectionDetail["productVariants"]["items"][number];

/**
 * Get collection details by slug, including subcollections and product variants
 */
export async function getCollectionDetail(
  locale: string,
  slug: string,
): Promise<CollectionDetail | null> {
  const fetchCollectionDetail = () =>
    vendureClient(locale).request(CollectionDetailQuery, { slug });
  const { collection } = await cache.get(
    `collection-detail-${slug}`,
    fetchCollectionDetail,
  );
  return collection;
}

const SitemapCollectionsQuery = graphql(`
  query GetSitemapCollections($skip: Int!, $take: Int!) {
    collections(options: { skip: $skip, take: $take }) {
      items {
        slug
        updatedAt
      }
      totalItems
    }
  }
`);

export type SitemapCollectionEntry = ResultOf<
  typeof SitemapCollectionsQuery
>["collections"]["items"][number];

/**
 * Fetches all collection slugs and updatedAt for sitemap.
 */
export async function getSitemapCollections(
  locale: string,
): Promise<SitemapCollectionEntry[]> {
  const SITEMAP_BATCH_SIZE = 100;
  const out: SitemapCollectionEntry[] = [];
  let skip = 0;
  let hasMore = true;
  while (hasMore) {
    const {
      collections: { items, totalItems },
    } = await vendureClient(locale).request(SitemapCollectionsQuery, {
      skip,
      take: SITEMAP_BATCH_SIZE,
    });
    out.push(...items);
    skip += SITEMAP_BATCH_SIZE;
    hasMore = out.length === SITEMAP_BATCH_SIZE && skip < totalItems;
  }
  return out;
}
