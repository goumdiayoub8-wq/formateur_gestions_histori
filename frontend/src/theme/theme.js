import { getStoredUser } from '../utils/authStorage';

export const THEME_STORAGE_KEY = 'theme';
export const THEME_SWITCH_CLASS = 'theme-switching';

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

export function isTheme(value) {
  return value === THEMES.LIGHT || value === THEMES.DARK;
}

export function getSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return THEMES.LIGHT;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
}

export function readStoredTheme() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(theme) ? theme : null;
  } catch (error) {
    return null;
  }
}

export function persistGuestTheme(theme) {
  if (typeof window === 'undefined' || !isTheme(theme)) {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
  }
}

export function clearStoredTheme() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch (error) {
  }
}

export function readStoredUserTheme() {
  const user = getStoredUser();
  return isTheme(user?.theme_preference) ? user.theme_preference : null;
}

export function getBootstrapTheme() {
  return readStoredTheme() || readStoredUserTheme() || getSystemTheme();
}

export function applyThemeToDocument(theme, options = {}) {
  if (typeof document === 'undefined' || !isTheme(theme)) {
    return;
  }

  const root = document.documentElement;
  const { withEffect = false } = options;

  if (withEffect) {
    root.classList.add(THEME_SWITCH_CLASS);
  }

  root.classList.toggle('dark', theme === THEMES.DARK);
  root.style.colorScheme = theme;

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', theme === THEMES.DARK ? '#0f172a' : '#f5f7fb');
  }

  if (withEffect && typeof window !== 'undefined') {
    window.setTimeout(() => {
      root.classList.remove(THEME_SWITCH_CLASS);
    }, 180);
  }
}
