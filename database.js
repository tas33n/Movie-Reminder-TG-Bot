const mongoose = require("mongoose");
const config = require("./config.json");

mongoose.connect(config.mongodbUri);

const reminderSchema = new mongoose.Schema({
  chatId: Number,
  movieName: String,
  month: Number,          // Month of the reminder
  day: Number,            // Day of the reminder
  imdb: String,           // IMDB ID
  lastNotifiedYear: Number // Year when the last notification was sent
});

const Reminder = mongoose.model("Reminder", reminderSchema);

module.exports = {
  createReminder: async (chatId, movieName, month, day, imdb = "", lastNotifiedYear) => {
    const reminder = new Reminder({ chatId, movieName, month, day, imdb, lastNotifiedYear });
    await reminder.save();
    return reminder;
  },

  getReminders: async (chatId) => {
    return await Reminder.find({
      chatId
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
        { lastNotifiedYear: null } // Or never notified
      ]
    });
  },

  markNotifiedBeforeRelease: async (reminderId) => {
    await Reminder.findByIdAndUpdate(reminderId, {
      notifiedBeforeRelease: true,
    });
  },

  markNotifiedOnRelease: async (reminderId) => {
    await Reminder.findByIdAndUpdate(reminderId, { notifiedOnRelease: true });
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
