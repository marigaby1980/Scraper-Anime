import * as Consumet from '@consumet/extensions';

// Inspect all layers to safely resolve Gogoanime class
function getGogoanimeClass() {
  const animeObj = Consumet.ANIME || Consumet.default?.ANIME;
  if (!animeObj) return null;

  if (typeof animeObj.Gogoanime === 'function') {
    return animeObj.Gogoanime;
  }
  if (animeObj.Gogoanime?.default && typeof animeObj.Gogoanime.default === 'function') {
    return animeObj.Gogoanime.default;
  }
  if (animeObj.default?.Gogoanime && typeof animeObj.default.Gogoanime === 'function') {
    return animeObj.default.Gogoanime;
  }
  return null;
}

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
    const GogoanimeClass = getGogoanimeClass();

    if (!GogoanimeClass) {
      const animeObj = Consumet.ANIME || Consumet.default?.ANIME;
      return res.status(500).json({
        error: 'Module Resolution Error',
        details: 'Gogoanime provider class could not be resolved',
        animeKeys: animeObj ? Object.keys(animeObj) : 'ANIME is null/undefined'
      });
    }

    // Safely instantiate provider instance
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
