import { apiRequest, invalidateApiCache } from './api';

const FORMATEURS_BASE = '/formateurs';
const FORMATEUR_BASE = '/formateur';

const FormateurService = {
  list() {
    return apiRequest(
      {
        url: FORMATEURS_BASE,
        method: 'get',
      },
      {
        dedupeKey: 'formateurs:list',
        cacheKey: 'formateurs:list',
        cacheTtlMs: 30000,
      },
    );
  },

  listPaginated({ page = 1, limit = 5, search = '' } = {}) {
    const normalizedSearch = search.trim();

    return apiRequest(
      {
        url: FORMATEURS_BASE,
        method: 'get',
        params: {
          page,
          limit,
          ...(normalizedSearch ? { search: normalizedSearch } : {}),
        },
      },
      {
        raw: true,
        dedupeKey: `formateurs:paginated:${page}:${limit}:${normalizedSearch}`,
        cacheKey: `formateurs:paginated:${page}:${limit}:${normalizedSearch}`,
        cacheTtlMs: 10000,
      },
    );
  },

  create(payload) {
    return apiRequest({
      url: FORMATEURS_BASE,
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('formateurs:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('planning:');
      return response;
    });
  },

  update(id, payload) {
    return apiRequest({
      url: `${FORMATEURS_BASE}/${id}`,
      method: 'put',
      data: payload,
    }).then((response) => {
      invalidateApiCache('formateurs:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('planning:');
      return response;
    });
  },

  remove(id) {
    return apiRequest(
      {
        url: `${FORMATEURS_BASE}/${id}`,
        method: 'delete',
      },
      { raw: true },
    ).then((response) => {
      invalidateApiCache('formateurs:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('planning:');
      return response;
    });
  },

  getNotifications() {
    return apiRequest(
      {
        url: `${FORMATEUR_BASE}?action=notifications`,
        method: 'get',
      },
      {
        dedupeKey: 'formateur:notifications',
        cacheKey: 'formateur:notifications',
        cacheTtlMs: 15000,
      },
    );
  },

  getDemandesOverview() {
    return apiRequest(
      {
        url: `${FORMATEUR_BASE}?action=demandes`,
        method: 'get',
      },
      {
        dedupeKey: 'formateur:demandes-overview',
        cacheKey: 'formateur:demandes-overview',
        cacheTtlMs: 15000,
      },
    );
  },

  getModulePreferences() {
    return apiRequest(
      {
        url: `${FORMATEUR_BASE}?action=module-preferences`,
        method: 'get',
      },
      {
        dedupeKey: 'formateur:module-preferences',
        cacheKey: 'formateur:module-preferences',
        cacheTtlMs: 15000,
      },
    );
  },

  submitModulePreferences(module_ids) {
    return apiRequest({
      url: `${FORMATEUR_BASE}?action=module-preferences`,
      method: 'post',
      data: { module_ids },
    }).then((response) => {
      invalidateApiCache('formateur:module-preferences');
      invalidateApiCache('formateur:notifications');
      invalidateApiCache('dashboard:');
      invalidateApiCache('formateurs:');
      return response;
    });
  },

  getModulePreferencesByTrainer(id) {
    return apiRequest(
      {
        url: `${FORMATEURS_BASE}/${id}/module-preferences`,
        method: 'get',
      },
      {
        dedupeKey: `formateurs:module-preferences:${id}`,
        cacheKey: `formateurs:module-preferences:${id}`,
        cacheTtlMs: 15000,
      },
    );
  },

  respondModulePreferences(id, payload) {
    return apiRequest({
      url: `${FORMATEURS_BASE}/${id}/module-preferences`,
      method: 'patch',
      data: payload,
    }).then((response) => {
      invalidateApiCache(`formateurs:module-preferences:${id}`);
      invalidateApiCache('formateur:module-preferences');
      invalidateApiCache('formateur:notifications');
      invalidateApiCache('formateurs:');
      return response;
    });
  },

  createDemande(payload) {
    return apiRequest({
      url: `${FORMATEUR_BASE}?action=demandes`,
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('formateur:demandes-overview');
      invalidateApiCache('formateur:notifications');
      invalidateApiCache('dashboard:trainer-overview');
      return response;
    });
  },
};

export default FormateurService;
