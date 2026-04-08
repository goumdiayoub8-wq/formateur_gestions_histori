import React from 'react';
import ProtectedRoute from '../../../frontend/src/components/ProtectedRoute.jsx';
import { createTestStore, renderWithProviders } from '../../../frontend/src/test/renderWithProviders.jsx';
import { Route, Routes, screen } from '../../../frontend/src/test/testingModules.js';

const e = React.createElement;

describe('ProtectedRoute', () => {
  it('shows a blocking spinner while auth is still loading', () => {
    const store = createTestStore({
      auth: {
        initialized: false,
        loading: true,
      },
    });

    const { container } = renderWithProviders(
      e(
        Routes,
        null,
        e(
          Route,
          { element: e(ProtectedRoute, { allowedRole: 2 }) },
          e(Route, { path: '/chef', element: e('div', null, 'Chef dashboard') }),
        ),
      ),
      {
        route: '/chef',
        store,
      },
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects anonymous visitors to the login page', async () => {
    const store = createTestStore({
      auth: {
        user: null,
        initialized: true,
        loading: false,
      },
    });

    renderWithProviders(
      e(
        Routes,
        null,
        e(Route, { path: '/', element: e('div', null, 'Login page') }),
        e(
          Route,
          { element: e(ProtectedRoute, { allowedRole: 2 }) },
          e(Route, { path: '/chef', element: e('div', null, 'Chef dashboard') }),
        ),
      ),
      {
        route: '/chef',
        store,
      },
    );

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('redirects users to their own dashboard when the requested role does not match', async () => {
    const store = createTestStore({
      auth: {
        user: { id: 1, role_id: 1 },
        initialized: true,
        loading: false,
      },
    });

    renderWithProviders(
      e(
        Routes,
        null,
        e(Route, { path: '/directeur', element: e('div', null, 'Directeur dashboard') }),
        e(
          Route,
          { element: e(ProtectedRoute, { allowedRole: 2 }) },
          e(Route, { path: '/chef', element: e('div', null, 'Chef dashboard') }),
        ),
      ),
      {
        route: '/chef',
        store,
      },
    );

    expect(await screen.findByText('Directeur dashboard')).toBeInTheDocument();
  });

  it('renders the protected outlet when the user has the correct role', async () => {
    const store = createTestStore({
      auth: {
        user: { id: 2, role_id: 2 },
        initialized: true,
        loading: false,
      },
    });

    renderWithProviders(
      e(
        Routes,
        null,
        e(
          Route,
          { element: e(ProtectedRoute, { allowedRole: 2 }) },
          e(Route, { path: '/chef', element: e('div', null, 'Chef dashboard') }),
        ),
      ),
      {
        route: '/chef',
        store,
      },
    );

    expect(await screen.findByText('Chef dashboard')).toBeInTheDocument();
  });
});
