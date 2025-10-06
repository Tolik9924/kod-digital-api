import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import moviesRouter from "./routes/movies.routes";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("🎬 Movie API server is running with TypeScript!");
});

app.use("/api/movies", moviesRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
