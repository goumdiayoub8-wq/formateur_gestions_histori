import { apiRequest, invalidateApiCache } from './api';

const QuestionnaireService = {
  getEvaluationForm(formateurId = null) {
    return apiRequest({
      url: '/questionnaire',
      method: 'get',
      params: formateurId ? { formateur_id: formateurId } : undefined,
    });
  },

  submitEvaluationForm(payload) {
    return apiRequest({
      url: '/questionnaire/submit',
      method: 'post',
      data: payload,
    }).then((response) => {
      invalidateApiCache('dashboard:');
      return response;
    });
  },

  getEvaluationScore(formateurId = null) {
    return apiRequest({
      url: '/questionnaire/score',
      method: 'get',
      params: formateurId ? { formateur_id: formateurId } : undefined,
    });
  },
};

export default QuestionnaireService;
