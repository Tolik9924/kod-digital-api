import axios from "axios";
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

  async update(username: string, movie: Movie) {
    const user = await getUser(username);
    const { Title, Year, Runtime, Genre, Director, imdbID, Poster, Type, isFavorite } = movie;

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

    return result.rows;
  }

  async delete(username: string, imdbID: string) {
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
    }
  }
}

export default MovieRepository;
