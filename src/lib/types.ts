// Preferably, types are always derived from the generated GraphQL types.
import type { ResultOf } from "gql.tada";
import {
  NavigationCollectionsQuery,
  CollectionDetailQuery,
} from "./server/collection-queries";
import { ProductDetailFragment } from "./server/product-queries";
import { AvailableCountriesQuery } from "./server/global-settings-queries";

export type NavigationCollection = NonNullable<
  ResultOf<typeof NavigationCollectionsQuery>
>["collections"]["items"][number];

export type CollectionDetail = NonNullable<
  ResultOf<typeof CollectionDetailQuery>["collection"]
>;

export type CollectionDetailVariant =
  CollectionDetail["productVariants"]["items"][number];

export type ProductDetail = NonNullable<ResultOf<typeof ProductDetailFragment>>;

export type AvailableCountry =
  ResultOf<typeof AvailableCountriesQuery>["availableCountries"][number];
