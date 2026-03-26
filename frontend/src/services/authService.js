import { apiRequest } from './api';

const AUTH_BASE = '/auth';

const AuthService = {
  login(email, password) {
    return apiRequest(
      {
        url: `${AUTH_BASE}?action=login`,
        method: 'post',
        data: { email, password },
      },
      { raw: true },
    );
  },

  register(payload) {
    return apiRequest(
      {
        url: `${AUTH_BASE}?action=register`,
        method: 'post',
        data: payload,
      },
      { raw: true },
    );
  },

  forgotPassword(email) {
    return apiRequest(
      {
        url: `${AUTH_BASE}?action=forgot-password`,
        method: 'post',
        data: { email },
      },
      { raw: true },
    );
  },

  resetPassword(payload) {
    return apiRequest(
      {
        url: `${AUTH_BASE}?action=reset-password`,
        method: 'post',
        data: payload,
      },
      { raw: true },
    );
  },

  logout() {
    return apiRequest(
      {
        url: `${AUTH_BASE}?action=logout`,
        method: 'post',
        data: {},
      },
      { raw: true },
    );
  },

  check() {
    return apiRequest(
      {
        url: `${AUTH_BASE}?action=check`,
        method: 'get',
      },
      { raw: true, dedupeKey: 'auth:check' },
    );
  },

  updateProfile(payload) {
    return apiRequest(
      {
        url: `${AUTH_BASE}?action=update-profile`,
        method: 'put',
        data: payload,
      },
      { raw: true },
    );
  },

  updateThemePreference(theme) {
    return apiRequest(
      {
        url: `${AUTH_BASE}?action=theme`,
        method: 'patch',
        data: { theme },
      },
      { raw: true },
    );
  },
};

export default AuthService;
