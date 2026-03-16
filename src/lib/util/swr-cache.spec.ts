import { it, expect } from "vitest";
import { SwrCache } from "./swr-cache";

const CACHE_KEY = "test-key";

/**
 * Dummy fetch function that increases a counter so we can keep track of which result is returned: stale or fresh
 */
function createFetcher(): {
  fetcher: () => Promise<number>;
  callCount: () => number;
} {
  let n = 0;
  return {
    fetcher: () => Promise.resolve(++n),
    callCount: () => n,
  };
}

it("when cache is empty, awaits fetch and returns value", async () => {
  const cache = new SwrCache(0);
  const { fetcher, callCount } = createFetcher();

  expect(await cache.get(CACHE_KEY, fetcher)).toBe(1);
  expect(callCount()).toBe(1);
});

it("returns stale value immediately and refreshes in background when entry is stale", async () => {
  const cache = new SwrCache(0.1);
  const { fetcher, callCount } = createFetcher();

  // Fetch and cache
  expect(await cache.get(CACHE_KEY, fetcher), "first fetch").toBe(1);
  expect(callCount()).toBe(1);

  // Wait for entry to become stale
  await new Promise((r) => setTimeout(r, 150));

  // Fetching again returns stale value (1) immediately and triggers background refresh
  expect(await cache.get(CACHE_KEY, fetcher), "second fetch").toBe(1);
  expect(callCount()).toBe(2);

  await new Promise((r) => setTimeout(r, 2)); // let revalidation complete

  // Fresh value after revalidation
  expect(await cache.get(CACHE_KEY, fetcher), "third fetch").toBe(2);
  expect(callCount()).toBe(2); // No new refetch call because data is still fresh
});

it("expireAllEntries marks all entries stale but returns stale value before refreshing", async () => {
  const cache = new SwrCache(1_000);
  const { fetcher, callCount } = createFetcher();

  // Prime cache with a long TTL
  expect(await cache.get(CACHE_KEY, fetcher), "initial fetch").toBe(1);
  expect(callCount()).toBe(1);

  // Expire all entries
  cache.expireAllEntries();

  // Next get should return stale value and trigger background revalidation
  expect(await cache.get(CACHE_KEY, fetcher), "after expireAllEntries").toBe(1);
  expect(callCount()).toBe(2);

  await new Promise((r) => setTimeout(r, 2)); // let revalidation complete

  // Subsequent get should now return the refreshed value without additional fetch
  expect(await cache.get(CACHE_KEY, fetcher), "after revalidation").toBe(2);
  expect(callCount()).toBe(2);
});

it("deduplicates concurrent fetches for the same key", async () => {
  const cache = new SwrCache(1_000);
  const { fetcher, callCount } = createFetcher();

  const [result1, result2, result3] = await Promise.all([
    cache.get(CACHE_KEY, fetcher),
    cache.get(CACHE_KEY, fetcher),
    cache.get(CACHE_KEY, fetcher),
  ]);

  expect(result1).toBe(1);
  expect(result2).toBe(1);
  expect(result3).toBe(1);
  expect(callCount()).toBe(1);
});
