const express = require('express');
const cors = require('cors');
const { ANIME } = require('@consumet/extensions');

const app = express();
app.use(cors());

// Initialize Gogoanime provider
const gogoanime = new ANIME.Gogoanime();

// API Root / Status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Consumet Anime Scraper Serverless API on Vercel is live!'
  });
});

// Search Anime
// Example: /anime/search?q=Demon+Slayer
app.get('/anime/search', async (req, res) => {
  try {
    const query = req.query.q || 'Naruto';
    const results = await gogoanime.search(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Episode Details & Stream Links
// Example: /anime/watch/kimetsu-no-yaiba-episode-1
app.get('/anime/watch/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const sources = await gogoanime.fetchEpisodeSources(episodeId);
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
