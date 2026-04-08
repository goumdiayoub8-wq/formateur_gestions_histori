import { apiRequest, invalidateApiCache } from './api';

const AFFECTATIONS_BASE = '/affectations';

const AffectationService = {
  list(filters = {}) {
    return apiRequest(
      {
        url: AFFECTATIONS_BASE,
        method: 'get',
        params: filters,
      },
      {
        dedupeKey: `affectations:list:${JSON.stringify(filters)}`,
      },
    );
  },

  listPaginated({ page = 1, limit = 5, search = '', ...filters } = {}) {
    const normalizedSearch = search.trim();
    const params = {
      page,
      limit,
      ...filters,
      ...(normalizedSearch ? { search: normalizedSearch } : {}),
    };

    return apiRequest(
      {
        url: AFFECTATIONS_BASE,
        method: 'get',
        params,
      },
      {
        raw: true,
        dedupeKey: `affectations:paginated:${JSON.stringify(params)}`,
        cacheKey: `affectations:paginated:${JSON.stringify(params)}`,
        cacheTtlMs: 10000,
      },
    );
  },

  create(payload) {
    return apiRequest({
      url: AFFECTATIONS_BASE,
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('affectations:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('planning:');
      return response;
    });
  },

  remove(id) {
    return apiRequest(
      {
        url: `${AFFECTATIONS_BASE}/${id}`,
        method: 'delete',
      },
      { raw: true },
    ).then((response) => {
      invalidateApiCache('affectations:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('planning:');
      return response;
    });
  },
};

export default AffectationService;
