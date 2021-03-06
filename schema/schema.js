import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLFloat
} from 'graphql';

import axios from 'axios';

// Import the Api Key
import { api_key } from '../config';

// Get the newest Films
const NewPlayingType = new GraphQLObjectType({
  name: 'NowPlaying',
  fields: {
    id: { type: GraphQLInt },
    poster_path: { type: GraphQLString },
    title: { type: GraphQLString },
    vote_average: { type: GraphQLFloat }
  }
});

//Actors
const MovieCreditsType = new GraphQLObjectType({
  name: 'MovieCredits',
  fields: {
    id: { type: GraphQLString },
    character: { type: GraphQLString },
    name: { type: GraphQLString },
    profile_path: { type: GraphQLString },
    order: { type: GraphQLString }
  }
});

// Videos
const VideoType = new GraphQLObjectType({
  name: 'Video',
  fields: {
    id: { type: GraphQLString },
    key: { type: GraphQLString }
  }
});

// Get movie details
const MovieDetailsType = new GraphQLObjectType({
  name: 'MovieDetails',
  fields: {
    id: { type: GraphQLString },
    overview: { type: GraphQLString },
    title: { type: GraphQLString },
    poster_path: { type: GraphQLString },
    genres: { type: GraphQLString },
    release_date: { type: GraphQLString },
    vote_average: { type: GraphQLString },
    production_companies: { type: GraphQLString },
    vote_average: { type: GraphQLString },
    runtime: { type: GraphQLString },
    movieCredits: {
      type: new GraphQLList(MovieCreditsType),
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(
            `https://api.themoviedb.org/3/movie/${parentValue.id}/credits?api_key=${api_key}&language=en-US&page=1`
          )
          .then(res =>
            res.data.cast.filter(cast => {
              if (cast.profile_path && cast.order < 12) return cast;
            })
          );
      }
    },
    videos: {
      type: new GraphQLList(VideoType),
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(
            `https://api.themoviedb.org/3/movie/${parentValue.id}/videos?api_key=${api_key}&language=en-US`
          )
          .then(res => res.data.results);
      }
    }
  }
});

// Search Query
const SearchType = new GraphQLObjectType({
  name: 'Search',
  fields: {
    id: { type: GraphQLInt },
    poster_path: { type: GraphQLString },
    title: { type: GraphQLString },
    vote_average: { type: GraphQLFloat },
    release_date: { type: GraphQLString }
  }
});

// Root Query
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    moviesList: {
      type: new GraphQLList(NewPlayingType),
      args: {
        req: { type: GraphQLString },
        indexValue: { type: GraphQLInt }
      },
      resolve(parentValue, args) {
        return axios
          .get(
            `https://api.themoviedb.org/3/movie/${args.req}?api_key=${api_key}&language=en-US&page=${args.indexValue}`
          )
          .then(res => {
            const movies = res.data.results;
            movies.map(
              movie =>
                (movie.poster_path =
                  'https://image.tmdb.org/t/p/w500' + movie.poster_path)
            );
            return movies;
          });
      }
    },

    videos: {
      type: new GraphQLList(VideoType),
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(
            `https://api.themoviedb.org/3/movie/${args.id}/videos?api_key=${api_key}&language=en-US`
          )
          .then(res => res.data.results);
      }
    },

    movieDetails: {
      type: MovieDetailsType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(
            `https://api.themoviedb.org/3/movie/${args.id}?api_key=${api_key}&language=en-US&page=1`
          )
          .then(res => {
            if (res) {
              const movie = res.data;
              movie.genres = movie.genres.map(g => g.name).join(', ');
              movie.production_companies = movie.production_companies
                .map(g => g.name)
                .join(', ');
              return movie;
            }
            return [];
          });
      }
    },

    searchMovies: {
      type: new GraphQLList(SearchType),
      args: {
        search: { type: GraphQLString },
        indexValue: { type: GraphQLInt }
      },
      resolve(parentValue, args) {
        return axios
          .get(
            `https://api.themoviedb.org/3/search/movie?api_key=${api_key}&query=${args.search}&language=en-US&page=${args.indexValue}`
          )
          .then(res => {
            if (res.data.results) {
              const movies = res.data.results;
              movies.map(movie => {
                movie.poster_path =
                  'https://image.tmdb.org/t/p/w500' + movie.poster_path;
              });
              return movies;
            }
            return [];
          });
      }
    }
  }
});

export default new GraphQLSchema({
  query: RootQuery
});
