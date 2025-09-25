import { Movie } from "../models/movie";
import MovieRepository from "../repositories/movieRepository";

const movieRepo = new MovieRepository();

class MovieService {
  async getMovies(title: string, userId: number) {
    const movies = await movieRepo.getMovies(title, userId);
    return movies;
  }

  async getFavorites(title: string, userId: number) {
    const favorites = await movieRepo.getFavorites(title, userId);
    return favorites;
  }

  async getMovieInfo(imdbID: string, userId: number) {
    const movie = movieRepo.getMovieInfo(imdbID, userId);
    return movie;
  }

  async createMovie(userId: number, movie: Movie) {
    const createdMovie = await movieRepo.create(userId, movie);
    return createdMovie;
  }

  async editMovie(userId: number, movie: Movie) {
    const editdMovie = movieRepo.update(userId, movie);
    return editdMovie;
  }

  async deleteMovie(userId: number, imdbID: string) {
    const deletedMovie = await movieRepo.delete(userId, imdbID);
    return deletedMovie;
  }
}

export default MovieService;
