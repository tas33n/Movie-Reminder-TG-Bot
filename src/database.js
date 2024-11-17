const mongoose = require("mongoose");
const config = require("../config.json");

mongoose.connect(config.mongodbUri);

const reminderSchema = new mongoose.Schema({
  chatId: Number,
  movieName: String,
  month: Number,
  day: Number,
  imdb: String,
  img: String,
  lastNotifiedYear: Number
  
});

const configSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
});

const Reminder = mongoose.model("Reminder", reminderSchema);
const Config = mongoose.model("Config", configSchema);

module.exports = {
  // config db functions
  getConfig: async function (key) {
    const config = await Config.findOne({ key });
    return config ? config.value : null;
  },

  setConfig: async function (key, value) {
    await Config.findOneAndUpdate({ key }, { value }, { upsert: true });
  },

  deleteConfig: async function (key) {
    await Config.findOneAndDelete({ key });
  },

  getAllConfig: async function (includeSensitive = false) {
    const configs = await Config.find();
    return configs.reduce((acc, config) => {
      if (!includeSensitive && config.key.toLowerCase().includes("token")) {
        return acc;
      }
      acc[config.key] = config.value;
      return acc;
    }, {});
  },

  initializeConfig: async function (jsonConfig) {
    for (const [key, value] of Object.entries(jsonConfig)) {
      await this.setConfig(key, value);
    }
  },

  // reminder db functions
  createReminder: async (chatId, movieName, month, day, imdb = "", img = "", lastNotifiedYear = null) => {
    const reminder = new Reminder({
      chatId,
      movieName,
      month,
      day,
      imdb,
      img,
      lastNotifiedYear
    });
    await reminder.save();
    return reminder;
  },

  getReminders: async (chatId) => {
    return await Reminder.find({
      chatId,
    });
  },

  getAll: async () => {
    return await Reminder.find();
  },

  deleteReminder: async (chatId, reminderId) => {
    await Reminder.findOneAndDelete({ _id: reminderId, chatId });
  },

  getUpcomingReminders: async (month, day, currentYear) => {
    return await Reminder.find({
      month,
      day,
      $or: [
        { lastNotifiedYear: { $ne: currentYear } }, // Has not been notified this year
        { lastNotifiedYear: null }, // Or never notified
      ],
    });
  },

  getReminderByMovie: async (movieName) => {
    return await Reminder.findOne({ movieName });
  },

  getStats: async () => {
    const uniqueUsers = await Reminder.distinct("chatId");
    const totalUsers = uniqueUsers.length;
    const totalReminders = await Reminder.countDocuments();
    return { totalUsers, totalReminders };
  },
};
