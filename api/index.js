import * as Consumet from '@consumet/extensions';

// Safe namespace resolution across ESM and CJS bundler outputs
const ANIME = Consumet.ANIME || Consumet.default?.ANIME;
const GogoanimeClass = 
  ANIME?.Gogoanime || 
  Consumet.Gogoanime || 
  Consumet.default?.Gogoanime;

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
    if (!GogoanimeClass) {
      return res.status(500).json({
        error: 'Module Resolution Error',
        details: 'Gogoanime provider class could not be resolved',
        availableExports: Object.keys(Consumet)
      });
    }

    // Instantiate provider instance
    const gogoanime = new GogoanimeClass();

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

    // Default status route
    return res.status(200).json({
      status: 'online',
      message: 'Consumet API on Vercel is online and operating correctly!',
      endpoints: {
        search: '/?action=search&q=naruto',
        watch: '/?action=watch&episodeId=naruto-episode-1'
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Scraper Error',
      message: error.message || String(error)
    });
  }
}
