import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN || undefined,

  // Трассировка производительности
  tracesSampleRate: 0.1, // 10% запросов

  // Окружение
  environment: process.env.NODE_ENV || 'development',

  // Включить только в production
  enabled: process.env.NODE_ENV === 'production' && !!SENTRY_DSN,

  // Отладка
  debug: false,

  // Фильтр ошибок
  beforeSend(event, hint) {
    // Игнорируем известные безопасные ошибки
    const error = hint.originalException;

    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);

      // Игнорируем сетевые ошибки от расширений браузера
      if (message.includes('Extension context')) {
        return null;
      }

      // Игнорируем ошибки отмены запросов
      if (message.includes('AbortError')) {
        return null;
      }
    }

    return event;
  },

  // Игнорируем определённые URL
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
