import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// Проверяем наличие обязательных переменных окружения
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 32');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Access token - короткий TTL
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Refresh token - длинный TTL

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
    sameSite: 'lax' as const, // Изменено с 'strict' на 'lax' для корректной работы редиректов
    maxAge: 60 * 15, // 15 минут для access token
    path: '/',
  };

  console.log('🍪 Setting token cookie with options:', cookieOptions);
  response.cookies.set('token', token, cookieOptions);

  return response;
}

/**
 * Удалить токен из cookie
 */
export function clearTokenCookie(response: NextResponse): NextResponse {
  response.cookies.delete('token');
  response.cookies.delete('refreshToken');
  return response;
}

/**
 * Создать refresh токен
 */
export function createRefreshToken(payload: JWTPayload): string {
  const token = jwt.sign(
    payload,
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions
  );
  
  return token;
}

/**
 * Проверить и декодировать refresh токен
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('JWT refresh token verification failed:', error instanceof Error ? error.message : error);
    }
    return null;
  }
}

/**
 * Получить refresh токен из request
 */
export function getRefreshTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('refreshToken')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers.get('x-refresh-token');
  if (authHeader) {
    return authHeader;
  }

  return null;
}

/**
 * Создать response с установкой refresh cookie
 */
export function setRefreshTokenCookie(response: NextResponse, token: string): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const, // Изменено с 'strict' на 'lax' для корректной работы редиректов
    maxAge: 60 * 60 * 24 * 7, // 7 дней
    path: '/',
  };

  console.log('🍪 Setting refresh token cookie with options:', cookieOptions);
  response.cookies.set('refreshToken', token, cookieOptions);
  return response;
}
