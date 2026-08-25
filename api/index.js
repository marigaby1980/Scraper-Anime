import express from 'express';
import cors from 'cors';
import { ANIME } from '@consumet/extensions';

const app = express();
app.use(cors());

// Initialize Gogoanime provider instance
const gogoanime = new ANIME.Gogoanime();

// Root route
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    message: 'Consumet Anime Scraper API is running smoothly on Vercel!'
  });
});

// Search Anime Endpoint
// Example: /api/anime/search?q=demon+slayer
app.get('/api/anime/search', async (req, res) => {
  try {
    const query = req.query.q || 'Naruto';
    const results = await gogoanime.search(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Watch Episode Endpoint
// Example: /api/anime/watch/kimetsu-no-yaiba-episode-1
app.get('/api/anime/watch/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const sources = await gogoanime.fetchEpisodeSources(episodeId);
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
