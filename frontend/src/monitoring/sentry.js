const SENTRY_ENV = (import.meta.env.VITE_APP_ENV || import.meta.env.MODE || '').toLowerCase();
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

let sentryModulePromise = null;

function shouldEnableSentry() {
  return import.meta.env.PROD && SENTRY_ENV === 'production' && SENTRY_DSN !== '';
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !/authorization|cookie|password|token|secret/i.test(key))
        .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)]),
    );
  }

  return value;
}

function sanitizeEvent(event) {
  if (!event || typeof event !== 'object') {
    return event;
  }

  const nextEvent = { ...event };

  if (nextEvent.request) {
    nextEvent.request = {
      ...nextEvent.request,
      data: undefined,
      cookies: undefined,
      headers: sanitizeValue(nextEvent.request.headers || {}),
    };
  }

  if (nextEvent.user) {
    nextEvent.user = {
      id: nextEvent.user.id,
    };
  }

  if (nextEvent.extra) {
    nextEvent.extra = sanitizeValue(nextEvent.extra);
  }

  return nextEvent;
}

async function getSentry() {
  if (!shouldEnableSentry()) {
    return null;
  }

  if (!sentryModulePromise) {
    sentryModulePromise = import('@sentry/react')
      .then((Sentry) => {
        Sentry.init({
          dsn: SENTRY_DSN,
          enabled: true,
          environment: SENTRY_ENV,
          sendDefaultPii: false,
          attachStacktrace: true,
          tracesSampleRate: 0,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 0,
          beforeSend: sanitizeEvent,
        });

        return Sentry;
      })
      .catch(() => null);
  }

  return sentryModulePromise;
}

export async function initFrontendMonitoring() {
  return getSentry();
}

export async function captureFrontendException(error, context = {}) {
  const Sentry = await getSentry();
  if (!Sentry) {
    return;
  }

  Sentry.withScope((scope) => {
    Object.entries(sanitizeValue(context)).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureException(error);
  });
}
