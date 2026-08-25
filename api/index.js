import * as Consumet from '@consumet/extensions';

const animeObj = Consumet.ANIME || Consumet.default?.ANIME;

// Strictly active domains provided by user
const DOMAIN_MAP = {
  hianime: 'https://hianime.ms',
  animepahe: 'https://animepahe.ch',
  gogoanime: 'https://gogoanime.by'
};

// Helper to instantiate provider with the specific working domain
function getProviderInstance(providerName = 'hianime') {
  if (!animeObj) return null;

  const keyLower = providerName.toLowerCase();
  const providerKey = Object.keys(animeObj).find(
    k => k.toLowerCase() === keyLower
  ) || 'Hianime';

  const ProviderClass = typeof animeObj[providerKey] === 'function' 
    ? animeObj[providerKey] 
    : animeObj[providerKey]?.default;

  if (!ProviderClass) return null;

  const customUrl = DOMAIN_MAP[keyLower] || DOMAIN_MAP.hianime;

  try {
    return new ProviderClass(customUrl);
  } catch (err) {
    // If provider constructor doesn't accept a custom URL parameter, fallback to default constructor
    return new ProviderClass();
  }
}

export default async function handler(req, res) {
  // Enable CORS
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

  const { action, q, episodeId, id, provider = 'hianime' } = req.query;

  try {
    const animeProvider = getProviderInstance(provider);

    if (!animeProvider) {
      return res.status(500).json({
        error: 'Provider Initialization Error',
        details: `Could not load provider instance for '${provider}'`
      });
    }

    // 1. Search Anime: ?action=search&q=demon+slayer
    if (action === 'search') {
      const query = q || 'Naruto';
      const results = await animeProvider.search(query);
      return res.status(200).json(results);
    }

    // 2. Watch Episode: ?action=watch&episodeId=episode-id
    if (action === 'watch') {
      if (!episodeId) {
        return res.status(400).json({ error: 'Missing episodeId parameter' });
      }
      const sources = await animeProvider.fetchEpisodeSources(episodeId);
      return res.status(200).json(sources);
    }

    // 3. Anime Info & Episodes: ?action=info&id=anime-id
    if (action === 'info') {
      if (!id) {
        return res.status(400).json({ error: 'Missing id parameter' });
      }
      const info = await animeProvider.fetchAnimeInfo(id);
      return res.status(200).json(info);
    }

    // Default status route
    return res.status(200).json({
      status: 'online',
      message: 'Consumet API on Vercel is running using active domains!',
      activeDomains: DOMAIN_MAP,
      endpoints: {
        search: '/?action=search&q=demon+slayer',
        searchWithProvider: '/?action=search&q=demon+slayer&provider=animepahe',
        info: '/?action=info&id=anime-id',
        watch: '/?action=watch&episodeId=episode-id'
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Scraper Error',
      message: error.message || String(error)
    });
  }
}
