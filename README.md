# Telegram Movie Reminder Bot

A Telegram bot that helps users set reminders for upcoming movie releases with web dashboard for management. Never miss a movie premiere again!

## Features

- 🎬 Search for movies using OMDB API
- 📅 Set annual reminders for movie release dates
- 🔔 Receive notifications one day before release dates
- 📋 List and manage your movie reminders with web-ui
- 🖼️ View movie posters and details
- 🎯 Support for direct IMDB ID input
- 🌐 REST API for external integrations
- 🎨 Web Dashboard UI
  - Grid/List view toggle
  - Movie data visualization
  - Uptime monitoring
  - Responsive design
- ⚙️ Dynamic configuration management  
- 📊 Bot statistics tracking
- 👥 Group notifications support
- 🔐 Admin controllers

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v18 or higher)
- MongoDB
- Telegram Bot Token
- OMDB API Key

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/tas33n/tg-movie-reminder.git
    cd tg-movie-reminder
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Create a `config.json` file in the root directory with the following content:
    ```json
    {
      "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
      "mongodbUri": "YOUR_MONGODB_URI",
      "tmdbApiKey": "YOUR_OMDB_API_KEY",
      "adminIds": [123456789, 987654321],
      "apiKey": "YOUR_API_KEY_FOR_EXPRESS_ENDPOINTS",
      "sudoKey": "YOUR_SUDO_KEY_FOR_ADMIN_ENDPOINTS",
      "groupID": "YOUR_TELEGRAM_GROUP_ID"
    }
    ```

## Usage

To start both the bot and web server:
```bash
npm start
```

### Web Dashboard

The web interface is automatically served when you start the server. Access it at:
```
http://localhost:2233
```

Features:
- Toggle between grid and list views
- View all movie reminders
- Monitor bot uptime
- Responsive design for mobile devices

### Available Commands

User Commands:
- `/start` - Start the bot and get a welcome message
- `/help` - Display available commands and their usage
- `/remind <movie name>; [MM-DD]` - Set an annual reminder for a movie
- `/remind -i <imdb_id>` - Set a reminder using IMDB ID
- `/list` - List your active reminders
- `/list -g` - List all global users reminders (admin only)
- `/delete <reminder_id>` - Delete a specific reminder
- `/search <movie name>` - Search for a movie and view its details
- `/stats` - Show bot statistics

Admin Commands:
- `/config list` - List all configuration values
- `/config get <key>` - Get specific configuration value
- `/config set <key> <value>` - Update configuration
- `/config delete <key>` - Delete configuration key

## API Endpoints

The bot includes a REST API running on port 2233:

```
GET /uptime - Check bot uptime
GET /reminders?key=<apiKey>&id=<userId> - Get reminders for specific user
GET /reminders?key=<apiKey> - Get all reminders
POST /reminders - Create a new reminder
DELETE /reminders/:chatid/:id - Delete a specific reminder (requires sudo key)
GET /stats - Get bot statistics
```

### API Authentication
- Regular endpoints require `apiKey` query parameter
- Admin endpoints require `X-Sudo-Key` header or `key` query parameter

## Features Technical Details

### Reminder System
- Uses `node-cron` for scheduling checks every hour
- Timezone-aware using `moment-timezone` (Asia/Dhaka)
- Supports annual recurring reminders
- Tracks last notification year to prevent duplicates

### Movie Data
- Integrates with OMDB API for movie information
- Supports both movie name and IMDB ID searches
- Includes movie posters when available

### Database
- MongoDB-based storage
- Supports dynamic configuration
- Tracks user statistics
- Implements pagination for reminder lists

### Web Interface
- Static file serving via Express
- Real-time uptime monitoring
- Grid/List view toggle functionality
- Mobile-responsive design
- Served by MisfitsDev.pro

## Dependencies

```json
{
  "dependencies": {
    "axios": "^1.7.7",
    "chalk": "^4.1.2",
    "express": "^4.21.1",
    "moment-timezone": "^0.5.46",
    "mongoose": "^8.8.1",
    "node-cron": "^3.0.3",
    "telegraf": "^4.16.3"
  }
}
```

## Contributing

Contributions to the Telegram Movie Reminder Bot are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## License

This project is licensed under the ISC License.

## Author

[tas33n](https://github.com/tas33n)

## Acknowledgements

- Web UI served by [MisfitsDev.pro](https://Misfitsdev.pro)
- [OMDB API](https://www.omdbapi.com/) for movie data
- [Telegraf](https://github.com/telegraf/telegraf) for Telegram Bot framework
