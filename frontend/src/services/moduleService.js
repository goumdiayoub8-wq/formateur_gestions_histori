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

  get(id) {
    return apiRequest({
      url: `${MODULES_BASE}/${id}`,
      method: 'get',
    });
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

  getProgressList(filters = {}) {
    return apiRequest(
      {
        url: `${MODULES_BASE}?action=progress-list`,
        method: 'get',
        params: filters,
      },
      {
        dedupeKey: `modules:progress-list:${JSON.stringify(filters)}`,
        cacheKey: `modules:progress-list:${JSON.stringify(filters)}`,
        cacheTtlMs: 15000,
      },
    );
  },
};

export default ModuleService;
