import { NextRequest, NextResponse } from 'next/server';
import { getRefreshTokenFromRequest, verifyRefreshToken, createToken, createRefreshToken, setTokenCookie, setRefreshTokenCookie } from '@/lib/jwt';
import { validateRefreshToken, revokeRefreshToken, createRefreshTokenRecord } from '@/lib/auth-utils';
import { generateCsrfToken, setCsrfTokenCookie } from '@/lib/csrf';
import { logSecurityEventFromRequest } from '@/lib/security-log';

/**
 * POST /api/auth/refresh
 * Обновление access токена с помощью refresh токена
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем refresh токен
    const refreshTokenValue = getRefreshTokenFromRequest(request);

    if (!refreshTokenValue) {
      // БЕЗОПАСНОСТЬ: Логируем failed refresh attempt
      await logSecurityEventFromRequest(request, 'token_refresh_failed', {
        metadata: { reason: 'no_refresh_token' },
      });
      
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Refresh token not provided' },
        { status: 401 }
      );
    }

    // Проверяем JWT подпись refresh токена
    const payload = verifyRefreshToken(refreshTokenValue);
    if (!payload) {
      // БЕЗОПАСНОСТЬ: Логируем failed refresh attempt
      await logSecurityEventFromRequest(request, 'token_refresh_failed', {
        metadata: { reason: 'invalid_jwt_signature' },
      });
      
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Проверяем refresh токен в БД
    const refreshTokenRecord = await validateRefreshToken(refreshTokenValue);
    if (!refreshTokenRecord) {
      // БЕЗОПАСНОСТЬ: Логируем failed refresh attempt
      await logSecurityEventFromRequest(request, 'token_refresh_failed', {
        userId: payload.userId,
        email: payload.email,
        metadata: { reason: 'token_not_found_or_revoked' },
      });
      
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
      
      // БЕЗОПАСНОСТЬ: Логируем failed refresh из-за изменения данных
      await logSecurityEventFromRequest(request, 'token_refresh_failed', {
        userId: user.id,
        email: user.email,
        metadata: { reason: 'user_data_changed' },
      });
      
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

    // БЕЗОПАСНОСТЬ: Refresh token rotation ВСЕГДА включена для защиты от replay attacks
    // Отзываем старый refresh токен
    await revokeRefreshToken(refreshTokenValue);

    // Создаём новый refresh токен
    const newRefreshTokenValue = createRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await createRefreshTokenRecord(user.id, newRefreshTokenValue);
    
    // БЕЗОПАСНОСТЬ: Логируем successful token refresh
    await logSecurityEventFromRequest(request, 'token_refresh', {
      userId: user.id,
      email: user.email,
    });
    
    // Генерируем новый CSRF токен при refresh
    const csrfToken = generateCsrfToken();
    
    let response = NextResponse.json({
      success: true,
      message: 'Token refreshed',
      csrfToken, // Отдаём новый CSRF token
    });

    // Устанавливаем новый access токен
    response = setTokenCookie(response, newAccessToken);

    // Устанавливаем новый refresh токен
    response = setRefreshTokenCookie(response, newRefreshTokenValue);
    
    // Устанавливаем новый CSRF токен
    response = setCsrfTokenCookie(response, csrfToken);

    return response;

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}


