# Project Agents

Tech stack: Astro SSR (Node adapter), React (for interactivity), DaisyUI + Tailwind, GraphQL to Vendure.

Run `npm run type-check` after changes.

## Project Structure

- `src/pages/` — Astro pages
- `src/components/` — Astro and React components
- `src/lib/server/` — Server-side data fetching (e.g. `product-service.ts`, `collection-service.ts`)
- `src/lib/client/` — Client-side queries/mutations and stores (`order-service.ts`, `store.ts`, `vendure-client.ts`)
- `src/lib/util/` — Pure, isomorphic helpers with `*.spec.ts` Vitest tests
- `src/styles/global.css` — DaisyUI theme

## UI Work (look & feel)

Follows [Thinking in React](https://react.dev/learn/thinking-in-react): start from the mockup, break into a component hierarchy, build a static version from a mocked data model, then add interactivity later.

- Mobile first, then desktop.
- Prefer **Astro** components; use **React** only when interactivity is required.
- Prefer pre-built **DaisyUI** components (Button, Card, Toggle, ...) over custom Tailwind. Check DaisyUI docs first.
- Use **Tailwind** only for layout/spacing/typography. Use DaisyUI utility classes for color (`bg-primary`, etc.) — never raw Tailwind colors.
- Break complex UIs into smaller reusable subcomponents (e.g. `ProductListingPage` → `ProductCard`, `ProductFilter`).
- Search the project for existing components before creating new ones.
- When modifying existing components for design only, do not touch JS/TS logic, handlers, or data flow.
- Mock data inline when prototyping a new component:

```tsx
const products = [{ id: 1, name: 'Product 1' }];
return <div>{products.map((p) => <div key={p.id}>{p.name}</div>)}</div>;
```

## TypeScript / Data Work

- Use the Vendure MCP to discover available queries and mutations.
- **Server data fetching** (`.astro`): in `src/lib/server/<entity>-service.ts`. See `src/lib/server/collection-service.ts` for the pattern.
- **Client mutations/queries** (`.tsx`): in `src/lib/client/<entity>-service.ts` (e.g. cart, checkout in `order-service.ts`).
- **Global state**: nanostores in `src/lib/client/store.ts` (persistent where needed). Ask before adding new stores.
- **Utilities**: pure functions in `src/lib/util/`, usable on client and server (no `window`, `document`, or `Astro`). Add a `*.spec.ts` next to non-trivial utils using Vitest (`describe`/`it`, cover edge cases).
- Keep components thin — services orchestrate the Vendure client, map responses, update stores, handle errors.
- **Translations**: use `Astro.locals.m.someKey()` in `.astro` files; pass strings to React components as props.

  ```astro
  <ProductSelector addToCartLabel={Astro.locals.m.pdp_addToCart()} />
  ```

## Boundaries

- Do **not** use `useMemo`/`useCallback` for performance — only when strictly necessary (e.g. debouncing).
- Do **not** put non-trivial logic inline in components; extract to `lib/util`, `lib/client`, or `lib/server`.
- Do **not** call Vendure directly from components; go through services.
- Do **not** add `<script>`/interactivity to Astro files unless explicitly asked.
- Do **not** use Tailwind color classes; use DaisyUI semantic colors.
- Ask before: modifying JS/TS logic during a UI-only change, writing custom CSS, or adding new global stores.
