import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '../../../frontend/src/test/testingModules.js';

const { authServiceMock, authStorageMock } = vi.hoisted(() => ({
  authServiceMock: {
    login: vi.fn(),
    check: vi.fn(),
    logout: vi.fn(),
  },
  authStorageMock: {
    clearStoredAuth: vi.fn(),
    getStoredToken: vi.fn(() => ''),
    getStoredUser: vi.fn(() => null),
    persistAuthSnapshot: vi.fn(),
  },
}));

vi.mock('../../../frontend/src/services/authService.js', () => ({
  default: authServiceMock,
}));

vi.mock('../../../frontend/src/utils/authStorage.js', () => authStorageMock);

import authReducer, { checkAuth, login, logoutUser } from '../../../frontend/src/store/slices/authSlice.js';

function createStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
}

describe('authSlice', () => {
  beforeEach(() => {
    Object.values(authServiceMock).forEach((mock) => mock.mockReset());
    Object.values(authStorageMock).forEach((mock) => {
      if (typeof mock.mockReset === 'function') {
        mock.mockReset();
      }
    });

    authStorageMock.getStoredToken.mockReturnValue('');
    authStorageMock.getStoredUser.mockReturnValue(null);
  });

  it('stores the authenticated user after a successful login', async () => {
    const store = createStore();
    authServiceMock.login.mockResolvedValueOnce({
      user: { id: 7, role_id: 2, email: 'chef@example.com' },
      token: 'jwt-token',
    });

    const result = await store.dispatch(login({
      email: 'chef@example.com',
      password: 'secret123',
      expectedRole: 2,
    }));

    expect(login.fulfilled.match(result)).toBe(true);
    expect(store.getState().auth.user).toMatchObject({ id: 7, role_id: 2 });
    expect(authStorageMock.persistAuthSnapshot).toHaveBeenCalledWith({
      user: { id: 7, role_id: 2, email: 'chef@example.com' },
      token: 'jwt-token',
    });
  });

  it('rejects logins when the selected role does not match the account', async () => {
    const store = createStore();
    authServiceMock.login.mockResolvedValueOnce({
      user: { id: 3, role_id: 1, email: 'directeur@example.com' },
      token: 'jwt-token',
    });

    const result = await store.dispatch(login({
      email: 'directeur@example.com',
      password: 'secret123',
      expectedRole: 2,
    }));

    expect(login.rejected.match(result)).toBe(true);
    expect(result.payload).toBe('Le role selectionne ne correspond pas a ce compte.');
    expect(store.getState().auth.user).toBeNull();
    expect(authStorageMock.clearStoredAuth).toHaveBeenCalled();
  });

  it('short-circuits auth checks when no local credentials exist', async () => {
    const store = createStore();

    const result = await store.dispatch(checkAuth());

    expect(checkAuth.fulfilled.match(result)).toBe(true);
    expect(result.payload).toEqual({ user: null, token: '' });
    expect(authServiceMock.check).not.toHaveBeenCalled();
  });

  it('clears stale auth state when the backend session check fails', async () => {
    const store = createStore();
    authStorageMock.getStoredToken.mockReturnValue('stale-token');
    authStorageMock.getStoredUser.mockReturnValue({ id: 4, role_id: 3 });
    authServiceMock.check.mockRejectedValueOnce(new Error('Session invalide.'));

    const result = await store.dispatch(checkAuth());

    expect(checkAuth.rejected.match(result)).toBe(true);
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.initialized).toBe(true);
    expect(authStorageMock.clearStoredAuth).toHaveBeenCalled();
  });

  it('clears local auth state even when logout fails on the API', async () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: { id: 9, role_id: 2 },
          loading: false,
          error: null,
          initialized: true,
        },
      },
    });

    authServiceMock.logout.mockRejectedValueOnce(new Error('Network error'));

    const result = await store.dispatch(logoutUser());

    expect(logoutUser.rejected.match(result)).toBe(true);
    expect(store.getState().auth.user).toBeNull();
    expect(authStorageMock.clearStoredAuth).toHaveBeenCalled();
  });
});
