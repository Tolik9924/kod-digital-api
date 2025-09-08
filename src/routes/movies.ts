import { Router, Request, Response } from "express";
import { 
  addFavorites,
  createMovie, 
  deleteFavorite, 
  deleteMovie, 
  editMovie, 
  searchMovies, 
  showAllFavorites,
  showMovieInfo
} from "../controllers/movieController";

const router = Router();

router.post("/", createMovie);
router.patch("/:imdbID", editMovie);
router.delete("/:imdbID", deleteMovie);

router.get("/search", searchMovies);

router.post("/favorites", addFavorites);
router.get("/favorites", showAllFavorites);
router.delete("/favorites/:imdbID", deleteFavorite);
router.get("/movie-info/:imdbID", showMovieInfo);


export default router;