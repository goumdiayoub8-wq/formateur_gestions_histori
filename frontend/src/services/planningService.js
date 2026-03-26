import { apiRequest, invalidateApiCache } from './api';

const PLANNING_BASE = '/planning';

const PlanningService = {
  getWeeklyPlanning(week, formateurId = null) {
    const key = `planning:weekly:${week ?? 'current'}:${formateurId ?? 'all'}`;
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=weekly`,
        method: 'get',
        params: {
          ...(typeof week === 'number' ? { week } : {}),
          ...(formateurId ? { formateur_id: formateurId } : {}),
        },
      },
      { dedupeKey: key, cacheKey: key, cacheTtlMs: 15000 },
    );
  },

  getWeeklyStats(week, formateurId = null) {
    const key = `planning:stats:${week ?? 'current'}:${formateurId ?? 'all'}`;
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=stats`,
        method: 'get',
        params: {
          ...(typeof week === 'number' ? { week } : {}),
          ...(formateurId ? { formateur_id: formateurId } : {}),
        },
      },
      { dedupeKey: key, cacheKey: key, cacheTtlMs: 15000 },
    );
  },

  getTrainerVisibility(week, formateurId = null) {
    const key = `planning:visibility:${week ?? 'current'}:${formateurId ?? 'self'}`;
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=visibility`,
        method: 'get',
        params: {
          ...(typeof week === 'number' ? { week } : {}),
          ...(formateurId ? { formateur_id: formateurId } : {}),
        },
      },
      { dedupeKey: key, cacheKey: key, cacheTtlMs: 15000 },
    );
  },

  getTeamVisibility(week) {
    const key = `planning:team-visibility:${week ?? 'current'}`;
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=team-visibility`,
        method: 'get',
        params: typeof week === 'number' ? { week } : undefined,
      },
      { dedupeKey: key, cacheKey: key, cacheTtlMs: 15000 },
    );
  },

  getSessions(week, formateurId = null) {
    const key = `planning:sessions:${week ?? 'current'}:${formateurId ?? 'all'}`;
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=sessions`,
        method: 'get',
        params: {
          ...(typeof week === 'number' ? { week } : {}),
          ...(formateurId ? { formateur_id: formateurId } : {}),
        },
      },
      { dedupeKey: key, cacheKey: key, cacheTtlMs: 15000 },
    );
  },

  getSessionOptions(formateurId) {
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=session-options`,
        method: 'get',
        params: { formateur_id: formateurId },
      },
      {
        dedupeKey: `planning:session-options:${formateurId}`,
        cacheKey: `planning:session-options:${formateurId}`,
        cacheTtlMs: 30000,
      },
    );
  },

  savePlanningSession(payload) {
    return apiRequest({
      url: `${PLANNING_BASE}?action=entry`,
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('planning:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('formateur:notifications');
      return response;
    });
  },

  deletePlanningSession(id) {
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=delete-entry`,
        method: 'delete',
        data: { id, session: true },
      },
      { raw: true },
    ).then((response) => {
      invalidateApiCache('planning:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('formateur:notifications');
      return response;
    });
  },

  saveWeeklyEntry(payload) {
    return apiRequest({
      url: `${PLANNING_BASE}?action=entry`,
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('planning:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('formateur:notifications');
      return response;
    });
  },

  deleteWeeklyEntry(id) {
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=delete-entry`,
        method: 'delete',
        data: { id },
      },
      { raw: true },
    ).then((response) => {
      invalidateApiCache('planning:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('formateur:notifications');
      return response;
    });
  },

  getMesModules(week) {
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=mes-modules`,
        method: 'get',
        params: typeof week === 'number' ? { week } : undefined,
      },
      { dedupeKey: `planning:mes-modules:${week ?? 'current'}` },
    );
  },

  requestEntryDecision(payload) {
    return apiRequest({
      url: `${PLANNING_BASE}?action=entry-decision`,
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('planning:');
      invalidateApiCache('formateur:notifications');
      return response;
    });
  },

  getEntry(id) {
    return apiRequest({
      url: `${PLANNING_BASE}/${id}`,
      method: 'get',
    });
  },

  getValidationDashboard(filters = {}) {
    return apiRequest({
      url: `${PLANNING_BASE}?action=validation-dashboard`,
      method: 'get',
      params: filters,
    });
  },

  getValidationSummary() {
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=validation-summary`,
        method: 'get',
      },
      {
        dedupeKey: 'planning:validation-summary',
        cacheKey: 'planning:validation-summary',
        cacheTtlMs: 15000,
      },
    );
  },

  getValidationHistory(limit = 5) {
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=validation-history`,
        method: 'get',
        params: { limit },
      },
      {
        dedupeKey: `planning:validation-history:${limit}`,
        cacheKey: `planning:validation-history:${limit}`,
        cacheTtlMs: 15000,
      },
    );
  },

  getValidationQueue(filters = {}) {
    return apiRequest({
      url: `${PLANNING_BASE}?action=validation-queue`,
      method: 'get',
      params: filters,
    });
  },

  getValidationDetail(id) {
    return apiRequest({
      url: `${PLANNING_BASE}?action=validation-detail`,
      method: 'get',
      params: { id },
    });
  },

  updateValidationStatus(planningId, status, note = '') {
    return apiRequest({
      url: `${PLANNING_BASE}?action=validation-status`,
      method: 'post',
      data: {
        planning_id: planningId,
        status,
        note,
      },
    }).then((response) => {
      invalidateApiCache('planning:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('formateur:notifications');
      return response;
    });
  },

  bulkUpdateValidationStatus(ids, status, note = '') {
    return apiRequest({
      url: `${PLANNING_BASE}?action=validation-bulk`,
      method: 'post',
      data: {
        ids,
        status,
        note,
      },
    }).then((response) => {
      invalidateApiCache('planning:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('formateur:notifications');
      return response;
    });
  },
};

export default PlanningService;
