import { GENRE_NAMES } from "../constants/movies";
import { AddingMovie, GenreName } from "../types/movies";

export const validateCreateMovie = (data: AddingMovie, isEdit: boolean = false): string[] => {
  const errors: string[] = [];
  const { Title, Year, Runtime, Genre, Director } = data;
  const now = new Date();
  const maxYear = now.getFullYear();
  const minYear = 1880;
  const minRuntime = 1;
  const maxRuntime = 600;

  const isValidYear = (yearStr: string) => /^\d{4}(?:[-–—]\d{4})?$/.test(yearStr);
  const isValidRuntime = (runtimeStr: string) => /^\d+\s{1}min$/.test(runtimeStr);
  const isValidGenre = (genre: string) => /^[a-zA-Z]+(?:, [a-zA-Z]+)*$/.test(genre);
  const parseYearRange = (yearStr: string) =>
    yearStr.includes("-")
      ? yearStr.split("-").map((s) => parseInt(s.trim(), 10))
      : [parseInt(yearStr, 10)];
  const isValidDirector = (name: string) =>
    /^[A-Z][a-z]*(?:-[A-Z][a-z]*)*(?: [A-Z][a-z]*(?:-[A-Z][a-z]*)*)*$/.test(name);
  const parseRuntime = (runtime: string) => parseInt(runtime.split(" ")[0]);

  const requireField = (field: any, name: string) => {
    if (!isEdit && (field === undefined || field === "")) {
      errors.push(`${name} is required`);
    }
  };

  requireField(Title, "Title");
  requireField(Year, "Year");
  requireField(Runtime, "Runtime");
  requireField(Genre, "Genre");
  requireField(Director, "Director");

  if (Year && !isValidYear(Year)) {
    errors.push("Year must be in the format 'YYYY' or 'YYYY-YYYY'.");
  }

  if (Year) {
    const [start, end] = parseYearRange(Year);
    if (start < minYear || (end && end < minYear)) errors.push("First movie was released in 1880");
    if (start > maxYear || (end && end > maxYear))
      errors.push(`Year cannot be in the future (max ${maxYear})`);
    if (start > end) errors.push("Start year must be before end year");
  }

  if (Runtime && !isValidRuntime(Runtime)) {
    errors.push(
      "Runtime must be in the format 'N' | 'NN' | 'NNN' min. Between number and text must be one space."
    );
  }

  if (Runtime) {
    const runtimeNumber = parseRuntime(Runtime);
    if (runtimeNumber < minRuntime || runtimeNumber > maxRuntime) {
      errors.push("Runtime must be between 1 and 600 minutes.");
    }
  }

  if (Genre && !isValidGenre(Genre)) {
    errors.push("Genre must be a comma-separated list of words. After comma must be one space.");
  }

  if (Genre && isValidGenre(Genre)) {
    const genres = Genre.split(", ").map((g) => g.trim());
    const invalidGenres = genres.filter((g) => !GENRE_NAMES.includes(g as GenreName));
    if (invalidGenres.length)
      errors.push(
        `Genres not allowed: ${invalidGenres.join(", ")}. First letter must be uppercase.`
      );
  }

  if (Director && !isValidDirector(Director)) {
    errors.push(
      "Director name can only contain letters and spaces, each part starting with uppercase."
    );
  }

  return errors;
};
