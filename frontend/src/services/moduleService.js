import { apiRequest, invalidateApiCache } from './api';

const MODULES_BASE = '/modules';

const ModuleService = {
  list(filters = {}) {
    return apiRequest(
      {
        url: MODULES_BASE,
        method: 'get',
        params: filters,
      },
      {
        dedupeKey: `modules:list:${JSON.stringify(filters)}`,
        cacheKey: `modules:list:${JSON.stringify(filters)}`,
        cacheTtlMs: 30000,
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
        url: MODULES_BASE,
        method: 'get',
        params,
      },
      {
        raw: true,
        dedupeKey: `modules:paginated:${JSON.stringify(params)}`,
        cacheKey: `modules:paginated:${JSON.stringify(params)}`,
        cacheTtlMs: 10000,
      },
    );
  },

  create(payload) {
    return apiRequest({
      url: MODULES_BASE,
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('modules:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('planning:');
      return response;
    });
  },

  update(id, payload) {
    return apiRequest({
      url: `${MODULES_BASE}/${id}`,
      method: 'put',
      data: payload,
    }).then((response) => {
      invalidateApiCache('modules:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('planning:');
      return response;
    });
  },

  remove(id) {
    return apiRequest(
      {
        url: `${MODULES_BASE}/${id}`,
        method: 'delete',
      },
      { raw: true },
    ).then((response) => {
      invalidateApiCache('modules:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('planning:');
      return response;
      });
  },

  getProgressSummary() {
    return apiRequest(
      {
        url: `${MODULES_BASE}?action=progress-summary`,
        method: 'get',
      },
      {
        dedupeKey: 'modules:progress-summary',
        cacheKey: 'modules:progress-summary',
        cacheTtlMs: 15000,
      },
    );
  },

  getProgressListPage({ page = 1, limit = 5, ...filters } = {}) {
    const params = {
      page,
      limit,
      ...filters,
    };

    return apiRequest(
      {
        url: `${MODULES_BASE}?action=progress-list`,
        method: 'get',
        params,
      },
      {
        raw: true,
        dedupeKey: `modules:progress-list-page:${JSON.stringify(params)}`,
        cacheKey: `modules:progress-list-page:${JSON.stringify(params)}`,
        cacheTtlMs: 10000,
      },
    );
  },
};

export default ModuleService;
