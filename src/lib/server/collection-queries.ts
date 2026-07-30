import { graphql } from "../../graphql/graphql";

export const NavigationCollectionsQuery = graphql(`
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

export const CollectionDetailQuery = graphql(
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
