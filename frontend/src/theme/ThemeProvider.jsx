import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AuthService from '../services/authService';
import { updateCurrentUser } from '../store/slices/authSlice';
import { THEMES, applyThemeToDocument, getSystemTheme, isTheme, persistTheme, readStoredTheme } from './theme';

export const ThemeContext = createContext(null);

function getInitialTheme() {
  const storedTheme = readStoredTheme();
  return storedTheme || getSystemTheme();
}

export function ThemeProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [theme, setThemeState] = useState(getInitialTheme);
  const [hasStoredTheme, setHasStoredTheme] = useState(() => readStoredTheme() !== null);
  const [isSaving, setIsSaving] = useState(false);
  const lastSyncedThemeRef = useRef(null);
  const animateNextThemeSwitchRef = useRef(false);

  useEffect(() => {
    applyThemeToDocument(theme, {
      withEffect: animateNextThemeSwitchRef.current,
    });
    animateNextThemeSwitchRef.current = false;
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function' || hasStoredTheme) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      setThemeState(event.matches ? THEMES.DARK : THEMES.LIGHT);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [hasStoredTheme]);

  useEffect(() => {
    if (!user) {
      lastSyncedThemeRef.current = null;
      return;
    }

    const backendTheme = isTheme(user.theme_preference) ? user.theme_preference : null;
    if (!hasStoredTheme && backendTheme && backendTheme !== theme) {
      setThemeState(backendTheme);
      setHasStoredTheme(true);
      lastSyncedThemeRef.current = backendTheme;
      return;
    }

    if (backendTheme) {
      lastSyncedThemeRef.current = backendTheme;
    }
  }, [hasStoredTheme, theme, user]);

  useEffect(() => {
    if (!user || !isTheme(theme)) {
      return;
    }

    const backendTheme = isTheme(user.theme_preference) ? user.theme_preference : null;
    if (backendTheme === theme || lastSyncedThemeRef.current === theme) {
      return;
    }

    let active = true;

    const syncTheme = async () => {
      setIsSaving(true);

      try {
        const payload = await AuthService.updateThemePreference(theme);
        if (!active) {
          return;
        }

        lastSyncedThemeRef.current = theme;
        if (payload?.user) {
          dispatch(updateCurrentUser(payload.user));
        }
      } catch (error) {
        if (active) {
          lastSyncedThemeRef.current = backendTheme;
        }
      } finally {
        if (active) {
          setIsSaving(false);
        }
      }
    };

    syncTheme();

    return () => {
      active = false;
    };
  }, [dispatch, theme, user]);

  const setTheme = (nextTheme) => {
    if (!isTheme(nextTheme)) {
      return;
    }

    setThemeState(nextTheme);
    setHasStoredTheme(true);
  };

  const toggleTheme = () => {
    animateNextThemeSwitchRef.current = true;
    setTheme(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  };

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === THEMES.DARK,
      isSaving,
      setTheme,
      toggleTheme,
    }),
    [isSaving, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export default ThemeProvider;
