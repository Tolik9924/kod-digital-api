import pool from "../db";
import { Movie } from "../models/movie";

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

class MovieRepository {
  async create(username: string, movie: Movie): Promise<Movie[]> {
    const user = await getUser(username);
    const { Title, Year, Runtime, Genre, Director, imdbID, isFavorite } = movie;

    const result = await pool.query(
      `INSERT INTO movies ("Title", "Year", "Runtime", "Genre", "Director", "imdbID", "isFavorite", "user_id")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("imdbID", "user_id") DO NOTHING
       RETURNING *`,
      [Title, Year, Runtime, Genre, Director, imdbID, isFavorite, user.id]
    );

    return result.rows;
  }
}

export default MovieRepository;
