import pool from "../db";

class Cache<T> {
  private store = new Map<string, { value: T; expires: number }>();

  constructor(private ttlMs: number) {}

  async get(key: string, typeKey?: string): Promise<T | undefined> {
    console.log("GET STORE MAP: ", this.store);
    const data = this.store.get(key);
    if (!data) {
      if (typeKey) {
        await pool.query(`DELETE FROM ${typeKey} WHERE "cache_key" = $1`, [key]);
      }
      return undefined;
    }
    if (Date.now() > data.expires) {
      this.store.delete(key);
      if (typeKey) {
        await pool.query(`DELETE FROM ${typeKey} WHERE "cache_key" = $1`, [key]);
      }
      return undefined;
    }
    return data.value;
  }

  set(key: string, value: T) {
    console.log("SET STORE MAP: ", this.store);
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}

export const researchCache = new Cache<any>(60_000);
export const favoritesCache = new Cache<any>(60_000);
export const movieInfoCache = new Cache<any>(5 * 60_000);
