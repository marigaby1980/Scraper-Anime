const express = require('express');
const cors = require('cors');
const { ANIME } = require('@consumet/extensions');

const app = express();
app.use(cors());

// Initialize Gogoanime provider
const gogoanime = new ANIME.Gogoanime();

// Healthcheck endpoint
app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'Consumet Anime Scraper API is running!' });
});

// Search Anime
app.get('/anime/search', async (req, res) => {
  try {
    const query = req.query.q || 'Naruto';
    const results = await gogoanime.search(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Episode Streams / Video Sources
app.get('/anime/watch/:episodeId', async (req, res) => {
  try {
    const episodeId = req.params.episodeId;
    const sources = await gogoanime.fetchEpisodeSources(episodeId);
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Scraper running on port ${PORT}`));
