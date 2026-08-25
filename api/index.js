import { ANIME } from '@consumet/extensions';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, q, episodeId } = req.query;

  try {
    const gogoanime = new ANIME.Gogoanime();

    // 1. Search Anime: ?action=search&q=demon+slayer
    if (action === 'search') {
      const query = q || 'Naruto';
      const results = await gogoanime.search(query);
      return res.status(200).json(results);
    }

    // 2. Watch Episode: ?action=watch&episodeId=kimetsu-no-yaiba-episode-1
    if (action === 'watch') {
      if (!episodeId) {
        return res.status(400).json({ error: 'Missing episodeId parameter' });
      }
      const sources = await gogoanime.fetchEpisodeSources(episodeId);
      return res.status(200).json(sources);
    }

    // Default API Info Message when opening root URL
    return res.status(200).json({
      status: 'online',
      message: 'Consumet API on Vercel is working!',
      examples: [
        '/?action=search&q=naruto',
        '/?action=watch&episodeId=naruto-episode-1'
      ]
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Scraper Error',
      message: error.message || String(error)
    });
  }
}
