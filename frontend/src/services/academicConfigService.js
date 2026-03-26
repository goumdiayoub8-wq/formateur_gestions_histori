import { apiRequest, invalidateApiCache } from './api';

const BASE = '/academic-config';

const AcademicConfigService = {
  getConfig() {
    return apiRequest(
      {
        url: BASE,
        method: 'get',
      },
      {
        dedupeKey: 'academic-config:current',
        cacheKey: 'academic-config:current',
        cacheTtlMs: 300000,
      },
    );
  },

  saveConfig(payload) {
    return apiRequest({
      url: BASE,
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('academic-config:');
      invalidateApiCache('planning:');
      invalidateApiCache('dashboard:');
      return response;
    });
  },
};

export default AcademicConfigService;
