import * as Consumet from '@consumet/extensions';

// Get available ANIME provider classes
const animeObj = Consumet.ANIME || Consumet.default?.ANIME;

function getProvider(providerName = 'hianime') {
  if (!animeObj) return null;

  const key = Object.keys(animeObj).find(
    k => k.toLowerCase() === providerName.toLowerCase()
  );

  const ProviderClass = key ? animeObj[key] : animeObj.Hianime || animeObj.AnimePahe;
  if (!ProviderClass) return null;

  const TargetClass = typeof ProviderClass === 'function' ? ProviderClass : ProviderClass.default;
  return TargetClass ? new TargetClass() : null;
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

  const { action, q, episodeId, provider } = req.query;

  try {
    const animeProvider = getProvider(provider || 'hianime');

    if (!animeProvider) {
      return res.status(500).json({
        error: 'Provider Error',
        details: 'Could not initialize anime provider',
        availableProviders: Object.keys(animeObj || {})
      });
    }

    // 1. Search Anime: ?action=search&q=demon+slayer
    if (action === 'search') {
      const query = q || 'Naruto';
      const results = await animeProvider.search(query);
      return res.status(200).json(results);
    }

    // 2. Watch Episode: ?action=watch&episodeId=hianime-episode-id
    if (action === 'watch') {
      if (!episodeId) {
        return res.status(400).json({ error: 'Missing episodeId parameter' });
      }
      const sources = await animeProvider.fetchEpisodeSources(episodeId);
      return res.status(200).json(sources);
    }

    // 3. Get Anime Info & Episodes: ?action=info&id=anime-id
    if (action === 'info') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing anime id parameter' });
      const info = await animeProvider.fetchAnimeInfo(id);
      return res.status(200).json(info);
    }

    // Default status route with documentation & provider list
    return res.status(200).json({
      status: 'online',
      message: 'Consumet Anime Scraper API on Vercel is live!',
      availableProviders: Object.keys(animeObj || {}),
      endpoints: {
        search: '/?action=search&q=demon+slayer',
        info: '/?action=info&id=anime-id-from-search-results',
        watch: '/?action=watch&episodeId=episode-id-from-info'
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Scraper Error',
      message: error.message || String(error)
    });
  }
}
