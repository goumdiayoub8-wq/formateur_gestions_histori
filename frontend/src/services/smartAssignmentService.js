import { apiRequest } from './api';

const SmartAssignmentService = {
  getSuggestions(moduleId) {
    return apiRequest({
      url: '/suggestions',
      method: 'get',
      params: { module_id: moduleId },
    });
  },

  assign(payload) {
    return apiRequest({
      url: '/assign',
      method: 'post',
      data: payload,
    });
  },
};

export default SmartAssignmentService;
