import { AddingMovie } from "../types/movies";

export const validateCreateMovie = (data: AddingMovie) => {
  const errors: string[] = [];
  const { imdbID, Title, Year, Runtime, Genre, Director } = data;

  const regex = /^\d{4}(?:\s*[-–—]\s*\d{4})?$/;
  const minYear = 1880;

  if (!Title || typeof data.imdbID !== "string") {
    errors.push("Title is required and must be a string");
  }

  if (!regex.test(Year)) {
    errors.push("Year must be in the format 'YYYY' or 'YYYY' - 'YYYY'.");
  }

  if (Year.includes("-")) {
    const [start, end] = Year.split("-").map((s) => parseInt(s.trim(), 10));
    if (start < minYear) errors.push("First movie was released in 1880");
    if (start > end) errors.push("Start year must be before end year");
  }
};
