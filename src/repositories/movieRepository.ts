import pool from "../db";

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
    async getAll(): Promise<User[]> {
        const result = await pool.query("SELECT * FROM users ORDER BY id");
        return result.rows;
  }
}

export default MovieRepository;
