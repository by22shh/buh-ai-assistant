import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Создать JWT токен
 */
export function createToken(payload: JWTPayload): string {
  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions
  );
}

/**
 * Проверить и декодировать JWT токен
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Получить токен из request (cookie или header)
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Сначала пробуем cookie
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) {
    console.log('🍪 Token found in cookie');
    return cookieToken;
  }

  // Затем пробуем Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    console.log('🔑 Token found in Authorization header');
    return authHeader.substring(7);
  }

  console.log('❌ No token found in request (checked cookie and header)');
  return null;
}

/**
 * Создать response с установкой cookie для токена
 */
export function setTokenCookie(response: NextResponse, token: string): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';

  // ВРЕМЕННО: httpOnly = false для отладки
  // TODO: вернуть httpOnly: true после исправления проблемы
  // Используем строковый метод для большей совместимости
  response.cookies.set('token', token, {
    httpOnly: false, // ВРЕМЕННО для отладки
    secure: false, // ВРЕМЕННО: false для localhost
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 дней
    path: '/',
    domain: undefined, // Не устанавливаем domain для localhost
  });

  console.log('🍪 Cookie set with options:', {
    httpOnly: false, // ВРЕМЕННО для отладки
    secure: false, // ВРЕМЕННО для localhost
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    domain: 'undefined (auto)',
    NODE_ENV: process.env.NODE_ENV,
    tokenPreview: token.substring(0, 20) + '...'
  });

  // Также добавим Set-Cookie заголовок вручную для отладки
  const cookieValue = `token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  console.log('🍪 Set-Cookie header:', cookieValue);

  return response;
}

/**
 * Удалить токен из cookie
 */
export function clearTokenCookie(response: NextResponse): NextResponse {
  response.cookies.delete('token');
  return response;
}
