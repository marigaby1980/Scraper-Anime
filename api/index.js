import { ANIME } from '@consumet/extensions';

export default async function handler(req, res) {
  // Enable CORS so your app can fetch data from this API
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight browser requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, q, episodeId } = req.query;

  try {
    // Lazy-initialize scraper inside handler so startup errors are caught cleanly
    const gogoanime = new ANIME.Gogoanime();

    // 1. Search Anime: ?action=search&q=naruto
    if (action === 'search') {
      const query = q || 'Naruto';
      const results = await gogoanime.search(query);
      return res.status(200).json(results);
    }

    // 2. Watch Episode: ?action=watch&episodeId=naruto-episode-1
    if (action === 'watch') {
      if (!episodeId) {
        return res.status(400).json({ error: 'Missing episodeId parameter' });
      }
      const sources = await gogoanime.fetchEpisodeSources(episodeId);
      return res.status(200).json(sources);
    }

    // Default status message
    return res.status(200).json({
      status: 'online',
      message: 'Consumet API on Vercel is running successfully!',
      endpoints: {
        search: '/api/anime?action=search&q=demon+slayer',
        watch: '/api/anime?action=watch&episodeId=kimetsu-no-yaiba-episode-1'
      }
    });

  } catch (error) {
    console.error('Vercel Scraper Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch data from provider',
      details: error.message || String(error)
    });
  }
}
