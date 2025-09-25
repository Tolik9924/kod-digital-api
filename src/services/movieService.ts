import MovieRepository from "../repositories/movieRepository";

const movieRepo = new MovieRepository();

class MovieService {
  async getMovies(title: string, userId: number) {
    const movies = await movieRepo.getMovies(title, userId);
    return movies;
  }
}

export default MovieService;
