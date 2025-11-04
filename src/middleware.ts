import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';
import { checkApiRateLimit, getIP } from './lib/rate-limit';
import { shouldCheckCsrf, validateCsrfToken } from './lib/csrf';
import { logSecurityEventFromRequest } from './lib/security-log';

// Публичные пути, которые не требуют авторизации
const PUBLIC_PATHS = [
  '/api/auth/send-code',
  '/api/auth/verify-code',
  '/api/auth/refresh',
  '/api/auth/logout', // ВАЖНО: logout должен работать даже с истекшим токеном
];

// Админские пути
const ADMIN_PATHS = [
  '/api/admin/',
];

type EdgeTokenPayload = JWTPayload & {
  userId?: string;
  email?: string;
  role?: string;
};

const jwtSecret = process.env.JWT_SECRET;
const encodedSecret = jwtSecret ? new TextEncoder().encode(jwtSecret) : null;

async function verifyTokenEdge(token: string): Promise<EdgeTokenPayload | null> {
  if (!encodedSecret) {
    console.error('JWT_SECRET is not configured for middleware environment');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as EdgeTokenPayload;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('❌ Middleware: Token verification failed', error);
    }
    return null;
  }
}

function getTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Пропускаем не-API запросы
  if (!pathname.startsWith('/api/')) {
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

  // CSRF Protection для state-changing операций
  if (shouldCheckCsrf(request)) {
    if (!validateCsrfToken(request)) {
      // БЕЗОПАСНОСТЬ: Логируем CSRF validation failed (подозрительная активность)
      // Используем try-catch вместо .catch() для более явной обработки
      try {
        await logSecurityEventFromRequest(request, 'csrf_validation_failed', {
          metadata: { path: pathname, method: request.method },
        });
      } catch (logError) {
        // Игнорируем ошибки логирования, чтобы не блокировать ответ
        console.error('Failed to log CSRF validation error:', logError);
      }
      
      return NextResponse.json(
        { 
          error: 'CSRF Validation Failed',
          message: 'CSRF token invalid or missing. Please refresh the page.' 
        },
        { status: 403 }
      );
    }
  }

  // Проверяем JWT токен
  const token = getTokenFromRequest(request);

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('❌ Middleware: No token provided');
    }
    return NextResponse.json(
      { error: 'Unauthorized', message: 'No token provided' },
      { status: 401 }
    );
  }

  const payload = await verifyTokenEdge(token);

  if (!payload || !payload.userId || !payload.email || !payload.role) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('❌ Middleware: Invalid or expired token');
    }
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Middleware: Token valid');
  }

  // ОПТИМИЗАЦИЯ: Убрана отдельная проверка временного доступа в middleware
  // Причины:
  // 1. Это дополнительный DB запрос на КАЖДОМ API вызове (проблема производительности)
  // 2. Проверка доступа уже выполняется в getCurrentUser() внутри каждого API route
  // 3. Информация о доступе возвращается вместе с пользователем
  // 
  // Проверка временного доступа теперь централизована в API routes через getCurrentUser()
  // Middleware только проверяет валидность JWT токена

  // Проверяем доступ к админским путям
  if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }
  }

  // Не устанавливаем headers с пользовательскими данными - каждый API route должен
  // самостоятельно проверять JWT токен через getCurrentUser() для безопасности.
  // Это предотвращает потенциальное использование подделанных headers от клиента.
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
