import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from './lib/jwt';
import { checkApiRateLimit, getIP } from './lib/rate-limit';
import { prisma } from './lib/prisma';

// Публичные пути, которые не требуют авторизации
const PUBLIC_PATHS = [
  '/api/auth/send-code',
  '/api/auth/verify-code',
  '/api/auth/refresh',
];

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

  const payload = verifyToken(token);

  if (!payload) {
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

  // Проверяем временный доступ для обычных пользователей
  if (payload.role === 'user') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          accessFrom: true,
          accessUntil: true,
        },
      });

      if (user) {
        const now = new Date();
        
        // Если доступ назначен, проверяем его действительность
        if (user.accessUntil) {
          // Если доступ истек
          if (now > user.accessUntil) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('❌ Middleware: Access expired');
            }
            return NextResponse.json(
              { 
                error: 'Access Expired', 
                message: 'Срок действия доступа истёк',
              },
              { status: 403 }
            );
          }
          
          // Если доступ еще не начался
          if (user.accessFrom && now < user.accessFrom) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('❌ Middleware: Access not started');
            }
            return NextResponse.json(
              { 
                error: 'Access Not Started', 
                message: 'Доступ ещё не начался',
              },
              { status: 403 }
            );
          }
        }
        // Если accessUntil не установлен, пользователь работает в демо-режиме (проверяется в API)
      }
    } catch (error) {
      console.error('❌ Error checking user access in middleware:', error);
      // В случае ошибки БД не блокируем запрос - лучше разрешить чем заблокировать всех
    }
  }

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
