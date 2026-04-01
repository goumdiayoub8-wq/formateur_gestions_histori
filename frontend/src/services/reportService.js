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

  generateTrainerPerformance(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-trainer-performance`,
      method: 'post',
      data: { format },
    });
  },

  generateTeachingHours(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-teaching-hours`,
      method: 'post',
      data: { format },
    });
  },

  generateQuestionnaireResults(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-questionnaire-results`,
      method: 'post',
      data: { format },
    });
  },

  generateGlobalPlatformSummary(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-global-platform-summary`,
      method: 'post',
      data: { format },
    });
  },

  generateHoursByDepartment(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-hours-by-department`,
      method: 'post',
      data: { format },
    });
  },

  generateTopTrainers(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-top-trainers`,
      method: 'post',
      data: { format },
    });
  },

  generateModuleSuccessRates(format) {
    return apiRequest({
      url: `${REPORTS_BASE}?action=generate-module-success-rates`,
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
