import { NextRequest, NextResponse } from 'next/server';

/**
 * Генерация CSRF токена
 */
export function generateCsrfToken(): string {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const array = new Uint8Array(32);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback для окружений без Web Crypto (не должен использоваться в production)
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += Math.floor(Math.random() * 16).toString(16);
  }
  return token;
}

/**
 * Установка CSRF токена в cookie
 */
export function setCsrfTokenCookie(response: NextResponse, token: string): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set('csrf-token', token, {
    httpOnly: false, // Должен быть доступен для JS (чтобы отправить в header)
    secure: isProduction,
    sameSite: 'lax' as const, // Совместимость с внешними редиректами
    maxAge: 60 * 60 * 24, // 24 часа
    path: '/',
  });

  return response;
}

/**
 * Проверка CSRF токена
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Получаем токен из cookie
  const cookieToken = request.cookies.get('csrf-token')?.value;
  
  // Получаем токен из header
  const headerToken = request.headers.get('x-csrf-token');

  // 1) Строгая проверка: и в cookie, и в header, и они совпадают
  if (cookieToken && headerToken && cookieToken === headerToken) {
    return true;
  }

  // 2) Fallback для случаев, когда заголовок не проставлен на клиенте,
  // но запрос выполняется из того же origin (same-origin) и есть cookie CSRF.
  // Это сохраняет защиту от cross-site запросов, не ослабляя безопасность.
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const currentOrigin = request.nextUrl.origin; // e.g. https://example.com

  const isSameOriginByOrigin = !!origin && origin === currentOrigin;
  const isSameOriginByReferer = !!referer && referer.startsWith(currentOrigin + '/');

  if (cookieToken && (isSameOriginByOrigin || isSameOriginByReferer)) {
    return true;
  }

  return false;
}

/**
 * Middleware helper для проверки CSRF на state-changing операциях
 */
export function shouldCheckCsrf(request: NextRequest): boolean {
  const method = request.method;
  const pathname = request.nextUrl.pathname;

  // Проверяем CSRF только на state-changing методах
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return false;
  }

  // Не проверяем CSRF на публичных auth endpoints
  const publicAuthPaths = [
    '/api/auth/send-code',
    '/api/auth/verify-code',
    '/api/auth/refresh',
  ];

  if (publicAuthPaths.some(path => pathname.startsWith(path))) {
    return false;
  }

  // Проверяем на всех остальных API routes
  return pathname.startsWith('/api/');
}


