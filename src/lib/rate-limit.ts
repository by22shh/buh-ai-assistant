import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<void>;
};

type MemoryRateLimitStore = Map<string, { count: number; reset: number }>;

const memoryRateLimitStores: Record<'api' | 'auth' | 'ai', MemoryRateLimitStore> = {
  api: new Map(),
  auth: new Map(),
  ai: new Map(),
};

const fallbackWarnings: Record<'api' | 'auth' | 'ai', boolean> = {
  api: false,
  auth: false,
  ai: false,
};

function warnAboutFallback(type: 'api' | 'auth' | 'ai') {
  if (!fallbackWarnings[type]) {
    console.warn(
      `[Rate Limit] Upstash не настроен, используем in-memory fallback для ${type} limiter. Не используйте это в production!`
    );
    fallbackWarnings[type] = true;
  }
}

function scheduleMemoryCleanup(store: MemoryRateLimitStore, identifier: string, windowMs: number) {
  setTimeout(() => {
    const entry = store.get(identifier);
    if (!entry) {
      return;
    }
    if (entry.reset <= Date.now()) {
      store.delete(identifier);
    }
  }, windowMs + 1000);
}

function memoryRateLimit(
  type: 'api' | 'auth' | 'ai',
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  warnAboutFallback(type);

  const store = memoryRateLimitStores[type];
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || existing.reset <= now) {
    const reset = now + windowMs;
    store.set(identifier, { count: 1, reset });
    scheduleMemoryCleanup(store, identifier, windowMs);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset,
      pending: Promise.resolve(),
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: existing.reset,
      pending: Promise.resolve(),
    };
  }

  existing.count += 1;
  store.set(identifier, existing);

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    reset: existing.reset,
    pending: Promise.resolve(),
  };
}

// Проверяем наличие Upstash credentials
const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Создаём Redis клиент только если есть credentials
const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Rate limiter для API запросов
 * Production: 100 запросов в минуту на IP (или настраиваемый через RATE_LIMIT_API_REQUESTS)
 * Development: 500 запросов в минуту (для локальной разработки)
 */
const getApiRateLimit = (): number => {
  // Приоритет: env переменная > окружение
  if (process.env.RATE_LIMIT_API_REQUESTS) {
    const limit = parseInt(process.env.RATE_LIMIT_API_REQUESTS, 10);
    if (!isNaN(limit) && limit > 0) {
      return limit;
    }
  }
  return process.env.NODE_ENV === 'production' ? 100 : 500;
};

const apiRateLimit = getApiRateLimit();

export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(apiRateLimit, '1 m'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null;

/**
 * Rate limiter для авторизации
 * 5 попыток в минуту на номер телефона
 */
export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null;

/**
 * Rate limiter для ИИ чата
 * 10 сообщений в минуту на пользователя
 */
export const aiChatLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'ratelimit:ai',
    })
  : null;

/**
 * Получить IP адрес из request
 * Поддерживает Netlify, Cloudflare и другие CDN/прокси
 */
export function getIP(request: Request): string {
  // Netlify и другие CDN передают реальный IP через специальные headers
  // Проверяем в порядке приоритета
  const headers = [
    'x-nf-client-connection-ip',  // Netlify Edge (приоритет для production)
    'x-forwarded-for',             // Стандартный proxy header
    'x-real-ip',                   // Nginx и другие прокси
    'cf-connecting-ip',            // Cloudflare (если используется)
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for может содержать несколько IP через запятую (client, proxy1, proxy2)
      // Берем первый (реальный IP клиента)
      const ip = value.split(',')[0].trim();
      // Проверяем что это не localhost
      if (ip && ip !== '::1' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  }

  // Fallback для локальной разработки
  return '127.0.0.1';
}

/**
 * Mock rate limiter для разработки без Upstash
 */
const ONE_MINUTE_MS = 60 * 1000;

/**
 * Проверить rate limit для API
 */
export async function checkApiRateLimit(identifier: string) {
  if (!apiLimiter) {
    const limit = getApiRateLimit();
    return memoryRateLimit('api', identifier, limit, ONE_MINUTE_MS);
  }

  return await apiLimiter.limit(identifier);
}

/**
 * Проверить rate limit для авторизации
 */
export async function checkAuthRateLimit(identifier: string) {
  if (!authLimiter) {
    return memoryRateLimit('auth', identifier, 5, ONE_MINUTE_MS);
  }

  return await authLimiter.limit(identifier);
}

/**
 * Проверить rate limit для ИИ чата
 */
export async function checkAiChatRateLimit(userId: string) {
  if (!aiChatLimiter) {
    return memoryRateLimit('ai', userId, 10, ONE_MINUTE_MS);
  }

  return await aiChatLimiter.limit(userId);
}
