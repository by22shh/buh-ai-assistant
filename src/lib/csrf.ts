import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Генерация CSRF токена
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
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

  // Токены должны совпадать и существовать
  return !!(cookieToken && headerToken && cookieToken === headerToken);
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


