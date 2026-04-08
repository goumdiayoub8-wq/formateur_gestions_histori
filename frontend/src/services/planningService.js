import { apiRequest, invalidateApiCache } from './api';

const PLANNING_BASE = '/planning';

const PlanningService = {
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
        url: PLANNING_BASE,
        method: 'get',
        params,
      },
      {
        raw: true,
        dedupeKey: `planning:paginated:${JSON.stringify(params)}`,
        cacheKey: `planning:paginated:${JSON.stringify(params)}`,
        cacheTtlMs: 10000,
      },
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

  getTrainerVisibilityPage({ week, formateurId = null, page = 1, limit = 5 } = {}) {
    const params = {
      page,
      limit,
      ...(typeof week === 'number' ? { week } : {}),
      ...(formateurId ? { formateur_id: formateurId } : {}),
    };

    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=visibility`,
        method: 'get',
        params,
      },
      {
        raw: true,
        dedupeKey: `planning:visibility-page:${JSON.stringify(params)}`,
        cacheKey: `planning:visibility-page:${JSON.stringify(params)}`,
        cacheTtlMs: 10000,
      },
    );
  },

  getTeamVisibilityPage({ week, page = 1, limit = 5 } = {}) {
    const params = {
      page,
      limit,
      ...(typeof week === 'number' ? { week } : {}),
    };

    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=team-visibility`,
        method: 'get',
        params,
      },
      {
        raw: true,
        dedupeKey: `planning:team-visibility-page:${JSON.stringify(params)}`,
        cacheKey: `planning:team-visibility-page:${JSON.stringify(params)}`,
        cacheTtlMs: 10000,
      },
    );
  },

  getSessionsPage({ week, formateurId = null, page = 1, limit = 5 } = {}) {
    const params = {
      page,
      limit,
      ...(typeof week === 'number' ? { week } : {}),
      ...(formateurId ? { formateur_id: formateurId } : {}),
    };

    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=sessions`,
        method: 'get',
        params,
      },
      {
        raw: true,
        dedupeKey: `planning:sessions-page:${JSON.stringify(params)}`,
        cacheKey: `planning:sessions-page:${JSON.stringify(params)}`,
        cacheTtlMs: 10000,
      },
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
        method: 'post',
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

  completePlanningSession(id) {
    return apiRequest({
      url: `${PLANNING_BASE}?action=session-status`,
      method: 'post',
      data: { id, status: 'completed' },
    }).then((response) => {
      invalidateApiCache('planning:');
      invalidateApiCache('dashboard:');
      invalidateApiCache('formateur:notifications');
      return response;
    });
  },

  getMesModules({ week, page = 1, limit = 5 } = {}) {
    const key = `planning:mes-modules:${week ?? 'current'}:${page}:${limit}`;
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=mes-modules`,
        method: 'get',
        params: {
          page,
          limit,
          ...(typeof week === 'number' ? { week } : {}),
        },
      },
      { dedupeKey: key, cacheKey: key, cacheTtlMs: 15000 },
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

  getValidationHistoryPage({ page = 1, limit = 5 } = {}) {
    const params = { page, limit };

    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=validation-history`,
        method: 'get',
        params,
      },
      {
        raw: true,
        dedupeKey: `planning:validation-history-page:${page}:${limit}`,
        cacheKey: `planning:validation-history-page:${page}:${limit}`,
        cacheTtlMs: 15000,
      },
    );
  },

  getValidationQueuePage({ page = 1, limit = 5, ...filters } = {}) {
    const params = { page, limit, ...filters };

    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=validation-queue`,
        method: 'get',
        params,
      },
      {
        raw: true,
        dedupeKey: `planning:validation-queue-page:${JSON.stringify(params)}`,
        cacheKey: `planning:validation-queue-page:${JSON.stringify(params)}`,
        cacheTtlMs: 10000,
      },
    );
  },

  getValidationDetail(id) {
    return apiRequest(
      {
        url: `${PLANNING_BASE}?action=validation-detail`,
        method: 'get',
        params: { id },
      },
      {
        dedupeKey: `planning:validation-detail:${id}`,
        cacheKey: `planning:validation-detail:${id}`,
        cacheTtlMs: 10000,
      },
    );
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
