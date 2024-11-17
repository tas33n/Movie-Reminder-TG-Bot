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
  img: String,
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
    const movieDetails = await axios.get(
      `https://www.omdbapi.com/?apikey=${getApiKey()}&i=${query}`
    );
    if (movieDetails.data.Response === "True") {
      return {
        imdbID: query,
        poster: movieDetails.data.Poster,
      };
    }
    return null;


    // const hasYear = checkHasYear(query);
    // let url = `https://www.omdbapi.com/?apikey=${getApiKey()}&s=${encodeURIComponent(hasYear.title)}`;
    // if (hasYear.year) url += `&y=${encodeURIComponent(hasYear.year)}`;

    // const response = await axios.get(url);
    // if (response.data.Response === "True") {
    //   const movieId = response.data.Search[0].imdbID;

    // }

  } catch (error) {
    console.error("OMDB API Error:", error.message);
    return null;
  }
};

async function uploadToImgBB(imageUrl) {
  const apiKeys = [
    "9a57aa855b30afacebd1fd29c70feb97",
    "72c022c5e4d11fd8997614bd9cfda5b5",
    "ddde325c9ce02d545343212088c62c45",
    "9b07ad1ac3e1de4a23bbd2766efcf4d7",
    "a34b11c7f6532920d3f0a35070c06305"
  ];
const apiKey = [Math.floor(Math.random() * apiKeys.length)];

  try {
      // Upload the image directly using the URL
      const uploadResponse = await axios.post('https://api.imgbb.com/1/upload', null, {
          params: {
              key: apiKey,
              image: imageUrl, // Directly pass the image URL
          },
      });

      return uploadResponse.data;
  } catch (error) {
      console.error('Error uploading to ImgBB:', error.message);
      throw error;
  }
}
// Main function to update reminders
const updateReminders = async () => {
  try {
    await connectDB();

    const reminders = await Reminder.find({
      $and: [
        {
          $or: [
            { img: null },
            { img: { $exists: false } }
          ]
        },
        { imdb: { $exists: true, $ne: "" } }, // Check imdb exists and is not empty string
        { imdb: { $ne: null } } // Check imdb is not null
      ]
    });

    console.log(`Found ${reminders.length} reminders without images.`);

    let updatedCount = 0;

    for (let i = 0; i < reminders.length; i++) {
      const reminder = reminders[i];
      console.log(`Processing ${i + 1}/${reminders.length}: ${reminder.movieName}`);

      const movieData = await searchMovie(reminder.imdb);
      if (movieData) {
        if (movieData.poster && movieData.poster !== "N/A") {
          try {
            reminder.img = movieData.poster;
           // console.log(`added image to ${reminder.movieName}`)
          } catch (error) {
            console.log("Error fetching poster image:", error.message);
          }
        }

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
