import * as Consumet from '@consumet/extensions';

const animeObj = Consumet.ANIME || Consumet.default?.ANIME;

// Working fallback domains for popular anime scrapers
const DOMAIN_MAP = {
  hianime: ['https://hianime.to', 'https://hianime.vc', 'https://hianime.nz'],
  animepahe: ['https://animepahe.ru', 'https://animepahe.com', 'https://animepahe.org'],
  gogoanime: ['https://anitaku.pe', 'https://gogoanime3.co']
};

// Helper to safely instantiate a provider with a specific custom baseUrl
function createProviderInstance(providerKey, customUrl = null) {
  if (!animeObj || !animeObj[providerKey]) return null;
  const TargetClass = typeof animeObj[providerKey] === 'function' 
    ? animeObj[providerKey] 
    : animeObj[providerKey].default;

  if (!TargetClass) return null;

  try {
    return customUrl ? new TargetClass(customUrl) : new TargetClass();
  } catch (err) {
    return null;
  }
}

// Executes a scraper action with automatic domain & provider fallback
async function executeWithFallback(requestedProvider, actionFn) {
  const providerList = Object.keys(animeObj || {});
  
  // Rank requested provider first, followed by available fallbacks
  const targetKey = providerList.find(p => p.toLowerCase() === requestedProvider.toLowerCase()) 
    || 'Hianime';

  const providersToTry = [
    targetKey,
    ...providerList.filter(p => p !== targetKey)
  ];

  let lastError = null;

  for (const key of providersToTry) {
    const keyLower = key.toLowerCase();
    const customDomains = DOMAIN_MAP[keyLower] || [null];

    for (const domain of customDomains) {
      try {
        const instance = createProviderInstance(key, domain);
        if (!instance) continue;

        // Run the scraper request (search, info, watch)
        const result = await actionFn(instance);
        if (result) return { data: result, providerUsed: key, domainUsed: domain || 'default' };
      } catch (err) {
        lastError = err;
        // Continue loop to try next domain or provider
      }
    }
  }

  throw lastError || new Error('All anime scraper providers failed to respond');
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

  const { action, q, episodeId, id, provider = 'hianime' } = req.query;

  try {
    // 1. Search Anime: ?action=search&q=naruto
    if (action === 'search') {
      const query = q || 'Naruto';
      const result = await executeWithFallback(provider, (p) => p.search(query));
      return res.status(200).json(result);
    }

    // 2. Watch Episode: ?action=watch&episodeId=episode-id
    if (action === 'watch') {
      if (!episodeId) {
        return res.status(400).json({ error: 'Missing episodeId parameter' });
      }
      const result = await executeWithFallback(provider, (p) => p.fetchEpisodeSources(episodeId));
      return res.status(200).json(result);
    }

    // 3. Anime Info: ?action=info&id=anime-id
    if (action === 'info') {
      if (!id) {
        return res.status(400).json({ error: 'Missing id parameter' });
      }
      const result = await executeWithFallback(provider, (p) => p.fetchAnimeInfo(id));
      return res.status(200).json(result);
    }

    // Default status route
    return res.status(200).json({
      status: 'online',
      message: 'Consumet API on Vercel is running with automatic failover!',
      availableProviders: Object.keys(animeObj || {}),
      endpoints: {
        search: '/?action=search&q=demon+slayer',
        searchWithProvider: '/?action=search&q=demon+slayer&provider=hianime',
        info: '/?action=info&id=anime-id',
        watch: '/?action=watch&episodeId=episode-id'
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Scraper Fetch Error',
      message: error.message || String(error)
    });
  }
}
