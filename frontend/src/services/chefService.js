import { apiRequest, invalidateApiCache } from './api';

const ChefService = {
  getNotifications() {
    return apiRequest(
      {
        url: '/chef?action=notifications',
        method: 'get',
      },
      {
        dedupeKey: 'chef:notifications',
        cacheKey: 'chef:notifications',
        cacheTtlMs: 15000,
        raw: true,
      },
    );
  },

  reviewPlanningChange(payload) {
    return apiRequest({
      url: '/planning?action=entry-status',
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('chef:notifications');
      invalidateApiCache('planning:');
      invalidateApiCache('dashboard:');
      return response;
    });
  },
};

export default ChefService;
