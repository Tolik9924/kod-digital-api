import { AddingMovie } from "../../src/models/movie";
import { validateCreateMovie } from "../../src/validators/moviesValidator";

describe("validateCreateMovie", () => {
  const baseMovie: AddingMovie = {
    imdbID: "ds1122334455",
    Title: "Inception",
    Year: "2010",
    Runtime: "148 min",
    Genre: "Action, Drama",
    Director: "Christopher Nolan",
  };

  test("should return no errors for valid movie data", () => {
    const errors = validateCreateMovie(baseMovie, false);
    expect(errors).toEqual([]);
  });

  test("should return error when Title is missing", () => {
    const movie = { ...baseMovie, Title: "" };
    const errors = validateCreateMovie(movie, false);
    expect(errors).toContain("Title is required");
  });

  test("should return error for invalid year format", () => {
    const movie = { ...baseMovie, Year: "20AB" };
    const errors = validateCreateMovie(movie, false);
    expect(errors).toContain("Year must be in the format 'YYYY' or 'YYYY-YYYY'.");
  });

  test("should return error for future year", () => {
    const nextYear = (new Date().getFullYear() + 1).toString();
    const movie = { ...baseMovie, Year: nextYear };
    const errors = validateCreateMovie(movie, false);
    expect(errors).toContain(`Year cannot be in the future (max ${new Date().getFullYear()})`);
  });

  test("should return error when start year is after end year", () => {
    const movie = { ...baseMovie, Year: "2020-2010" };
    const errors = validateCreateMovie(movie, false);
    expect(errors).toContain("Start year must be before end year");
  });

  test("should return error for invalid runtime format", () => {
    const movie = { ...baseMovie, Runtime: "148min" };
    const errors = validateCreateMovie(movie, false);
    expect(errors).toContain(
      "Runtime must be in the format 'N' | 'NN' | 'NNN' min. Between number and text must be one space."
    );
  });

  test("should return error for runtime out of range", () => {
    const movie = { ...baseMovie, Runtime: "0 min" };
    const errors = validateCreateMovie(movie, false);
    expect(errors).toContain("Runtime must be between 1 and 600 minutes.");
  });

  test("should return error for invalid genre format", () => {
    const movie = { ...baseMovie, Genre: "action, drama" };
    const errors = validateCreateMovie(movie, false);
    expect(errors).toContain(
      "Genre must be a comma-separated list of words. After comma must be one space."
    );
  });

  test("should return error for invalid genre value (not in GENRE_NAMES)", () => {
    const movie = { ...baseMovie, Genre: "Action, Magic" };
    const errors = validateCreateMovie(movie, false);
    expect(errors).toContain("Genres not allowed: Magic. First letter must be uppercase.");
  });

  test("should return error for invalid director format", () => {
    const movie = { ...baseMovie, Director: "christopher nolan" };
    const errors = validateCreateMovie(movie, false);
    expect(errors).toContain(
      "Director name can only contain letters and spaces, each part starting with uppercase."
    );
  });

  test("should ignore required field errors in edit mode", () => {
    const movie = { ...baseMovie, Title: "" };
    const errors = validateCreateMovie(movie, true);
    expect(errors).not.toContain("Title is required");
  });
});
