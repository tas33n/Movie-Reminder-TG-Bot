const axios = require('axios');
const config = require('../config.json');

function checkHasYear(title) {
  // Regex to match title with year
  const regexWithYear = /(.*?)\s(\d{4})/;
  const match = title.match(regexWithYear);

  if (match) {
    const year = match[2];
    const currentYear = new Date().getFullYear();
    if (year >= 1200 && year <= currentYear) {
      return { title: match[1].trim(), year: year };
    }
  }

  // If no year is found
  return { title, year: null };
}
const apiKeys = config.omdbApiKey;
function getApiKey() {
  const key = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  return key;
};

module.exports = {
  searchMovie: async (query) => {
    let id = null;
    try {
      const hasYear = checkHasYear(query);
      let url = `https://www.omdbapi.com/?apikey=${getApiKey()}&s=${encodeURIComponent(hasYear.title)}`;

      // If a year is provided
      if (hasYear.year) {
        url += `&y=${encodeURIComponent(hasYear.year)}`;
      }

      const response = await axios.get(url);

      if (response.data.Response === "True") {
        id = response.data.Search[0].imdbID;
        const res = await axios.get(`https://www.omdbapi.com/?apikey=${getApiKey()}&i=${id}`);
        if (res.data.Response === "True") {
          return res.data; // Corrected to return specific movie data
        }
      }
      return null;
    } catch (error) {
      console.error('OMDB API Error:', error); // Corrected API name in error message
      return null;
    }
  },
  getInfo: async (imdbID) => {
    try {
      const res = await axios.get(`https://www.omdbapi.com/?apikey=${getApiKey()}&i=${imdbID}`);
      if (res.data.Response === "True") {
        return res.data;
      }
      return null;
    } catch (error) {
      console.log("erorr getting info from omdb");
      return null;
    }
  }
};