import { GENRE_NAMES } from "../constants/movies";

export type Search = {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
};

export type AddingMovie = {
  imdbID: string;
  Title: string;
  Year: string;
  Runtime: string;
  Genre: string;
  Director: string;
};

export type GenreName = (typeof GENRE_NAMES)[number];
