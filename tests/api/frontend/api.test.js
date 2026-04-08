import { beforeEach, describe, expect, it, vi } from 'vitest';

const { axiosCreateMock, httpClientMock, getStoredTokenMock } = vi.hoisted(() => {
  const httpClient = vi.fn();
  httpClient.interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };

  return {
    axiosCreateMock: vi.fn(() => httpClient),
    httpClientMock: httpClient,
    getStoredTokenMock: vi.fn(() => ''),
  };
});

vi.mock('../../../frontend/src/utils/authStorage.js', () => ({
  getStoredToken: getStoredTokenMock,
}));

describe('api service', () => {
  beforeEach(() => {
    httpClientMock.mockClear();
    axiosCreateMock.mockClear();
    getStoredTokenMock.mockClear();
    getStoredTokenMock.mockReturnValue('');
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.resetModules();
  });

  async function loadApiModule() {
    const axiosModule = await import('axios');
    vi.spyOn(axiosModule.default, 'create').mockImplementation(axiosCreateMock);
    return import('../../../frontend/src/services/api.js');
  }

  it('builds URLs relative to the /api base', async () => {
    const { buildApiUrl } = await loadApiModule();

    expect(buildApiUrl('/planning')).toBe('/api/planning');
    expect(buildApiUrl('modules')).toBe('/api/modules');
    expect(buildApiUrl('https://example.com/x')).toBe('https://example.com/x');
  });

  it('injects the Authorization header through the axios request interceptor', async () => {
    await loadApiModule();
    getStoredTokenMock.mockReturnValue('jwt-token');
    const interceptor = httpClientMock.interceptors.request.use.mock.calls[0]?.[0];
    expect(interceptor).toEqual(expect.any(Function));
    const requestConfig = interceptor({ headers: {} });

    expect(requestConfig.headers.Authorization).toBe('Bearer jwt-token');
  });

  it('dedupes concurrent requests with the same dedupe key', async () => {
    const { apiRequest } = await loadApiModule();
    let resolveRequest;
    httpClientMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = apiRequest(
      { url: '/modules', method: 'get' },
      { dedupeKey: 'modules:shared' },
    );
    const second = apiRequest(
      { url: '/modules', method: 'get' },
      { dedupeKey: 'modules:shared' },
    );

    expect(httpClientMock).toHaveBeenCalledTimes(1);

    resolveRequest({ data: { data: { ok: true } } });

    await expect(first).resolves.toEqual({ ok: true });
    await expect(second).resolves.toEqual({ ok: true });
  });

  it('caches successful responses and invalidates them on demand', async () => {
    const { apiRequest, invalidateApiCache } = await loadApiModule();
    httpClientMock.mockResolvedValueOnce({ data: { data: { page: 1 } } });

    const first = await apiRequest(
      { url: '/planning', method: 'get' },
      { dedupeKey: 'planning:cache', cacheTtlMs: 1000 },
    );
    const second = await apiRequest(
      { url: '/planning', method: 'get' },
      { dedupeKey: 'planning:cache', cacheTtlMs: 1000 },
    );

    expect(first).toEqual({ page: 1 });
    expect(second).toEqual({ page: 1 });
    expect(httpClientMock).toHaveBeenCalledTimes(1);

    invalidateApiCache('planning:cache');
    httpClientMock.mockResolvedValueOnce({ data: { data: { page: 2 } } });

    const third = await apiRequest(
      { url: '/planning', method: 'get' },
      { dedupeKey: 'planning:cache', cacheTtlMs: 1000 },
    );

    expect(third).toEqual({ page: 2 });
    expect(httpClientMock).toHaveBeenCalledTimes(2);
  });

  it('ignores corrupted sessionStorage cache entries and fetches fresh data', async () => {
    const { apiRequest } = await loadApiModule();
    window.sessionStorage.setItem('api-cache:corrupted::picked', '{broken json');
    httpClientMock.mockResolvedValueOnce({ data: { data: ['fresh'] } });

    const result = await apiRequest(
      { url: '/search', method: 'get' },
      { dedupeKey: 'corrupted', cacheKey: 'corrupted', cacheTtlMs: 1000 },
    );

    expect(result).toEqual(['fresh']);
    expect(httpClientMock).toHaveBeenCalledTimes(1);
  });

  it('throws ApiError when the backend reports an application error payload', async () => {
    const { apiRequest } = await loadApiModule();
    httpClientMock.mockResolvedValueOnce({
      status: 500,
      data: {
        status: 'error',
        message: 'Erreur interne du serveur.',
      },
    });

    await expect(
      apiRequest({ url: '/dashboard', method: 'get' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Erreur interne du serveur.',
    });
  });

  it('converts network failures into a stable ApiError', async () => {
    const { apiRequest } = await loadApiModule();
    httpClientMock.mockRejectedValueOnce({ code: 'ERR_NETWORK' });

    await expect(
      apiRequest({ url: '/dashboard', method: 'get' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'Connexion au serveur impossible.',
    });
  });
});
