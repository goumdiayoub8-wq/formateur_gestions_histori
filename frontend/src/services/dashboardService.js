import { apiRequest } from './api';

const DASHBOARD_BASE = '/dashboard';

const DashboardService = {
  getStats() {
    return apiRequest(
      {
        url: `${DASHBOARD_BASE}?action=stats`,
        method: 'get',
      },
      { dedupeKey: 'dashboard:stats', cacheKey: 'dashboard:stats', cacheTtlMs: 15000 },
    );
  },

  getCharts() {
    return apiRequest(
      {
        url: `${DASHBOARD_BASE}?action=charts`,
        method: 'get',
      },
      { dedupeKey: 'dashboard:charts', cacheKey: 'dashboard:charts', cacheTtlMs: 15000 },
    );
  },

  getDirectorOverview() {
    return apiRequest(
      {
        url: `${DASHBOARD_BASE}?action=director-overview`,
        method: 'get',
      },
      {
        dedupeKey: 'dashboard:director-overview',
        cacheKey: 'dashboard:director-overview',
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
        dedupeKey: `dashboard:trainer-overview:${week ?? 'current'}`,
        cacheKey: `dashboard:trainer-overview:${week ?? 'current'}`,
        cacheTtlMs: 15000,
      },
    );
  },
};

export default DashboardService;
