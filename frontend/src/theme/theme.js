export const THEME_STORAGE_KEY = 'theme';

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

export function persistTheme(theme) {
  if (typeof window === 'undefined' || !isTheme(theme)) {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Ignore storage write failures.
  }
}

export function applyThemeToDocument(theme) {
  if (typeof document === 'undefined' || !isTheme(theme)) {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === THEMES.DARK);
  root.style.colorScheme = theme;
}
