import axios from 'axios';
import { getStoredToken } from '../utils/authStorage';

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').trim();
const inFlightRequests = new Map();
const responseCache = new Map();

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.payload = options.payload ?? null;
    this.code = options.code ?? '';
  }
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function pickResponseData(payload) {
  if (payload === null || payload === undefined) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }

  const fallbackKeys = [
    'user',
    'formateur',
    'formateurs',
    'module',
    'modules',
    'entry',
    'entries',
    'planning',
    'stats',
    'dashboard',
    'hours',
    'notifications',
    'rows',
    'overview',
    'summary',
    'history',
    'queue',
    'submission',
    'results',
    'reports',
    'report',
  ];

  for (const key of fallbackKeys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      return payload[key];
    }
  }

  return payload;
}

function buildError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  const status = error?.response?.status ?? 0;
  const payload = error?.response?.data ?? null;
  const message =
    payload?.message ||
    payload?.error ||
    (status === 0 ? 'Connexion au serveur impossible.' : `Erreur serveur (${status}).`);

  return new ApiError(message, {
    status,
    payload,
    code: error?.code ?? '',
  });
}

function getCacheStorageKey(key, raw) {
  return `${key}::${raw ? 'raw' : 'picked'}`;
}

function readCachedValue(storageKey) {
  const entry = responseCache.get(storageKey);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(storageKey);
    return null;
  }

  return entry.value;
}

function writeCachedValue(storageKey, value, ttlMs) {
  responseCache.set(storageKey, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateApiCache(match = '') {
  if (!match) {
    responseCache.clear();
    return;
  }

  for (const key of responseCache.keys()) {
    if (key.includes(match)) {
      responseCache.delete(key);
    }
  }
}

export async function apiRequest(config, options = {}) {
  const { dedupeKey = '', raw = false, cacheKey = '', cacheTtlMs = 0 } = options;
  const effectiveCacheKey = cacheKey || dedupeKey;
  const storageKey =
    effectiveCacheKey && cacheTtlMs > 0 ? getCacheStorageKey(effectiveCacheKey, raw) : '';

  if (storageKey) {
    const cachedValue = readCachedValue(storageKey);
    if (cachedValue !== null) {
      return cachedValue;
    }
  }

  if (dedupeKey && inFlightRequests.has(dedupeKey)) {
    return inFlightRequests.get(dedupeKey);
  }

  const requestPromise = (async () => {
    try {
      const response = await api(config);
      const payload = response?.data ?? null;

      if (payload?.status === 'error' || payload?.success === false) {
        throw new ApiError(payload?.message || 'La requete a echoue.', {
          status: response?.status ?? 0,
          payload,
        });
      }

      const result = raw ? payload : pickResponseData(payload);

      if (storageKey) {
        writeCachedValue(storageKey, result, cacheTtlMs);
      }

      return result;
    } catch (error) {
      throw buildError(error);
    } finally {
      if (dedupeKey) {
        inFlightRequests.delete(dedupeKey);
      }
    }
  })();

  if (dedupeKey) {
    inFlightRequests.set(dedupeKey, requestPromise);
  }

  return requestPromise;
}

export default api;
