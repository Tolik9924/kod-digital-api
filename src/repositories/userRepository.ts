import pool from "../db";

class UserRepository {
  async getUser(username: string) {
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
  }
}

export default UserRepository;
