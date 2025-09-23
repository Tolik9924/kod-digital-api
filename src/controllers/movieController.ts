import axios from "axios";
import { Request, Response } from "express";
import pool from "../db";
import { AddingMovie, Search } from "../types/movies";

const getUser = async (username: string) => {
  const userResult = await pool.query("SELECT * FROM Users WHERE username = $1", [username]);
  let user;

  if (!userResult.rows.length) {
    const newUser = await pool.query("INSERT INTO users(username) VALUES($1) RETURNING *", [
      username,
    ]);

    user = newUser.rows[0];
  } else {
    user = userResult.rows[0];
  }

  return user;
};

export const createMovie = async (req: Request, res: Response) => {
  try {
    const {
      username,
      movie: { imdbID, Title, Year, Runtime, Genre, Director, isFavorite },
    } = req.body;

    const user = await getUser(username);

    const result = await pool.query(
      `INSERT INTO movies ("Title", "Year", "Runtime", "Genre", "Director", "imdbID", "isFavorite", "user_id")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("imdbID", "user_id") DO NOTHING
       RETURNING *`,
      [Title, Year, Runtime, Genre, Director, imdbID, isFavorite, user.id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "Movie already exists." });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

export const editMovie = async (req: Request, res: Response) => {
  try {
    const { imdbID } = req.params;
    const {
      username,
      movie: { Title, Year, Runtime, Genre, Director, isFavorite, Poster, Type },
    } = req.body;

    const user = await getUser(username);

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
      [imdbID, Title, Year, Runtime, Genre, Director, isFavorite, Poster, Type, user.id]
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
    const { username } = req.query;

    const user = await getUser(username as string);

    await pool.query(`DELETE FROM movies WHERE "imdbID" = $1 AND "user_id" = $2 `, [
      imdbID,
      user.id,
    ]);

    const { data: omdbData } = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: imdbID,
      },
    });

    if (omdbData.Response === "True") {
      const result = await pool.query(
        `INSERT INTO deleted_movies ("imdbID", "user_id")
       VALUES ($1, $2)
       ON CONFLICT ("imdbID", "user_id") DO NOTHING
       RETURNING *`,
        [imdbID, user.id]
      );

      return res.json(result.rows[0]);
    }

    return res.json(`Delete data from from table movie: ${imdbID}, user ${username}`);
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

    const deleted = await pool.query(`SELECT "imdbID" FROM deleted_movies`);
    const movies = await pool.query(`SELECT * FROM movies WHERE "Title" ILIKE $1`, [`%${title}%`]);

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

    res.json([...movies.rows, ...result]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const showAllFavorites = async (req: Request, res: Response) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    const result = await pool.query(
      `SELECT * FROM movies WHERE "Title" ILIKE $1 AND "isFavorite" = TRUE`,
      [`%${title}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

export const showMovieInfo = async (req: Request, res: Response) => {
  try {
    const { imdbID } = req.params;
    const { data: omdbData } = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: imdbID,
      },
    });

    const { rows } = await pool.query(`SELECT * FROM movies WHERE "imdbID" = $1`, [imdbID]);

    if (rows.length > 0) {
      const dbMovie = rows[0];
      const addData = typeof omdbData === "string" ? { Response: "False" } : omdbData;
      const merged = {
        ...addData,
        Title: dbMovie.Title ?? omdbData.Title,
        Year: dbMovie.Year ?? omdbData.Year,
        Runtime: dbMovie.Runtime ?? omdbData.Runtime,
        Genre: dbMovie.Genre ?? omdbData.Genre,
        Director: dbMovie.Director ?? omdbData.Director,
        imdbID: dbMovie.imdbID ?? omdbData.imdbID,
      };
      return res.json(merged);
    }

    res.json(omdbData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};
