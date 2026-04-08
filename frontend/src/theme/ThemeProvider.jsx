import React, { createContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AuthService from '../services/authService';
import { updateCurrentUser } from '../store/slices/authSlice';
import {
  THEMES,
  applyThemeToDocument,
  getBootstrapTheme,
  getSystemTheme,
  isTheme,
  persistGuestTheme,
  readStoredTheme,
} from './theme';

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [theme, setThemeState] = useState(getBootstrapTheme);
  const [isSaving, setIsSaving] = useState(false);
  const lastSyncedThemeRef = useRef(null);
  const pendingThemeRef = useRef(null);
  const animateNextThemeSwitchRef = useRef(false);
  const previousUserRef = useRef(user);

  useLayoutEffect(() => {
    const hadUser = Boolean(previousUserRef.current);
    const hasUser = Boolean(user);
    const storedTheme = readStoredTheme();
    const backendTheme = isTheme(user?.theme_preference) ? user.theme_preference : null;
    const preferredTheme = storedTheme || backendTheme;

    if (backendTheme && backendTheme === theme && pendingThemeRef.current === theme) {
      pendingThemeRef.current = null;
      lastSyncedThemeRef.current = theme;
    }

    if (preferredTheme && preferredTheme !== theme && pendingThemeRef.current !== theme) {
      lastSyncedThemeRef.current = backendTheme || preferredTheme;
      previousUserRef.current = user;
      setThemeState(preferredTheme);
      return;
    }

    if (!hasUser && hadUser) {
      lastSyncedThemeRef.current = null;
      pendingThemeRef.current = null;
      const fallbackTheme = storedTheme || getSystemTheme();
      if (fallbackTheme !== theme) {
        previousUserRef.current = user;
        setThemeState(fallbackTheme);
        return;
      }
    }

    applyThemeToDocument(theme, {
      withEffect: animateNextThemeSwitchRef.current,
    });
    animateNextThemeSwitchRef.current = false;

    if (!hasUser) {
      pendingThemeRef.current = null;
    }

    previousUserRef.current = user;
  }, [theme, user]);

  useEffect(() => {
    persistGuestTheme(theme);
  }, [theme]);

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
        pendingThemeRef.current = null;
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
    if (!isTheme(nextTheme) || nextTheme === theme) {
      return;
    }

    pendingThemeRef.current = nextTheme;
    setThemeState(nextTheme);
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
