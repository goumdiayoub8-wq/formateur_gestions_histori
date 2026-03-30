import api, { apiRequest, buildApiUrl } from './api';

const REPORTS_BASE = '/reports';

const ReportService = {
  getRecent() {
    return apiRequest({
      url: `${REPORTS_BASE}?action=recent`,
      method: 'get',
    });
  },

  generateWorkload(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-workload`,
      method: 'post',
      data: { format },
    });
  },

  generateModuleProgress(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-module-progress`,
      method: 'post',
      data: { format },
    });
  },

  generateAssignmentCoverage(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-assignment-coverage`,
      method: 'post',
      data: { format },
    });
  },

  generateValidationStatus(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-validation-status`,
      method: 'post',
      data: { format },
    });
  },

  async download(id) {
    const response = await api.get(buildApiUrl(`${REPORTS_BASE}?action=download`), {
      params: { id },
      responseType: 'blob',
    });

    return response.data;
  },
};

export default ReportService;
