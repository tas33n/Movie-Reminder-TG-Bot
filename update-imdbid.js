const mongoose = require("mongoose");
const axios = require("axios");
const config = require("./config.json");

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(
            config.mongodbUri
        );
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
            const id = response.data.Search[0].imdbID;
            // const movieDetails = await axios.get(`https://www.omdbapi.com/?apikey=${getApiKey()}&i=${id}`);
            // if (movieDetails.data.Response === "True") return movieDetails.data;
            return id;
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

        const reminders = await Reminder.find({ $or: [{ imdb: null }, { imdb: "" }] });
        console.log(`Found ${reminders.length} reminders with empty IMDb IDs.`);

        let updatedCount = 0;

        for (let i = 0; i < reminders.length; i++) {
            const reminder = reminders[i];
            console.log(`Processing ${i + 1}/${reminders.length}: ${reminder.movieName}`);

            const movieData = await searchMovie(reminder.movieName);
            if (movieData) {
                reminder.imdb = movieData;
                await reminder.save();
                updatedCount++;
                console.log(`Updated IMDb ID for "${reminder.movieName}" to ${movieData}.`);
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
