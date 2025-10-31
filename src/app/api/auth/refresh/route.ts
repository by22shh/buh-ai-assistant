import { NextRequest, NextResponse } from 'next/server';
import { getRefreshTokenFromRequest, verifyRefreshToken, createToken, setTokenCookie } from '@/lib/jwt';
import { validateRefreshToken, revokeRefreshToken, createRefreshTokenRecord } from '@/lib/auth-utils';
import crypto from 'crypto';

/**
 * POST /api/auth/refresh
 * Обновление access токена с помощью refresh токена
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем refresh токен
    const refreshTokenValue = getRefreshTokenFromRequest(request);

    if (!refreshTokenValue) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Refresh token not provided' },
        { status: 401 }
      );
    }

    // Проверяем JWT подпись refresh токена
    const payload = verifyRefreshToken(refreshTokenValue);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Проверяем refresh токен в БД
    const refreshTokenRecord = await validateRefreshToken(refreshTokenValue);
    if (!refreshTokenRecord) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Refresh token not found or revoked' },
        { status: 401 }
      );
    }

    // Получаем актуальные данные пользователя
    const user = refreshTokenRecord.user;
    
    // Проверяем, не изменилась ли роль или email
    if (user.email !== payload.email || user.role !== payload.role) {
      // Отзываем все токены пользователя, если данные изменились
      await revokeRefreshToken(refreshTokenValue);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User data changed, please login again' },
        { status: 401 }
      );
    }

    // Создаём новый access токен
    const newAccessToken = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Rotate refresh token (включено по умолчанию для безопасности)
    // Можно отключить через ROTATE_REFRESH_TOKENS=false (не рекомендуется)
    const shouldRotateRefresh = process.env.ROTATE_REFRESH_TOKENS !== 'false';
    
    let response = NextResponse.json({
      success: true,
      message: 'Token refreshed',
    });

    // Устанавливаем новый access токен
    response = setTokenCookie(response, newAccessToken);

    // Ротируем refresh токен (по умолчанию включено)
    if (shouldRotateRefresh) {
      // Отзываем старый refresh токен
      await revokeRefreshToken(refreshTokenValue);

      // Создаём новый refresh токен
      const newRefreshTokenValue = createRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      await createRefreshTokenRecord(user.id, newRefreshTokenValue);
      const { setRefreshTokenCookie } = await import('@/lib/jwt');
      response = setRefreshTokenCookie(response, newRefreshTokenValue);
    }

    return response;

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}


