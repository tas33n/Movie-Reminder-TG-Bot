const mongoose = require("mongoose");
const axios = require("axios");
const config = require("./config.json");

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Reminder Schema
const reminderSchema = new mongoose.Schema({
  chatId: Number,
  movieName: String,
  month: Number,
  day: Number,
  imdb: String,
  lastNotifiedYear: Number,
  img: {
    data: Buffer,
    contentType: String,
  },
});

const Reminder = mongoose.model("Reminder", reminderSchema);

// Helper functions for OMDB API
const apiKeys = config.omdbApiKey;
function getApiKey() {
  return apiKeys[Math.floor(Math.random() * apiKeys.length)];
}

function checkHasYear(title) {
  const regexWithYear = /(.*?)\s(\d{4})/;
  const match = title.match(regexWithYear);

  if (match) {
    const year = match[2];
    const currentYear = new Date().getFullYear();
    if (year >= 1200 && year <= currentYear) {
      return { title: match[1].trim(), year: year };
    }
  }
  return { title, year: null };
}

const searchMovie = async (query) => {
  try {
    const hasYear = checkHasYear(query);
    let url = `https://www.omdbapi.com/?apikey=${getApiKey()}&s=${encodeURIComponent(hasYear.title)}`;
    if (hasYear.year) url += `&y=${encodeURIComponent(hasYear.year)}`;

    const response = await axios.get(url);
    if (response.data.Response === "True") {
      const movieId = response.data.Search[0].imdbID;
      const movieDetails = await axios.get(
        `https://www.omdbapi.com/?apikey=${getApiKey()}&i=${movieId}`
      );
      if (movieDetails.data.Response === "True") {
        return {
          imdbID: movieDetails.data.imdbID,
          poster: movieDetails.data.Poster,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("OMDB API Error:", error.message);
    return null;
  }
};

// Main function to update reminders
const updateReminders = async () => {
  try {
    await connectDB();

    const reminders = await Reminder.find({
      $or: [{ img: null }, { "img.data": { $exists: false } }],
    });
    console.log(`Found ${reminders.length} reminders without images.`);

    let updatedCount = 0;

    for (let i = 0; i < reminders.length; i++) {
      const reminder = reminders[i];
      console.log(`Processing ${i + 1}/${reminders.length}: ${reminder.movieName}`);

      const movieData = await searchMovie(reminder.movieName);
      if (movieData) {
        // Fetch poster image
        let imgBuffer = null;
        let imgContentType = null;
        if (movieData.poster && movieData.poster !== "N/A") {
          try {
            const response = await axios.get(movieData.poster, { responseType: "arraybuffer" });
            imgBuffer = Buffer.from(response.data, "binary");
            imgContentType = response.headers["content-type"];
          } catch (error) {
            console.log("Error fetching poster image:", error.message);
          }
        }

        if (imgBuffer && imgContentType) {
          reminder.img = { data: imgBuffer, contentType: imgContentType };
        }
        reminder.imdb = movieData.imdbID;

        await reminder.save();
        updatedCount++;
        console.log("-")
        console.log(`Updated reminder for "${reminder.movieName}".`);
      } else {
        console.log(`No IMDb data found for "${reminder.movieName}".`);
      }

      console.log(`Remaining: ${reminders.length - i - 1}`);
    }

    console.log(`Update complete. Total updated: ${updatedCount}. Remaining: ${reminders.length - updatedCount}.`);
    mongoose.connection.close();
  } catch (error) {
    console.error("Error updating reminders:", error);
    mongoose.connection.close();
  }
};

// Run the script
updateReminders();
