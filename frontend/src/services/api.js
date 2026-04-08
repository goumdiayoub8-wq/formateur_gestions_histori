import axios from 'axios';
import { getStoredToken } from '../utils/authStorage';

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').trim();
const inFlightRequests = new Map();
const responseCache = new Map();
const SESSION_CACHE_PREFIX = 'api-cache:';

function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(url);
}

function normalizeApiBase(base) {
  const trimmed = base.trim();

  if (!trimmed) {
    return '/api';
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function buildApiUrl(url = '') {
  if (!url) {
    return normalizeApiBase(API_BASE);
  }

  if (isAbsoluteUrl(url)) {
    return url;
  }

  const base = normalizeApiBase(API_BASE);
  const path = url.startsWith('/') ? url : `/${url}`;

  return `${base}${path}`;
}

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

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function getSessionCacheKey(storageKey) {
  return `${SESSION_CACHE_PREFIX}${storageKey}`;
}

function readSessionCachedValue(storageKey) {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const serializedEntry = window.sessionStorage.getItem(getSessionCacheKey(storageKey));
    if (!serializedEntry) {
      return null;
    }

    const entry = JSON.parse(serializedEntry);
    if (!entry || entry.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(getSessionCacheKey(storageKey));
      return null;
    }

    responseCache.set(storageKey, entry);
    return entry.value;
  } catch {
    return null;
  }
}

function writeSessionCachedValue(storageKey, entry) {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(getSessionCacheKey(storageKey), JSON.stringify(entry));
  } catch {
    // Garde le cache memoire si besoin
  }
}

function removeSessionCachedValue(storageKey) {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(getSessionCacheKey(storageKey));
  } catch {
    // Le nettoyage peut echouer sans impact
  }
}

function readCachedValue(storageKey) {
  const entry = responseCache.get(storageKey);
  if (!entry) {
    return readSessionCachedValue(storageKey);
  }

  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(storageKey);
    removeSessionCachedValue(storageKey);
    return null;
  }

  return entry.value;
}

function writeCachedValue(storageKey, value, ttlMs) {
  const entry = {
    value,
    expiresAt: Date.now() + ttlMs,
  };

  responseCache.set(storageKey, entry);
  writeSessionCachedValue(storageKey, entry);
}

export function invalidateApiCache(match = '') {
  if (!match) {
    responseCache.clear();
    if (canUseSessionStorage()) {
      try {
        Object.keys(window.sessionStorage)
          .filter((key) => key.startsWith(SESSION_CACHE_PREFIX))
          .forEach((key) => window.sessionStorage.removeItem(key));
      } catch {
        // Le nettoyage peut echouer sans impact
      }
    }
    return;
  }

  for (const key of responseCache.keys()) {
    if (key.includes(match)) {
      responseCache.delete(key);
      removeSessionCachedValue(key);
    }
  }

  if (canUseSessionStorage()) {
    try {
      Object.keys(window.sessionStorage)
        .filter((key) => key.startsWith(SESSION_CACHE_PREFIX) && key.includes(match))
        .forEach((key) => window.sessionStorage.removeItem(key));
    } catch {
      // Le nettoyage peut echouer sans impact
    }
  }
}

export async function apiRequest(config, options = {}) {
  const { dedupeKey = '', raw = false, cacheKey = '', cacheTtlMs = 0 } = options;
  const effectiveCacheKey = cacheKey || dedupeKey;
  const storageKey =
    effectiveCacheKey && cacheTtlMs > 0 ? getCacheStorageKey(effectiveCacheKey, raw) : '';
  const requestConfig = {
    ...config,
    url: typeof config?.url === 'string' ? buildApiUrl(config.url) : config?.url,
  };

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
      const response = await api(requestConfig);
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
