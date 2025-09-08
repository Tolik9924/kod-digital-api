import axios from "axios";
import { Request, Response } from "express";
import pool from "../db";
import { Search } from "../types/movies";

export const createMovie = async (req: Request, res: Response) => {
  try {
    const { imdbID, Title, Year, Runtime, Genre, Director } = req.body;

    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        t: Title
      }
    });

    const result = await pool.query(
      `INSERT INTO movies (title, year, runtime, genre, director, imdb_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (imdb_id) DO NOTHING
       RETURNING *`,
      [Title, Year, Runtime, Genre, Director, imdbID]
    );

    if (result.rows.length === 0 || response.data.Response === 'True') {
      return res.status(409).json({ error: "Movie already exists." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

export const editMovie = async (req: Request, res: Response) => {
  try {
    const { imdbID } = req.params;
    const { Title, Year, Runtime, Genre, Director } = req.body;

    const result = await pool.query(
      `INSERT INTO movies (imdb_id, title, year, runtime, genre, director)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (imdb_id) DO UPDATE
       SET title = COALESCE($2, movies.title),
           year = COALESCE($3, movies.year),
           runtime = COALESCE($4, movies.runtime),
           genre = COALESCE($5, movies.genre),
           director = COALESCE($6, movies.director)
       RETURNING *`,
      [imdbID, Title, Year, Runtime, Genre, Director]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const { imdbID } = req.params;
    const result = await pool.query(
      `INSERT INTO deleted_movies (imdb_id)
       VALUES ($1)
       ON CONFLICT (imdb_id) DO NOTHING
       RETURNING *`,
       [imdbID]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const searchMovies = async (req: Request, res: Response) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const deleted = await pool.query("SELECT imdb_id FROM deleted_movies");
    const deletedIds = deleted.rows.map(r => r.imdb_id);

    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        s: title
      }
    });

    const filteredResults = response.data.Search.filter(
      (movie: Search) => !deletedIds.includes(movie.imdbID)
    );

    res.json(filteredResults);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const addFavorites = async (req: Request, res: Response) => {
  try {
    const { imdbID, Title, Year, Poster } = req.body;

    const result = await pool.query(
      `INSERT INTO favorites (imdb_id, title, year, poster)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (imdb_id) DO NOTHING
       RETURNING *`,
      [imdbID, Title, Year, Poster]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "Movie already exists in favorites" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

export const showAllFavorites = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM favorites ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

export const deleteFavorite = async (req: Request, res: Response) => {
  try {
    const { imdbID } = req.params;

    const result = await pool.query(
      `DELETE FROM favorites
       WHERE imdb_id = $1
       RETURNING *`,
      [imdbID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.json({ message: "Movie deleted", movie: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const showMovieInfo = async (req: Request, res: Response) => {
  try {
     const { imdbID } = req.params;
     const { data: omdbData } = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: imdbID
      }
    });

    const { rows } = await pool.query(
      `SELECT * FROM movies WHERE imdb_id = $1`,
      [imdbID]
    );

    if (rows.length > 0) {
      const dbMovie = rows[0];
      const merged = {
        ...omdbData,
        Title: dbMovie.title ?? omdbData.Title,
        Year: dbMovie.year ?? omdbData.Year,
        Runtime: dbMovie.runtime ?? omdbData.Runtime,
        Genre: dbMovie.genre ?? omdbData.Genre,
        Director: dbMovie.director ?? omdbData.Director,
        imdbID: dbMovie.imdb_id ?? omdbData.imdbID
      };
      return res.json(merged);
    }

    res.json(omdbData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
}; 
