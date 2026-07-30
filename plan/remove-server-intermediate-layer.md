## Plan
- **Goal:** Remove the async service wrapper layer in `src/lib/server/`, keep only GraphQL query/fragment definitions there, move derived types to `src/lib/types.ts`, and call `vendureClient` directly from Astro components/pages and the sitemap endpoint.
- **Files to change:**
  - `src/lib/server/collection-service.ts` → `src/lib/server/collection-queries.ts`: remove `vendureClient` import, wrapper functions, and `SitemapCollectionsQuery`; keep only `NavigationCollectionsQuery` and `CollectionDetailQuery`.
  - `src/lib/server/product-service.ts` → `src/lib/server/product-queries.ts`: remove `vendureClient` import, wrapper functions, and `SitemapProductsQuery`; keep only `ProductDetailFragment`, `PopularProductsQuery`, and `ProductBySlugQuery`.
  - `src/lib/server/global-settings-service.ts` → `src/lib/server/global-settings-queries.ts`: remove `vendureClient` import and `getAvailableCountries`; keep only `AvailableCountriesQuery`.
  - `src/lib/types.ts` (new): add comment “Preferably, types are always derived from the generated GraphQL types.” and export `NavigationCollection`, `CollectionDetail`, `CollectionDetailVariant`, `ProductDetail`, `AvailableCountry` derived from the renamed query/fragment files.
  - `src/lib/util/product-util.ts`: update type imports from `../server/...` to `../types`.
  - `src/components/ProductImageGallery.tsx`: import `ProductDetail` from `../lib/types`.
  - `src/components/ProductSelector.tsx`: import `ProductDetail` from `../lib/types`.
  - `src/components/CheckoutForm.tsx`: import `AvailableCountry` from `../lib/types`.
  - `src/components/Navigation.astro`: import `vendureClient` and `NavigationCollectionsQuery`; call `vendureClient(locale).request(...)` directly.
  - `src/components/Footer.astro`: same as Navigation.
  - `src/pages/[locale]/index.astro`: import `vendureClient`, `NavigationCollectionsQuery`, `PopularProductsQuery`; call directly.
  - `src/pages/[locale]/p/[product].astro`: import `vendureClient`, `ProductBySlugQuery`; call directly.
  - `src/pages/[locale]/c/[collection].astro`: import `vendureClient`, `CollectionDetailQuery`; call directly.
  - `src/pages/[locale]/checkout.astro`: import `vendureClient`, `AvailableCountriesQuery`; call directly.
  - `src/pages/sitemap.xml.ts`: remove `getSitemapProducts`/`getSitemapCollections` imports; import `vendureClient`; inline `SitemapProductsQuery` and `SitemapCollectionsQuery`; implement per-locale batch loops in `buildSitemapXml`.
- **Steps:**
  1. Create `src/lib/types.ts` with GraphQL-derived type aliases and the required comment.
  2. Rename `src/lib/server/collection-service.ts` → `collection-queries.ts`, stripping wrapper functions and the sitemap query; ensure only query/fragment definitions are exported.
  3. Rename `src/lib/server/product-service.ts` → `product-queries.ts`, stripping wrapper functions and the sitemap query; remove the stray `products.items[0].slug` line.
  4. Rename `src/lib/server/global-settings-service.ts` → `global-settings-queries.ts`, stripping wrapper function.
  5. Update `src/lib/util/product-util.ts` to import `CollectionDetailVariant` and `ProductDetail` from `src/lib/types`.
  6. Update React components (`ProductImageGallery`, `ProductSelector`, `CheckoutForm`) to import their types from `src/lib/types`.
  7. Update each Astro page and Astro component to import `vendureClient` and the appropriate query, replacing the removed service call with `await vendureClient(locale).request(query, variables)`.
  8. Rewrite `src/pages/sitemap.xml.ts`: inline the two sitemap queries and move the batched fetch loops into the endpoint.
  9. Delete the old `src/lib/server/*-service.ts` files (or use `git mv` to preserve history).
  10. Run `npm run type-check` and fix any type/import errors.
- **Risks / open questions:**
  - All error handling remains “propagate as-is”; if a Vendure request fails, pages/components will throw. This matches the current behavior.
  - `CollectionDetailQuery` and `ProductBySlugQuery` can return `null`; existing page-level `if (!...) return Astro.redirect('/404')` checks remain unchanged.
  - Need to ensure the `graphql` import in `collection-queries.ts` is switched to the project’s typed `graphql` from `../../graphql/graphql` for consistency (the current file imports from `gql.tada` directly).
  - No changes to React component logic; they only receive props and type imports are updated.
