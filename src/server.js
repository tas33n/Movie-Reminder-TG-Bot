const express = require('express');
const config = require('../config.json');
const db = require('./database');

const app = express();
const port = process.env.PORT || 2233;

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  const apiKey = req.query.key;
  if (apiKey !== config.apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}; 

const checksudoKey = (req, res, next) => {
  const sudoKey = req.query.key || req.get('X-Sudo-Key');
  if (sudoKey !== config.sudoKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.use(express.json());

app.use('/', express.static('web'));

// Uptime endpoint
app.get('/uptime', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Get all reminders (protected)
app.get('/reminders', checkApiKey, async (req, res) => {
  const userid = req.query.id || null;
  try {
    if (userid) {
      const reminders = await db.getReminders(userid);
      res.json(reminders);
    } else {
      const reminders = await db.getAll();
      res.json(reminders);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new reminder (protected)
app.post('/reminders', checksudoKey, async (req, res) => {
  try {
    const { chatId, movieName, month, day, imdb, img, lastNotifiedYear } = req.body;
    const existingReminder = await db.getReminderByMovie(movieName);
    if (existingReminder) {
      return res.json({
        isDuplicate: true,
        info: existingReminder
      })
    };

    const reminder = await db.createReminder(chatId, movieName, month, day, imdb, img, lastNotifiedYear);
    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ error: 'Bad request' });
  }
});

// Delete a reminder (protected)
app.delete('/reminders/:chatid/:id', checksudoKey, async (req, res) => {
  try {
    await db.deleteReminder(req.params.chatid, req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

// Get bot statistics (protected)
app.get('/stats', checkApiKey, async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});