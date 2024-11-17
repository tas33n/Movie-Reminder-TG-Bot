# Telegram Movie Reminder Bot

A Telegram bot that helps users set reminders for upcoming movie releases. Never miss a movie premiere again!

## Features

- 🎬 Search for movies using TMDB API
- 📅 Set reminders for movie release dates
- 🔔 Receive notifications one day before and on the release date
- 📋 List and manage your movie reminders
- 🖼️ View movie posters and details
- 🔐 Admin commands for bot statistics

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or higher)
- MongoDB
- Telegram Bot Token
- TMDB API Key

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/tas33n/tg-movie-reminder.git
   cd tg-movie-reminder
   ```

2. Install the dependencies:

   ```
   npm install
   ```

3. Create a `config.json` file in the root directory with the following content:

   ```json
   {
     "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
     "mongodbUri": "YOUR_MONGODB_URI",
     "tmdbApiKey": "YOUR_TMDB_API_KEY",
     "adminIds": [123456789, 987654321],
     "apiKey": "YOUR_API_KEY_FOR_EXPRESS_ENDPOINTS"
   }
   ```

   Replace the placeholder values with your actual credentials.

## Usage

To start the bot, run:

```
node bot.js
```

### Available Commands

- `/start` - Start the bot and get a welcome message
- `/help` - Display available commands and their usage
- `/remind <movie name> [YYYY-MM-DD]` - Set a reminder for a movie
- `/list` - List your active reminders
- `/delete <reminder_id>` - Delete a specific reminder
- `/search <movie name>` - Search for a movie and view its details

Admin Commands:

- `/stats` - Show bot statistics (only accessible by admins)

## Contributing

Contributions to the Telegram Movie Reminder Bot are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Author

[tas33n](https://github.com/tas33n)

## Acknowledgements

- [Telegraf](https://github.com/telegraf/telegraf)
- [TMDB API](https://www.themoviedb.org/documentation/api)
- [MongoDB](https://www.mongodb.com/)
