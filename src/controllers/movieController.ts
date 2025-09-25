import axios from "axios";
import { Request, Response } from "express";
import pool from "../db";
import UserService from "../services/userService";
import MovieService from "../services/movieService";

const userService = new UserService();
const movieService = new MovieService();

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
    const { username, movie } = req.body;
    const user = await userService.getUser(username);
    const createdMovie = await movieService.createMovie(user.id, movie);
    return res.json(createdMovie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

export const editMovie = async (req: Request, res: Response) => {
  try {
    const { imdbID } = req.params;
    const { username, movie } = req.body;
    const user = await userService.getUser(username);
    const updatedMovie = await movieService.editMovie(user.id, imdbID, movie);
    res.json(updatedMovie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const { imdbID } = req.params;
    const { username } = req.query;
    const user = await userService.getUser(username as string);
    const deleted = await movieService.deleteMovie(user.id, imdbID);
    return res.json(deleted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const searchMovies = async (req: Request, res: Response) => {
  try {
    const { title } = req.query;
    const { username } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const user = await userService.getUser(username);
    const result = await movieService.getMovies(title as string, user.id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const showAllFavorites = async (req: Request, res: Response) => {
  try {
    const { title } = req.query;
    const { username } = req.body;

    const user = await userService.getUser(username);

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    const favorites = await movieService.getFavorites(title as string, user.id);

    res.json(favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

export const showMovieInfo = async (req: Request, res: Response) => {
  try {
    const { imdbID } = req.params;
    const { username } = req.body;

    const user = await getUser(username);

    const { data: omdbData } = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: imdbID,
      },
    });

    const { rows } = await pool.query(`SELECT * FROM movies WHERE "imdbID" = $1 AND user_id = $2`, [
      imdbID,
      user.id,
    ]);

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
