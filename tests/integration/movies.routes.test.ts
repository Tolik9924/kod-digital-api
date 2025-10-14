import request from "supertest";
import app from "../../src/server";
import {
  MOVIE_INFO,
  SEARCH_MOVIES_BATMAN_WITH_USERNAME,
  SEARCH_MOVIES_BATMAN_WITHOUT_USERNAME,
} from "../mockData/movies";

describe("Movies API", () => {
  test("POST /movies, create movies", async () => {
    const response = await request(app)
      .post("/api/movies")
      .send({
        username: "Tom",
        movie: {
          imdbID: "2234",
          Title: "Batman and Joker",
          Year: "1880-1990",
          Runtime: "100 min",
          Genre: "Adventure, Crime",
          Director: "Naruto-Akaakatsuki",
          isFavorite: false,
        },
      })
      .expect(201);

    expect(response.body).toEqual([
      {
        Title: "Batman and Joker",
        Year: "1880-1990",
        Runtime: "100 min",
        Genre: "Adventure, Crime",
        imdbID: "2234",
        Director: "Naruto-Akaakatsuki",
        isFavorite: false,
        Poster: null,
        Type: null,
        user_id: 68,
        id: 260,
      },
    ]);
  });

  test("PATCH /movies/:imdbID", async () => {
    const response = await request(app)
      .patch("/api/movies/tt0372784")
      .send({
        username: "Tolik",
        movie: {
          Title: "Batman",
          Year: "2023",
          isFavorite: false,
          Runtime: "200 min",
          Genre: "Action",
          Director: "George Lucas",
          Poster: "",
          Type: "movie",
        },
      })
      .expect(200);

    expect(response.body).toEqual([
      {
        Title: "Batman",
        Year: "2023",
        Runtime: "200 min",
        Genre: "Action",
        Director: "George Lucas",
        isFavorite: false,
        Poster: "",
        Type: "movie",
        user_id: 5,
        id: 89,
        imdbID: "tt0372784",
      },
    ]);
  });

  test("DELETE /movies/:imdbID", async () => {
    const response = await request(app)
      .delete("/api/movies/tt0372784")
      .query({ username: "Tolik" })
      .expect(200);

    expect(response.body).toEqual({ message: "Movie deleted successfully" });
  });

  test("GET without username /movies/", async () => {
    const response = await request(app)
      .get("/api/movies/search")
      .query({ title: "batman" })
      .expect(200);

    expect(response.body).toEqual(SEARCH_MOVIES_BATMAN_WITHOUT_USERNAME);
  });

  test("GET with username /movies/", async () => {
    const response = await request(app)
      .get("/api/movies/search")
      .query({ title: "batman", username: "Tolik" })
      .expect(200);

    expect(response.body).toEqual(SEARCH_MOVIES_BATMAN_WITH_USERNAME);
  });

  test("GET all favorites", async () => {
    const response = await request(app)
      .get("/api/movies/favorites")
      .query({ title: "batman", username: "Tolik" })
      .expect(200);

    expect(response.body).toEqual([
      {
        Title: "Batman",
        Year: "2023",
        Runtime: "200 min",
        Genre: "Action",
        Director: "George Lucas",
        isFavorite: true,
        Poster: "",
        Type: "movie",
        user_id: 69,
        id: 261,
        imdbID: "tt1877830",
      },
    ]);
  });

  test("GET movie info", async () => {
    const response = await request(app)
      .get("/api/movies/movie-info/tt0372784")
      .query({ username: "Tolik" })
      .expect(200);

    expect(response.body).toEqual(MOVIE_INFO);
  });
});
