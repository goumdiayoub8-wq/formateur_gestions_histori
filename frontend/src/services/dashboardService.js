import { apiRequest } from './api';

const DASHBOARD_BASE = '/dashboard';
const DASHBOARD_CACHE_VERSION = 'v2';

const DashboardService = {
  getStats() {
    return apiRequest(
      {
        url: `${DASHBOARD_BASE}?action=stats`,
        method: 'get',
      },
      {
        dedupeKey: `dashboard:stats:${DASHBOARD_CACHE_VERSION}`,
        cacheKey: `dashboard:stats:${DASHBOARD_CACHE_VERSION}`,
        cacheTtlMs: 15000,
      },
    );
  },

  getDirectorOverview() {
    return apiRequest(
      {
        url: `${DASHBOARD_BASE}?action=director-overview`,
        method: 'get',
      },
      {
        dedupeKey: `dashboard:director-overview:${DASHBOARD_CACHE_VERSION}`,
        cacheKey: `dashboard:director-overview:${DASHBOARD_CACHE_VERSION}`,
        cacheTtlMs: 15000,
      },
    );
  },

  getTrainerOverview(week) {
    return apiRequest(
      {
        url: DASHBOARD_BASE,
        method: 'get',
        params: typeof week === 'number' ? { week } : undefined,
      },
      {
        dedupeKey: `dashboard:trainer-overview:${DASHBOARD_CACHE_VERSION}:${week ?? 'current'}`,
        cacheKey: `dashboard:trainer-overview:${DASHBOARD_CACHE_VERSION}:${week ?? 'current'}`,
        cacheTtlMs: 15000,
      },
    );
  },
};

export default DashboardService;
