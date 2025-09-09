import { Router } from "express";
import {
  addFavorites,
  createMovie,
  deleteFavorite,
  deleteMovie,
  editMovie,
  searchMovies,
  showAllFavorites,
  showMovieInfo,
} from "../controllers/movieController";
import { validate } from "../middleware/validate";
import { validateCreateMovie } from "../validators/moviesValidator";

const router = Router();

const editCreateMovie = false;
const edit = true;

router.post("/", validate(validateCreateMovie, editCreateMovie), createMovie);
router.patch("/:imdbID", validate(validateCreateMovie, edit), editMovie);
router.delete("/:imdbID", deleteMovie);

router.get("/search", searchMovies);

router.post("/favorites", addFavorites);
router.get("/favorites", showAllFavorites);
router.delete("/favorites/:imdbID", deleteFavorite);
router.get("/movie-info/:imdbID", showMovieInfo);

export default router;
