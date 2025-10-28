import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from './lib/jwt';
import { checkApiRateLimit, getIP } from './lib/rate-limit';

// Публичные пути, которые не требуют авторизации
const PUBLIC_PATHS = [
  '/api/auth/send-code',
  '/api/auth/verify-code',
];

// DEBUG: Временно отключаем middleware для отладки
const SKIP_MIDDLEWARE = true;

// Админские пути
const ADMIN_PATHS = [
  '/api/admin/',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Пропускаем не-API запросы
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // ВРЕМЕННО: Пропускаем все API запросы, каждый route проверяет авторизацию сам
  if (SKIP_MIDDLEWARE) {
    console.log('⚠️ Middleware skipped for:', pathname);
    return NextResponse.next();
  }

  // Rate limiting для всех API запросов
  const ip = getIP(request);
  const rateLimitResult = await checkApiRateLimit(ip);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Слишком много запросов. Попробуйте позже.',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        }
      }
    );
  }

  // Пропускаем публичные пути
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Отладка: показываем все cookies
  console.log('🔍 Middleware checking:', pathname);
  console.log('🍪 All cookies:', request.cookies.getAll());
  
  // Проверяем JWT токен
  const token = getTokenFromRequest(request);
  console.log('🔑 Token from request:', token ? `${token.substring(0, 20)}...` : 'null');

  if (!token) {
    console.log('❌ Middleware: No token provided for', pathname);
    console.log('🍪 Cookie names:', request.cookies.getAll().map(c => `${c.name}=${c.value?.substring(0, 10)}...`));
    console.log('🔍 Authorization header:', request.headers.get('authorization'));
    return NextResponse.json(
      { error: 'Unauthorized', message: 'No token provided' },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);

  if (!payload) {
    console.log('❌ Middleware: Invalid or expired token for', pathname);
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  console.log('✅ Middleware: Token valid for', pathname, '- User:', payload.email);

  // Проверяем доступ к админским путям
  if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }
  }

  // Добавляем payload в headers для использования в API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
};
