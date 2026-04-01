import { apiRequest } from './api';

const SearchService = {
  globalSearch(query, limit = 6) {
    const cleanedQuery = String(query || '').trim();
    const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(Number(limit), 10)) : 6;

    if (!cleanedQuery) {
      return Promise.resolve([]);
    }

    return apiRequest({
      url: '/search',
      method: 'get',
      params: {
        q: cleanedQuery,
        limit: safeLimit,
      },
    }, {
      dedupeKey: `search:${cleanedQuery}:${safeLimit}`,
      cacheKey: `search:${cleanedQuery}:${safeLimit}`,
      cacheTtlMs: 10000,
    });
  },
};

export default SearchService;
