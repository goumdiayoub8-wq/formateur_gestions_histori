import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStoredUser } = vi.hoisted(() => ({
  getStoredUser: vi.fn(),
}));

vi.mock('../../../frontend/src/utils/authStorage.js', () => ({
  getStoredUser,
}));

import {
  THEMES,
  THEME_STORAGE_KEY,
  THEME_SWITCH_CLASS,
  applyThemeToDocument,
  getBootstrapTheme,
  getSystemTheme,
  isTheme,
  persistGuestTheme,
  readStoredTheme,
  readStoredUserTheme,
} from '../../../frontend/src/theme/theme.js';

describe('theme utilities', () => {
  beforeEach(() => {
    getStoredUser.mockReset();
    getStoredUser.mockReturnValue(null);
    window.localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
    document.head.innerHTML = '<meta name="theme-color" content="#f5f7fb">';
  });

  it('validates theme values and persists guest theme', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('sepia')).toBe(false);

    persistGuestTheme(THEMES.DARK);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('reads stored guest and user themes with the correct precedence', () => {
    getStoredUser.mockReturnValue({ theme_preference: 'dark' });
    expect(readStoredUserTheme()).toBe('dark');

    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(readStoredTheme()).toBe('light');
    expect(getBootstrapTheme()).toBe('light');

    window.localStorage.removeItem(THEME_STORAGE_KEY);
    expect(getBootstrapTheme()).toBe('dark');
  });

  it('falls back to the system theme when no stored preference exists', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMedia,
    });

    expect(getSystemTheme()).toBe('dark');
    expect(getBootstrapTheme()).toBe('dark');
  });

  it('applies the theme to the document root and updates meta theme-color', () => {
    vi.useFakeTimers();

    applyThemeToDocument(THEMES.DARK, { withEffect: true });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains(THEME_SWITCH_CLASS)).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#0f172a');

    vi.runAllTimers();
    expect(document.documentElement.classList.contains(THEME_SWITCH_CLASS)).toBe(false);

    vi.useRealTimers();
  });

  it('ignores invalid persisted theme values gracefully', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'broken');
    expect(readStoredTheme()).toBeNull();
  });
});
