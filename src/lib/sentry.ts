import * as Sentry from '@sentry/react';

const dsn = (import.meta.env.VITE_SENTRY_DSN ?? '').trim();

if (dsn && import.meta.env.PROD) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export { Sentry };
