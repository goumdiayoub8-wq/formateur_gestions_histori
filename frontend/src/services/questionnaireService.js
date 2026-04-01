import { apiRequest, invalidateApiCache } from './api';

const QuestionnaireService = {
  getEvaluationForm(options = {}) {
    const { formateurId = null, token = '' } = options;

    return apiRequest({
      url: '/questionnaire',
      method: 'get',
      params: {
        ...(formateurId ? { formateur_id: formateurId } : {}),
        ...(token ? { token } : {}),
      },
    });
  },

  submitEvaluationForm(payload, options = {}) {
    const { token = '' } = options;

    return apiRequest({
      url: '/questionnaire/submit',
      method: 'post',
      data: payload,
      params: token ? { token } : undefined,
    }).then((response) => {
      invalidateApiCache('dashboard:');
      return response;
    });
  },

  getEvaluationScore(options = {}) {
    const { formateurId = null, token = '' } = options;

    return apiRequest({
      url: '/questionnaire/score',
      method: 'get',
      params: {
        ...(formateurId ? { formateur_id: formateurId } : {}),
        ...(token ? { token } : {}),
      },
    });
  },
};

export default QuestionnaireService;
