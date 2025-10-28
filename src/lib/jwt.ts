import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// Проверяем наличие обязательных переменных окружения
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32');
}

const JWT_SECRET = process.env.JWT_SECRET;
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
  const token = jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions
  );
  
  return token;
}

/**
 * Проверить и декодировать JWT токен
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('JWT verification failed:', error instanceof Error ? error.message : error);
    }
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
    return cookieToken;
  }

  // Затем пробуем Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Создать response с установкой cookie для токена
 */
export function setTokenCookie(response: NextResponse, token: string): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // HTTPS только на production
    sameSite: 'strict' as const, // Более строгий для безопасности
    maxAge: 60 * 60 * 24 * 7, // 7 дней
    path: '/',
    // Для отладки на production добавляем domain
    ...(isProduction ? {} : { domain: 'localhost' })
  };

  console.log('🍪 Setting cookie with options:', cookieOptions);
  response.cookies.set('token', token, cookieOptions);

  return response;
}

/**
 * Удалить токен из cookie
 */
export function clearTokenCookie(response: NextResponse): NextResponse {
  response.cookies.delete('token');
  return response;
}
