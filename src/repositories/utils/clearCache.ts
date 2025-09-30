import pool from "../../db";
import { researchCache } from "../cache";

export const clearCache = async (userId: number) => {
  const userKey = await pool.query(`SELECT * FROM cache_keys_search WHERE user_id = $1`, [userId]);
  researchCache.set(userKey.rows[0].cache_key, undefined);
};
