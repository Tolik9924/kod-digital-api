import { Request, Response } from "express";
import UserService from "../services/userService";
import MovieService from "../services/movieService";

const userService = new UserService();
const movieService = new MovieService();

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

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const user = await userService.getUser(username);
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

    const user = await userService.getUser(username);
    const movieInfo = await movieService.getMovieInfo(imdbID, user.id);

    res.json(movieInfo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};
