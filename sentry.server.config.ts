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

  // Интеграции для сервера
  integrations: [
    Sentry.prismaIntegration(),
  ],

  // Фильтр ошибок
  beforeSend(event, hint) {
    // Логируем в консоль для отладки
    if (process.env.NODE_ENV !== 'production') {
      console.error('Sentry Error:', hint.originalException || event);
    }

    return event;
  },
});
