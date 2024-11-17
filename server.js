const express = require('express');
const config = require('./config.json');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  const apiKey = req.query.key;
  if (apiKey !== config.apiKey) {
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
  try {
    const reminders = await db.getReminders(1005163422);
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new reminder (protected)
app.post('/reminders', checkApiKey, async (req, res) => {
  try {
    const { userId, movieId, movieName, releaseDate } = req.body;
    const reminder = await db.createReminder(userId, movieId, movieName, new Date(releaseDate));
    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ error: 'Bad request' });
  }
});

// Delete a reminder (protected)
app.delete('/reminders/:id', checkApiKey, async (req, res) => {
  try {
    await db.deleteReminder(req.params.id);
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