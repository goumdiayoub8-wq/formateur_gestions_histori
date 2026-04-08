import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import { ThemeContext } from '../theme/ThemeProvider';

export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        loading: false,
        error: null,
        initialized: true,
        ...preloadedState.auth,
      },
    },
  });
}

export function renderWithProviders(
  ui,
  {
    route = '/',
    store = createTestStore(),
    themeValue = {
      theme: 'light',
      isDark: false,
      isSaving: false,
      setTheme: () => {},
      toggleTheme: () => {},
    },
  } = {},
) {
  window.history.pushState({}, 'Test page', route);

  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeContext.Provider value={themeValue}>
          <MemoryRouter
            initialEntries={[route]}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            {ui}
          </MemoryRouter>
        </ThemeContext.Provider>
      </Provider>,
    ),
  };
}
