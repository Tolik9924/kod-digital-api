import axios from "axios";
import pool from "../db";
import { CACHE_KEYS_FAVORITE, CACHE_KEYS_SEARCH } from "./constants";
import { favoritesCache, movieInfoCache, researchCache } from "./cache";
import { AddingMovie, Movie, Search } from "../models/movie";
import { clearCacheSearch, clearCacheFavorite } from "./utils/clearCache";
class MovieRepository {
  async getMovies(title: string, userId?: number) {
    if (!userId) {
      const response = await axios.get("http://www.omdbapi.com/", {
        params: {
          apikey: process.env.OMDB_API_KEY,
          s: title,
        },
      });

      return response.data.Search;
    }

    const key = `search:user:${userId}:${title}`;

    const cached = await researchCache.get(key, CACHE_KEYS_SEARCH);
    if (cached) return cached;

    const expiresAt = new Date(Date.now() + 60_000);
    await pool.query(
      `INSERT INTO cache_keys_search ("cache_key", "user_id", "expires_at")
       VALUES ($1, $2, $3)
       ON CONFLICT ("cache_key", "user_id") DO NOTHING
       RETURNING *`,
      [key, userId, expiresAt]
    );

    const deleted = await pool.query(
      `SELECT "imdbID", "user_id" FROM deleted_movies WHERE "user_id" = $1`,
      [userId]
    );
    const movies = await pool.query(`SELECT * FROM movies WHERE "Title" ~* $1 AND user_id = $2`, [
      `\\y${title}\\y`,
      userId,
    ]);

    const deletedIds = deleted.rows.map((r) => r.imdbID);

    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        s: title,
      },
    });

    const filteredResults =
      response.data.Response === "True"
        ? response.data.Search.filter(
            (movie: Search) =>
              !deletedIds.includes(movie.imdbID) &&
              !movies.rows.some((item: Search) => item.imdbID === movie.imdbID)
          )
        : [];

    const result = filteredResults.map((item: AddingMovie) => {
      const localMovie = movies.rows.find((m) => m.imdbID === item.imdbID);
      return localMovie
        ? { ...item, isFavorite: localMovie.isFavorite }
        : { ...item, isFavorite: false };
    });

    researchCache.set(key, [...movies.rows, ...result]);

    return [...movies.rows, ...result];
  }

  async getFavorites(title: string, userId: number) {
    const key = `favorites:user:${userId}:${title}`;
    const cached = await favoritesCache.get(key, CACHE_KEYS_FAVORITE);
    if (cached) return cached;

    const expiresAt = new Date(Date.now() + 60_000);
    await pool.query(
      `INSERT INTO cache_keys_favorites ("cache_key", "user_id", "expires_at")
       VALUES ($1, $2, $3)
       ON CONFLICT ("cache_key", "user_id") DO NOTHING
       RETURNING *`,
      [key, userId, expiresAt]
    );

    const result = await pool.query(
      `SELECT * FROM movies WHERE "Title" ~* $1 AND "isFavorite" = TRUE AND "user_id" = $2`,
      [`\\y${title}\\y`, userId]
    );

    favoritesCache.set(key, result.rows);

    return result.rows;
  }

  async getMovieInfo(imdbID: string, userId?: number) {
    const { data: omdbData } = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: imdbID,
      },
    });

    if (!userId) {
      return omdbData;
    }

    const key = `movieInfo:user:${userId}:imdbID:${imdbID}`;

    const cached = await movieInfoCache.get(key);
    if (cached) return cached;

    const { rows } = await pool.query(`SELECT * FROM movies WHERE "imdbID" = $1 AND user_id = $2`, [
      imdbID,
      userId,
    ]);

    if (rows.length > 0) {
      const dbMovie = rows[0];
      const addData =
        typeof omdbData === "string" ? { Response: "False" } : { Response: omdbData.Response };
      const merged = {
        ...addData,
        ...omdbData,
        Title: dbMovie.Title ?? omdbData.Title,
        Year: dbMovie.Year ?? omdbData.Year,
        Runtime: dbMovie.Runtime ?? omdbData.Runtime,
        Genre: dbMovie.Genre ?? omdbData.Genre,
        Director: dbMovie.Director ?? omdbData.Director,
        imdbID: dbMovie.imdbID ?? omdbData.imdbID,
      };
      movieInfoCache.set(key, merged);
      return merged;
    }

    movieInfoCache.set(key, omdbData);

    return omdbData;
  }

  async create(userId: number, movie: Movie): Promise<Movie[]> {
    const { Title, Year, Runtime, Genre, Director, imdbID, isFavorite } = movie;

    await clearCacheSearch(userId);

    const result = await pool.query(
      `INSERT INTO movies ("Title", "Year", "Runtime", "Genre", "Director", "imdbID", "isFavorite", "user_id")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("imdbID", "user_id") DO NOTHING
       RETURNING *`,
      [Title, Year, Runtime, Genre, Director, imdbID, isFavorite, userId]
    );
    return result.rows;
  }

  async update(userId: number, imdbID: string, movie: Movie) {
    const { Title, Year, Runtime, Genre, Director, Poster, Type, isFavorite } = movie;
    const key = `movieInfo:user:${userId}:imdbID:${imdbID}`;

    movieInfoCache.delete(key);

    if (userId) await clearCacheSearch(userId);

    const userMovie = await pool.query(
      `SELECT * FROM movies WHERE "imdbID" = $1 AND user_id = $2`,
      [movie.imdbID, userId]
    );

    if (userMovie.rows[0] && isFavorite !== userMovie.rows[0]?.isFavorite) {
      clearCacheFavorite(userId);
    }

    const result = await pool.query(
      `INSERT INTO movies ("imdbID", "Title", "Year", "Runtime", "Genre", "Director", "isFavorite", "Poster", "Type", "user_id")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT ("imdbID", "user_id") DO UPDATE
       SET "Title" = COALESCE($2, movies."Title"),
           "Year" = COALESCE($3, movies."Year"),
           "Runtime" = COALESCE($4, movies."Runtime"),
           "Genre" = COALESCE($5, movies."Genre"),
           "Director" = COALESCE($6, movies."Director"),
           "isFavorite" = COALESCE($7, movies."isFavorite"),
           "Poster" = COALESCE($8, movies."Poster"),
           "Type" = COALESCE($9, movies."Type")
       RETURNING *`,
      [imdbID, Title, Year, Runtime, Genre, Director, isFavorite, Poster, Type, userId]
    );

    return result.rows;
  }

  async delete(userId: number, imdbID: string) {
    await clearCacheSearch(userId);

    await pool.query(`DELETE FROM movies WHERE "imdbID" = $1 AND "user_id" = $2 `, [
      imdbID,
      userId,
    ]);

    const { data: omdbData } = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: imdbID,
      },
    });

    if (omdbData.Response === "True") {
      await pool.query(
        `INSERT INTO deleted_movies ("imdbID", "user_id")
       VALUES ($1, $2)
       ON CONFLICT ("imdbID", "user_id") DO NOTHING
       RETURNING *`,
        [imdbID, userId]
      );
    }

    return "Deleted";
  }
}

export default MovieRepository;
