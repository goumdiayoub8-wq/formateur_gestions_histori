import { apiRequest } from './api';

const AFFECTATIONS_BASE = '/affectations';

const AffectationService = {
  list(filters = {}) {
    return apiRequest(
      {
        url: AFFECTATIONS_BASE,
        method: 'get',
        params: filters,
      },
      {
        dedupeKey: `affectations:list:${JSON.stringify(filters)}`,
      },
    );
  },

  create(payload) {
    return apiRequest({
      url: AFFECTATIONS_BASE,
      method: 'post',
      data: payload,
    });
  },

  remove(id) {
    return apiRequest(
      {
        url: `${AFFECTATIONS_BASE}/${id}`,
        method: 'delete',
      },
      { raw: true },
    );
  },
};

export default AffectationService;
