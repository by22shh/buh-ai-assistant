import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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
 * Production: 100 запросов в минуту на IP
 */
export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
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
 */
export function getIP(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  const ip = xff ? xff.split(',')[0].trim() : '127.0.0.1';
  return ip;
}

/**
 * Mock rate limiter для разработки без Upstash
 */
const mockLimiter = {
  limit: async () => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 10000,
    pending: Promise.resolve()
  })
};

/**
 * Проверить rate limit для API
 */
export async function checkApiRateLimit(identifier: string) {
  if (!apiLimiter) {
    console.warn('[Rate Limit] Upstash не настроен, пропускаем проверку');
    return mockLimiter.limit();
  }

  return await apiLimiter.limit(identifier);
}

/**
 * Проверить rate limit для авторизации
 */
export async function checkAuthRateLimit(phone: string) {
  if (!authLimiter) {
    console.warn('[Rate Limit] Upstash не настроен, пропускаем проверку');
    return mockLimiter.limit();
  }

  return await authLimiter.limit(phone);
}

/**
 * Проверить rate limit для ИИ чата
 */
export async function checkAiChatRateLimit(userId: string) {
  if (!aiChatLimiter) {
    console.warn('[Rate Limit] Upstash не настроен, пропускаем проверку');
    return mockLimiter.limit();
  }

  return await aiChatLimiter.limit(userId);
}
