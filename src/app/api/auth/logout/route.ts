import { NextRequest, NextResponse } from 'next/server';
import { clearTokenCookie, getRefreshTokenFromRequest, verifyRefreshToken } from '@/lib/jwt';
import { revokeRefreshToken, revokeAllUserRefreshTokens, getCurrentUser, validateRefreshToken } from '@/lib/auth-utils';
import { logSecurityEventFromRequest } from '@/lib/security-log';
import { validateCsrfToken } from '@/lib/csrf';

export const runtime = 'nodejs';

/**
 * POST /api/auth/logout
 * Выход из системы (удаление токенов и отзыв refresh токенов)
 * Query param: ?all=true - отозвать все refresh токены пользователя (выход на всех устройствах)
 */
export async function POST(request: NextRequest) {
  try {
    const hasAuthCookies = Boolean(request.cookies.get('token') || request.cookies.get('refreshToken'));

    if (hasAuthCookies && !validateCsrfToken(request)) {
      await logSecurityEventFromRequest(request, 'csrf_validation_failed', {
        metadata: { path: '/api/auth/logout', method: 'POST' },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'CSRF Validation Failed',
          message: 'CSRF token invalid or missing. Please refresh the page.',
        },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const logoutAll = searchParams.get('all') === 'true';

    const refreshTokenValue = getRefreshTokenFromRequest(request);
    const user = await getCurrentUser(request);

    let targetUserId = user?.id ?? null;
    let targetEmail = user?.email;

    if (!targetUserId && refreshTokenValue) {
      const refreshTokenRecord = await validateRefreshToken(refreshTokenValue);

      if (refreshTokenRecord) {
        targetUserId = refreshTokenRecord.userId;
        targetEmail = refreshTokenRecord.user.email;
      } else {
        const refreshPayload = verifyRefreshToken(refreshTokenValue);
        if (refreshPayload) {
          targetUserId = refreshPayload.userId;
          targetEmail = refreshPayload.email;
        }
      }
    }

    if (logoutAll) {
      if (targetUserId) {
        await revokeAllUserRefreshTokens(targetUserId);

        await logSecurityEventFromRequest(request, 'logout_all', {
          userId: targetUserId,
          email: targetEmail,
        });

        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ All refresh tokens revoked for user:', targetUserId);
        }
      } else if (refreshTokenValue) {
        await revokeRefreshToken(refreshTokenValue);

        await logSecurityEventFromRequest(request, 'logout_all', {
          metadata: { reason: 'user_not_identified' },
        });
      }
    } else {
      if (refreshTokenValue) {
        await revokeRefreshToken(refreshTokenValue);

        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Current refresh token revoked');
        }

        await logSecurityEventFromRequest(request, 'logout', {
          userId: targetUserId ?? undefined,
          email: targetEmail,
        });
      } else if (targetUserId) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('⚠️ No refresh token in cookie, revoking all user tokens for security');
        }

        await revokeAllUserRefreshTokens(targetUserId);

        await logSecurityEventFromRequest(request, 'logout', {
          userId: targetUserId,
          email: targetEmail,
          metadata: { fallback: 'revoked_all_tokens' },
        });
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
