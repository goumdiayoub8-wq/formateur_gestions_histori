import { apiRequest, invalidateApiCache } from './api';

function buildQuestionnaireRequestKey(prefix, formateurId, token) {
  const normalizedToken = `${token || ''}`.trim();
  const normalizedFormateurId = formateurId ? Number(formateurId) : 0;

  return `${prefix}:${normalizedFormateurId}:${normalizedToken}`;
}

const questionnaireService = {
  fetchQuestionnaire(options = {}) {
    const { formateurId = null, token = '' } = options;
    const requestKey = buildQuestionnaireRequestKey('questionnaire:form', formateurId, token);

    return apiRequest({
      url: '/questionnaire',
      method: 'get',
      params: {
        ...(formateurId ? { formateur_id: formateurId } : {}),
        ...(token ? { token } : {}),
      },
    }, {
      dedupeKey: requestKey,
      cacheKey: requestKey,
      cacheTtlMs: 10000,
    });
  },

  submitQuestionnaire(payload, options = {}) {
    const { token = '' } = options;
    const normalizedToken = `${token || ''}`.trim();

    return apiRequest({
      url: '/questionnaire/submit',
      method: 'post',
      data: payload,
      params: token ? { token } : undefined,
    }).then((response) => {
      invalidateApiCache('dashboard:');
      if (normalizedToken) {
        invalidateApiCache(`questionnaire:form:`);
        invalidateApiCache(`questionnaire:score:`);
        invalidateApiCache(normalizedToken);
      }
      return response;
    });
  },
};

export default questionnaireService;
