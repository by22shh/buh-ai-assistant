import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';

function resolveJwtSecret(envKey: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const envValue = process.env[envKey];

  if (envValue && envValue.trim().length > 0) {
    return envValue;
  }

  if (isProduction) {
    throw new Error(
      `${envKey} environment variable is required. Generate one with: openssl rand -base64 32`
    );
  }

  const generatedSecret = crypto.randomBytes(32).toString('hex');
  console.warn(
    `⚠️ ${envKey} не задан. Сгенерирован временный dev secret. Не используйте его в production!`
  );
  process.env[envKey] = generatedSecret;
  return generatedSecret;
}

const jwtSecret = resolveJwtSecret('JWT_SECRET');
let jwtRefreshSecret = resolveJwtSecret('JWT_REFRESH_SECRET');

if (jwtSecret === jwtRefreshSecret) {
  const message = 'JWT_REFRESH_SECRET must be different from JWT_SECRET. Generate with: openssl rand -base64 32';

  if (isProduction) {
    throw new Error(message);
  }

  console.warn(`⚠️ ${message}. Сгенерирован новый dev refresh secret.`);
  jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
  process.env.JWT_REFRESH_SECRET = jwtRefreshSecret;
}

const JWT_SECRET = jwtSecret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Access token - короткий TTL
const JWT_REFRESH_SECRET = jwtRefreshSecret;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Refresh token - длинный TTL

const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function parseDurationToMs(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/^(\d+)(ms|s|m|h|d|w)?$/);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? 's';

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const unitMap: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  const multiplier = unitMap[unit];

  if (!multiplier) {
    return null;
  }

  return amount * multiplier;
}

const parsedRefreshTtlMs = parseDurationToMs(JWT_REFRESH_EXPIRES_IN);

export const REFRESH_TOKEN_TTL_MS = parsedRefreshTtlMs ?? DEFAULT_REFRESH_TTL_MS;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = Math.max(1, Math.floor(REFRESH_TOKEN_TTL_MS / 1000));

if (parsedRefreshTtlMs === null && process.env.NODE_ENV !== 'production') {
  console.warn(
    `⚠️ Unable to parse JWT_REFRESH_EXPIRES_IN="${JWT_REFRESH_EXPIRES_IN}". Falling back to 7d.`
  );
}

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
    sameSite: 'lax' as const, // CSRF protection + совместимость с внешними редиректами
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
  response.cookies.delete('csrf-token');
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
    sameSite: 'lax' as const, // CSRF protection + совместимость с внешними редиректами
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    path: '/',
  };

  console.log('🍪 Setting refresh token cookie with options:', cookieOptions);
  response.cookies.set('refreshToken', token, cookieOptions);
  return response;
}
