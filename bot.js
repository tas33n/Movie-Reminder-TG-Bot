const moment = require('moment-timezone');
const { Telegraf } = require('telegraf');
const config = require('./config.json');
const cron = require('node-cron');
const db = require('./database');
const omdb = require('./omdb');
const axios = require('axios');
const groupID = config.groupID;
const bot = new Telegraf(config.botToken);

// Middleware to check if user is admin
const isAdmin = (ctx, next) => {
  if (config.adminIds.includes(ctx.from.id)) {
    return next();
  }
  return ctx.reply("🚫 This command is restricted to admins only.", {
    reply_to_message_id: ctx.message.message_id,
  });
};

bot.command("start", (ctx) => {
  ctx.reply(
    "🎬 Welcome to the Movie Reminder Bot!\n\nUse /help to see available commands.",
    {
      parse_mode: "HTML",
      reply_to_message_id: ctx.message.message_id,
    }
  );
});

bot.command("help", (ctx) => {
  ctx.reply(
    "🎥 <b>Movie Reminder Bot Commands</b>\n\n" +
    "/remind &lt;movie name&gt; [MM-DD] - Set a reminder for a movie\n" +
    "/list - List your reminders\n" +
    "/delete &lt;reminder_id&gt; - Delete a reminder\n" +
    "/search &lt;movie name&gt; - Search for a movie\n\n" +
    "<b>Admin commands:</b>\n" +
    "/stats - Show bot statistics",
    {
      parse_mode: "HTML",
      reply_to_message_id: ctx.message.message_id,
    }
  );
});

const ITEMS_PER_PAGE = 10; // Adjust this number based on how many items you want per page

bot.command("list", async (ctx) => {
  const page = 1;
  const isGlobal = ctx.message.text.includes('-g');
  await sendReminderList(ctx, page, isGlobal, null); // Pass null for message_id initially
});

async function sendReminderList(ctx, page, isGlobal, messageId) {
  let reminders;
  if (isGlobal) {
    reminders = await db.getAll();
  } else {
    reminders = await db.getReminders(ctx.from.id);
  }

  if (reminders.length === 0) {
    return ctx.reply("📭 You have no active reminders.", {
      reply_to_message_id: ctx.message ? ctx.message.message_id : ctx.update.callback_query.message.message_id,
    });
  }

  // Calculate pagination
  const totalPages = Math.ceil(reminders.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const currentReminders = reminders.slice(start, end);

  // Create the message for the current page
  let message = "🎥 <b>Your Movie Reminders</b>\n\n";
  currentReminders.forEach((reminder, index) => {
    message += `${start + index + 1}. ${reminder.movieName} - ${String(reminder.month).padStart(2, '0')}-${String(reminder.day).padStart(2, '0')} (ID: <code>${reminder._id}</code>)\n`;
  });
  message += `\nPage ${page} of ${totalPages}`;

  // Generate navigation buttons
  const inlineKeyboard = [];
  if (page > 1) {
    inlineKeyboard.push({ text: "⬅️ Previous", callback_data: `list_${page - 1}_${isGlobal}` });
  }
  if (page < totalPages) {
    inlineKeyboard.push({ text: "Next ➡️", callback_data: `list_${page + 1}_${isGlobal}` });
  }

  if (messageId) {
    // If messageId is provided, edit the existing message
    await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, message, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [inlineKeyboard] },
    });
  } else {
    // Send a new message if there's no messageId (initial command)
    const sentMessage = await ctx.reply(message, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [inlineKeyboard] },
    });
    messageId = sentMessage.message_id;
  }
}

// Handle button presses for pagination
bot.action(/list_(\d+)_(true|false)/, async (ctx) => {
  const page = parseInt(ctx.match[1], 10);
  const isGlobal = ctx.match[2] === "true";
  const messageId = ctx.update.callback_query.message.message_id;
  await sendReminderList(ctx, page, isGlobal, messageId);
  ctx.answerCbQuery(); // Remove the loading state from the button
});

bot.command("search", async (ctx) => {
  const query = ctx.message.text.split("/search ")[1];
  if (!query) {
    return ctx.reply("⚠️ Please provide a movie name to search.", {
      reply_to_message_id: ctx.message.message_id,
    });
  }

  try {
    const movieData = await omdb.searchMovie(query);
    if (!movieData.Response === "True") {
      return ctx.reply(
        "❌ Movie not found. Please check the name and try again.",
        {
          reply_to_message_id: ctx.message.message_id,
        }
      );
    }

    const posterUrl = movieData.Poster === "N/A" ? null : movieData.Poster;
    const message = `🎬 <b>${movieData.Title}</b>\n📅 Release Date: ${movieData.Released}`;

    if (posterUrl) {
      await ctx.replyWithPhoto(
        { url: posterUrl },
        {
          caption: message,
          parse_mode: "HTML",
          reply_to_message_id: ctx.message.message_id,
        }
      );
    } else {
      await ctx.reply(message, {
        parse_mode: "HTML",
        reply_to_message_id: ctx.message.message_id,
      });
    }
  } catch (error) {
    ctx.reply("❌ Error searching for the movie. Please try again.", {
      reply_to_message_id: ctx.message.message_id,
    });
  }
});

bot.command("delete", async (ctx) => {
  const reminderId = ctx.message.text.split("/delete ")[1];
  if (!reminderId) {
    return ctx.reply("⚠️ Please provide a reminder ID to delete.", {
      reply_to_message_id: ctx.message.message_id,
    });
  }

  try {
    await db.deleteReminder(ctx.from.id, reminderId);
    ctx.reply("✅ Reminder deleted successfully.", {
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (error) {
    ctx.reply(
      "❌ Error deleting reminder. Please check the ID and try again.",
      {
        reply_to_message_id: ctx.message.message_id,
      }
    );
  }
});

bot.command("stats", async (ctx) => {
  const stats = await db.getStats();
  ctx.reply(
    `📊 <b>Bot Statistics</b>\n\n` +
    `Total Users: ${stats.totalUsers}\n` +
    `Total Reminders: ${stats.totalReminders}\n`,
    {
      parse_mode: "HTML",
      reply_to_message_id: ctx.message.message_id,
    }
  );
});

bot.command("remind", async (ctx) => {
  const input = ctx.message.text.split("/remind ")[1];
  if (!input) {
    return ctx.reply(
      "⚠️ Please provide input in the format:\n<code>/remind Movie Name; [MM-DD]</code>",
      { parse_mode: "HTML", reply_to_message_id: ctx.message.message_id }
    );
  }

  let movieData = {}; // Initialize movieData as an empty object
  let month, day, imdb, posterUrl = null;

  if (input.includes("-i")) {
    const imdbID = input.split("-i")[1].trim(); // Trim any extra spaces around the IMDb ID
    try {
      const { data } = await axios.get(`https://www.omdbapi.com/?apikey=9990cb2f&i=${imdbID}`);
      if (data && data.Released && data.Title) {
        const parsedDate = moment.tz(data.Released, 'DD MMM YYYY', 'Asia/Dhaka');
        movieData.title = data.Title;
        month = parsedDate.month() + 1;
        day = parsedDate.date();
        imdb = imdbID;
        posterUrl = data.Poster === "N/A" ? null : data.Poster;
      } else {
        return ctx.reply("❌ Movie not found with the provided IMDb ID.", {
          reply_to_message_id: ctx.message.message_id,
        });
      }
    } catch (error) {
      return ctx.reply("❌ Error retrieving movie data. Please try again later.", {
        reply_to_message_id: ctx.message.message_id,
      });
    }
  } else {
    let [movieName, userDate] = input.split(";").map((str) => str.trim());
    if (userDate) {
      // Use provided MM-DD if available
      const date = moment(userDate, "MM-DD", true);
      if (!date.isValid()) {
        return ctx.reply("❌ Invalid date format. Use MM-DD", {
          reply_to_message_id: ctx.message.message_id,
        });
      }
      month = date.month() + 1; // Month is 0-based in Moment.js
      day = date.date();
      imdb = null;
    } else {
      // No date provided, search TMDb for release date
      try {
        const data = await omdb.searchMovie(movieName);
        if (!data || !data.Response) {
          return ctx.reply("❌ Movie not found. Please check the name and try again.", {
            reply_to_message_id: ctx.message.message_id,
          });
        }

        const parsedDate = moment.tz(data.Released, 'DD MMM YYYY', 'Asia/Dhaka');
        movieData.title = data.Title;
        month = parsedDate.month() + 1;
        day = parsedDate.date();
        imdb = data.imdbID;
        posterUrl = data.Poster === "N/A" ? null : data.Poster;
      } catch (error) {
        console.log(error)
        return ctx.reply("❌ Error searching for the movie. Please try again later.", {
          reply_to_message_id: ctx.message.message_id,
        });
      }
    }
    movieData.title = movieData.title || movieName; // Default to input name if no title from TMDb
  }

  const nameToSave = movieData.title;

  // Check if the movie reminder already exists
  const existingReminder = await db.getReminderByMovie(nameToSave);
  if (existingReminder) {
    return ctx.reply(
      `⚠️ A reminder is already set for "${existingReminder.movieName} (ID: <code>${existingReminder._id}</code>)".`,
      { parse_mode: "HTML", reply_to_message_id: ctx.message.message_id }
    );
  }

  await db.createReminder(ctx.from.id, nameToSave, month, day, imdb, null);

  const message = `🎬 Annual reminder set for "${nameToSave}" on ${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  if (posterUrl) {
    await ctx.replyWithPhoto(
      { url: posterUrl },
      {
        caption: message,
        parse_mode: "HTML",
        reply_to_message_id: ctx.message.message_id,
      }
    );
  } else {
    await ctx.reply(message, {
      parse_mode: "HTML",
      reply_to_message_id: ctx.message.message_id,
    });
  }
});


// Scheduled job to check for reminders every 1h in Dhaka time
cron.schedule('0 * * * *', async () => {
  const now = moment.tz('Asia/Dhaka');
  const tomorrow = now.clone().add(1, 'day');
  const currentYear = now.year();
  const month = tomorrow.month() + 1; // 1-based month
  const day = tomorrow.date();

  console.log(`Checking reminders for ${month}-${day} (Dhaka time)`);

  // Find reminders matching tomorrow's month and day, and that have not been notified this year
  const reminders = await db.getUpcomingReminders(month, day, currentYear);

  reminders.forEach(async (reminder) => {
    if (reminder.imdb) {
      const data = await omdb.getInfo(reminder.imdb);
      const image = data.Poster === "N/A" ? null : data.Poster;
      if (image) {
        await bot.telegram.sendPhoto(
          groupID, // chat id
          image,
          {
            caption: `🎬 Reminder: The movie "${reminder.movieName}" is scheduled for tomorrow (${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')})!`,
          }
        );
      }
      else {
        await bot.telegram.sendMessage(
          groupID, // chat id
          `🎬 Reminder: The movie "${reminder.movieName}" is scheduled for tomorrow (${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')})!`
        );
      }
    } else {
      await bot.telegram.sendMessage(
        groupID, // chat id
        `🎬 Reminder: The movie "${reminder.movieName}" is scheduled for tomorrow (${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')})!`
      );
    }

    // Update current year
    reminder.lastNotifiedYear = currentYear;
    await reminder.save();
  });
});

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));