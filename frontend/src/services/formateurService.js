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

  get(id) {
    return apiRequest({
      url: `${FORMATEURS_BASE}/${id}`,
      method: 'get',
    });
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

  getHours(id) {
    return apiRequest({
      url: `${FORMATEURS_BASE}/${id}/hours`,
      method: 'get',
    });
  },

  getProfil() {
    return apiRequest(
      {
        url: `${FORMATEUR_BASE}?action=profil`,
        method: 'get',
      },
      {
        dedupeKey: 'formateur:profil',
        cacheKey: 'formateur:profil',
        cacheTtlMs: 30000,
      },
    );
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

  createDemande(payload) {
    return apiRequest({
      url: `${FORMATEUR_BASE}?action=demandes`,
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('formateur:demandes');
      invalidateApiCache('formateur:notifications');
      invalidateApiCache('dashboard:trainer-overview');
      return response;
    });
  },
};

export default FormateurService;
