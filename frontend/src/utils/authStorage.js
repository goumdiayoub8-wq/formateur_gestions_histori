const USER_KEY = 'user';
const TOKEN_KEY = 'auth_token';
const LOGIN_PREFERENCES_KEY = 'login_preferences';

function readJson(key) {
  try {
    const value = localStorage.getItem(key);
    if (!value || value === 'undefined') {
      localStorage.removeItem(key);
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    localStorage.removeItem(key);
    return null;
  }
}

export function getStoredUser() {
  return readJson(USER_KEY);
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch (error) {
    return '';
  }
}

export function persistAuthSnapshot({ user = null, token = '' }) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    // Ignore storage cleanup failures.
  }
}

export function getLoginPreferences() {
  return readJson(LOGIN_PREFERENCES_KEY) || { rememberMe: false, email: '', role: 'administration' };
}

export function persistLoginPreferences(preferences) {
  try {
    localStorage.setItem(LOGIN_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    localStorage.removeItem(LOGIN_PREFERENCES_KEY);
  }
}

export function clearLoginPreferences() {
  try {
    localStorage.removeItem(LOGIN_PREFERENCES_KEY);
  } catch (error) {
    // Ignore storage cleanup failures.
  }
}
