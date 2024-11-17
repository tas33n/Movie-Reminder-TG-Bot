const axios = require('axios');
const config = require('./config.json');

const tmdbApi = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: config.tmdbApiKey
  }
});

module.exports = {
  searchMovie: async (query) => {
    try {
      const response = await tmdbApi.get('/search/movie', {
        params: { query }
      });

      if (response.data.results.length > 0) {
        return response.data.results[0];
      }
      return null;
    } catch (error) {
      console.error('TMDB API Error:', error);
      return null;
    }
  }
};