import express from "express";
import cors from "cors";
import moviesRouter from "./routes/movies.routes";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("🎬 Movie API server is running with TypeScript!");
});

app.use("/api/movies", moviesRouter);

export default app;
