import { Router, Request, Response } from "express";
import axios from "axios";
import pool from "../db";

const router = Router();

// add movie
router.post("/", async (req: Request, res: Response) => {
  try {
    const { Title, Year, Runtime, Genre, Director } = req.body;

    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        t: Title
      }
    });

    const result = await pool.query(
      `INSERT INTO movies (title, year, runtime, genre, director)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (title) DO NOTHING
       RETURNING *`,
      [Title, Year, Runtime, Genre, Director]
    );

    console.log('RESPONSE: ', response.data);

    if (result.rows.length === 0 || response.data.Response === 'True') {
      return res.status(409).json({ error: "Movie already exists." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;

// 🔍 Search OMDB by title
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        s: title
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



// ⭐ Save favorite movie
router.post("/favorites", async (req: Request, res: Response) => {
  try {
    const { imdbID, Title, Year, Poster } = req.body;

    const result = await pool.query(
      `INSERT INTO favorites (imdb_id, title, year, poster)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (imdb_id) DO NOTHING
       RETURNING *`,
      [imdbID, Title, Year, Poster]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "Movie already exists in favorites" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// 📋 Get all favorites
router.get("/favorites", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM favorites ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});