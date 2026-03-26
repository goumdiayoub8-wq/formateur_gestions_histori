import { apiRequest } from './api';

const SearchService = {
  globalSearch(query, limit = 6) {
    return apiRequest({
      url: '/search',
      method: 'get',
      params: {
        q: query,
        limit,
      },
    });
  },
};

export default SearchService;
