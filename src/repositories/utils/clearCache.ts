import pool from "../../db";
import { favoritesCache, researchCache } from "../cache";

export const clearCacheSearch = async (userId: number) => {
  const userKey = await pool.query(`SELECT * FROM cache_keys_search WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM cache_keys_search WHERE user_id = $1`, [userId]);
  if (userKey.rows.length > 0) {
    userKey.rows.forEach((row: { cache_key: string }) => {
      researchCache.set(row.cache_key, undefined);
    });
  }
};

export const clearCacheFavorites = async (userId: number) => {
  const userKey = await pool.query(`SELECT * FROM cache_keys_favorites WHERE user_id = $1`, [
    userId,
  ]);
  await pool.query(`DELETE FROM cache_keys_favorites WHERE user_id = $1`, [userId]);
  if (userKey.rows.length > 0) {
    userKey.rows.forEach((row: { cache_key: string }) => {
      favoritesCache.set(row.cache_key, undefined);
    });
  }
};
