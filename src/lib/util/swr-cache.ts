/**
 * Stale while revalidate cache.
 * Returns data immediately (even if stale), revalidates in background with deduplication.
 *
 */
export interface Cache {
  /**
   * Get a value from the cache. Awaits the given `fetchFn` if no value is found in the cache.
   * If a value exists, always return it, even if it is stale.
   * If the value is stale, revalidate it in background with deduplication (so no concurrent fetches for the same key).
   *
   * @param cacheKey Unique identifier for the value to get.
   * @param fetchFn A function that fetches the value. Used for initial fetching and cache refreshing.
   * @param ttlSeconds The time to live in seconds before an entry is considered stale.
   */
  get<V>(
    cacheKey: string,
    fetchFn: () => Promise<V>,
    ttlSeconds?: number,
  ): Promise<V>;
  /**
   * Expire all entries in the cache.
   * This does not delete the entries from the cache, but marks them as expired. Next time they are fetched, they will be revalidated in the background, but the current stale entry will be served first.
   */
  expireAllEntries(): void | Promise<void>;
}

type Entry<T> = {
  value: T;
  expiresAt: number;
  ttlSeconds: number;
};

export class SwrCache implements Cache {
  constructor(private defaultTtlSeconds: number) {}
  private entries = new Map<string, Entry<unknown>>();
  private inFlight = new Map<string, Promise<void>>();

  /**
   * Set a value in the cache.
   */
  private set<V>(key: string, value: V, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.entries.set(key, { value, expiresAt, ttlSeconds });
  }

  /**
   * Returns cached value (possibly stale). If no entry exists, awaits fetch and returns the value.
   * If entry exists but is stale, return stale value immediately and revalidates in background (deduplicated).
   * `ttlSeconds` controls the lifetime of the cached value when it is (re)fetched.
   */
  async get<V>(
    key: string,
    fetchFn: () => Promise<V>,
    ttlSeconds = this.defaultTtlSeconds,
  ): Promise<V> {
    const entry = this.entries.get(key);
    const now = Date.now();
    const shouldRevalidate = !entry || entry.expiresAt < now;

    if (!entry) {
      // If no entry exists, await fetch and set the value in the cache and return it
      await this.revalidate(key, fetchFn, ttlSeconds);
      return this.entries.get(key)!.value as V;
    }

    // If entry exists but is stale, revalidate in background
    if (shouldRevalidate) {
      const effectiveTtlSeconds = ttlSeconds ?? entry.ttlSeconds;
      this.revalidate(key, fetchFn, effectiveTtlSeconds);
    }

    return entry.value as V;
  }

  expireAllEntries(): void {
    this.entries.forEach((entry) => {
      entry.expiresAt = 0;
    });
  }

  private revalidate<V>(
    key: string,
    fetcher: () => Promise<V>,
    ttlSeconds: number,
  ): Promise<void> {
    let p = this.inFlight.get(key);
    if (!p) {
      p = fetcher()
        .then((value) => {
          this.set(key, value, ttlSeconds);
        })
        .finally(() => {
          this.inFlight.delete(key);
        });
      this.inFlight.set(key, p);
    }
    return p;
  }
}

/**
 * A cache that does not cache anything. Useful for development or when you want to disable caching.
 */
export class NoOpCache implements Cache {
  get<V>(
    _cacheKey: string,
    fetchFn: () => Promise<V>,
    _ttlSeconds: number,
  ): Promise<V> {
    return fetchFn();
  }
  expireAllEntries(): void {
    return;
  }
}
