import { graphql } from "../../graphql/graphql";

export const ProductDetailFragment = graphql(`
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

export const PopularProductsQuery = graphql(
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

export const ProductBySlugQuery = graphql(
  `
    query GetProductBySlug($slug: String!) {
      product(slug: $slug) {
        ...ProductDetail
      }
    }
  `,
  [ProductDetailFragment],
);
