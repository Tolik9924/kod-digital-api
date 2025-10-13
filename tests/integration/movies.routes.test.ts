import request from "supertest";
import app from "../../src/server";

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
});
