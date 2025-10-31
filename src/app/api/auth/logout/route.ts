import { NextRequest, NextResponse } from 'next/server';
import { clearTokenCookie, getRefreshTokenFromRequest } from '@/lib/jwt';
import { revokeRefreshToken, revokeAllUserRefreshTokens, getCurrentUser } from '@/lib/auth-utils';

/**
 * POST /api/auth/logout
 * Выход из системы (удаление токенов и отзыв refresh токенов)
 * Query param: ?all=true - отозвать все refresh токены пользователя (выход на всех устройствах)
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const logoutAll = searchParams.get('all') === 'true';

    if (logoutAll) {
      // Отзываем ВСЕ refresh токены пользователя (выход на всех устройствах)
      const user = await getCurrentUser(request);
      if (user) {
        await revokeAllUserRefreshTokens(user.id);
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ All refresh tokens revoked for user:', user.id);
        }
      }
    } else {
      // Отзываем только текущий refresh токен
      const refreshToken = getRefreshTokenFromRequest(request);
      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Current refresh token revoked');
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      message: logoutAll ? 'Выход выполнен на всех устройствах' : 'Вы вышли из системы',
    });

    return clearTokenCookie(response);
  } catch (error) {
    console.error('Logout error:', error);
    // Всё равно очищаем cookies даже при ошибке
    const response = NextResponse.json({
      success: true,
      message: 'Вы вышли из системы',
    });
    return clearTokenCookie(response);
  }
}
