import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Логируем при загрузке модуля для отладки
console.log('🔐 JWT Module loaded');
console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('🔑 JWT_SECRET value:', JWT_SECRET.substring(0, 30) + '...');
console.log('⏰ JWT_EXPIRES_IN:', JWT_EXPIRES_IN);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Создать JWT токен
 */
export function createToken(payload: JWTPayload): string {
  console.log('🔨 Creating JWT token with payload:', payload);
  console.log('🔑 Using JWT_SECRET:', JWT_SECRET.substring(0, 20) + '...');
  console.log('⏰ Token expires in:', JWT_EXPIRES_IN);
  
  const token = jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions
  );
  
  console.log('✅ Token created, length:', token.length);
  
  return token;
}

/**
 * Проверить и декодировать JWT токен
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    console.log('🔍 Verifying JWT token...');
    console.log('🔑 JWT_SECRET:', JWT_SECRET.substring(0, 20) + '...');
    console.log('📝 Token preview:', token.substring(0, 50) + '...');
    
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    console.log('✅ JWT verification successful:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });
    
    return decoded;
  } catch (error) {
    console.error('❌ JWT verification failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
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

  // В production: httpOnly=true, secure=true для безопасности
  // В development: httpOnly=false, secure=false для отладки
  const cookieOptions = {
    httpOnly: true, // Возвращаем true для безопасности
    secure: isProduction, // true на production (HTTPS), false на localhost
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 дней
    path: '/',
  };

  response.cookies.set('token', token, cookieOptions);

  console.log('🍪 Cookie set with options:', {
    ...cookieOptions,
    NODE_ENV: process.env.NODE_ENV,
    isProduction,
    tokenPreview: token.substring(0, 20) + '...',
    url: 'Check if cookie is sent in subsequent requests'
  });

  // Также устанавливаем через Set-Cookie заголовок явно
  const cookieString = [
    `token=${token}`,
    'Path=/',
    `Max-Age=${cookieOptions.maxAge}`,
    'SameSite=Lax',
    cookieOptions.httpOnly ? 'HttpOnly' : '',
    cookieOptions.secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
  
  console.log('🍪 Set-Cookie header:', cookieString);

  return response;
}

/**
 * Удалить токен из cookie
 */
export function clearTokenCookie(response: NextResponse): NextResponse {
  response.cookies.delete('token');
  return response;
}
