class Cache<T> {
  private store = new Map<string, { value: T; expires: number }>();

  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const data = this.store.get(key);
    if (!data) return undefined;
    if (Date.now() > data.expires) {
      this.store.delete(key);
      return undefined;
    }
    return data.value;
  }

  set(key: string, value: T) {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}

export const researchCache = new Cache<any>(60_000);
export const favoritesCache = new Cache<any>(5 * 60_000);
