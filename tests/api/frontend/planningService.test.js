import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiModuleMock } = vi.hoisted(() => ({
  apiModuleMock: {
    apiRequest: vi.fn(),
    invalidateApiCache: vi.fn(),
  },
}));

vi.mock('../../../frontend/src/services/api.js', () => apiModuleMock);

import PlanningService from '../../../frontend/src/services/planningService.js';

describe('PlanningService', () => {
  beforeEach(() => {
    apiModuleMock.apiRequest.mockReset();
    apiModuleMock.invalidateApiCache.mockReset();
  });

  it('trims search filters before requesting paginated planning data', async () => {
    apiModuleMock.apiRequest.mockResolvedValueOnce({ data: [], total_items: 0 });

    await PlanningService.listPaginated({
      page: 2,
      limit: 10,
      search: '  EGT  ',
    });

    expect(apiModuleMock.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/planning',
        method: 'get',
        params: {
          page: 2,
          limit: 10,
          search: 'EGT',
        },
      }),
      expect.objectContaining({
        raw: true,
      }),
    );
  });

  it('does not send empty search terms for visibility pagination', async () => {
    apiModuleMock.apiRequest.mockResolvedValueOnce({ data: [] });

    await PlanningService.getTrainerVisibilityPage({
      week: 7,
      formateurId: 12,
      page: 3,
      limit: 8,
    });

    expect(apiModuleMock.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/planning?action=visibility',
        method: 'get',
        params: {
          week: 7,
          formateur_id: 12,
          page: 3,
          limit: 8,
        },
      }),
      expect.objectContaining({
        raw: true,
      }),
    );
  });

  it('requests Mes Modules without raw mode so the page receives the modules array directly', async () => {
    apiModuleMock.apiRequest.mockResolvedValueOnce([]);

    await PlanningService.getMesModules({
      week: 9,
      page: 2,
      limit: 6,
    });

    expect(apiModuleMock.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/planning?action=mes-modules',
        method: 'get',
        params: {
          week: 9,
          page: 2,
          limit: 6,
        },
      }),
      expect.not.objectContaining({
        raw: true,
      }),
    );
  });

  it('invalidates related caches after write operations', async () => {
    apiModuleMock.apiRequest.mockResolvedValue({ status: 'success' });

    await PlanningService.savePlanningSession({ module_id: 4 });
    await PlanningService.deletePlanningSession(8);
    await PlanningService.completePlanningSession(11);
    await PlanningService.bulkUpdateValidationStatus([1, 2], 'approved', 'ok');

    expect(apiModuleMock.invalidateApiCache).toHaveBeenCalledWith('planning:');
    expect(apiModuleMock.invalidateApiCache).toHaveBeenCalledWith('dashboard:');
    expect(apiModuleMock.invalidateApiCache).toHaveBeenCalledWith('formateur:notifications');
  });
});
