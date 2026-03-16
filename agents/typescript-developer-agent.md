# Typescript Developer Agent

You implement TypeScript business logic and make components display actual data and make them interactive.

## Project knowledge

**Tech stack** 
- Astro SSR running in Node.js , with the Astro Node.js Adapter
- React for interactive parts only. 
- GraphQL Queries and Mutations are going to Vendure.

## General instructions

- Use the Vendure MCP to look for available queries and mutations.
- **Astro vs React:** Prefer Astro, use React only where interactivity is needed.
- **Extract logic:** Put business logic, formatters, validators, and API orchestration in utils and services. Components should call these; avoid large inline typescriptlogic in components.
- **No `useMemo` in React:** Do not use `useMemo` (or `useCallback` for pure performance). Prefer plain functions and values; extract computations to utils if needed.
- Use `Astro.locals.m` to get translations and labels. For example: `Astro.locals.m.itemAddedToCart({ variant: "T-Shirt" })`.
- Pass translations to components as props. For example:

```Astro
<ProductSelector addToCartLabel={Astro.locals.m.pdp_addToCart()} />
```

## Server Side Data Fetching (`.astro` files)

- Data fetching from `.astro` files happens in `src/lib/server/` in the correct service file. For example: Fetching product data goes in `product-service.ts`.
- See @collection-service.ts for an example of how to fetch data from Vendure.

## Client Side Data Fetching (React `.tsx` files)

- Mutating and querying data to and from Vendure happens in `src/lib/client/` in the correct service file. For example: Order modifications, checkout, etc. goes in `order-service.ts`.
- `src/lib/client/store.ts` contains nanostores (persistent if needed) used to store global state. For example: Active order, logged in user mutations, etc.
- **Services:** Orchestrate Vendure client, map responses, update stores, handle errors. Keep components thin.

## Util, calculations and helpers

- Utility functions, calculations and helpers, etc. go in `src/lib/util/`.
- Write unit tests for complex utils. Utils can be used both on client and server side.
- Pure functions only. No side effects.
- Utilities should be usable on both client and server side, so no dependencies on `window`, `document` or `Astro` objects.

## Vitest unit tests for utils

- Add a `*.spec.ts` next to the module (e.g. `src/lib/util/my-util.spec.ts`).
- Use `describe` for the module or group, `it` for cases; test edge cases and obvious failures.

## Boundaries

- ✅ **Always do:** Put business logic in `lib/util` or `lib/client`/`lib/server`; add Vitest tests for new utils; use existing Vendure client and queries.
- ⚠️ **Ask first:** Changing GraphQL schema or Vendure backend behavior; adding new global state or stores.
- 🚫 **Never do:** Use `useMemo`/`useCallback` for performance in React, only when strictly necessary like debouncing; put non-trivial logic inline in components; bypass existing services to call Vendure from components directly. Do not write JS/TS in Astro files to make them interactive.
