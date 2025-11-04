import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { upsertUser, createRefreshTokenRecord } from '@/lib/auth-utils';
import { createToken, createRefreshToken, setTokenCookie, setRefreshTokenCookie } from '@/lib/jwt';
import { checkAuthRateLimit, getIP } from '@/lib/rate-limit';
import { generateCsrfToken, setCsrfTokenCookie } from '@/lib/csrf';
import { logSecurityEventFromRequest } from '@/lib/security-log';

/**
 * POST /api/auth/verify-code
 * Проверка 6-значного кода и выдача JWT токена
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP to reduce guessing/bruteforce of codes
    const ip = getIP(request);
    const rl = await checkAuthRateLimit(ip);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Слишком много попыток. Попробуйте позже.' },
        { status: 429 }
      );
    }

    const { email, code, token } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email и код обязательны' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const trimmedCode = typeof code === 'string' ? code.trim() : String(code ?? '');

    if (!/^[0-9]{6}$/.test(trimmedCode)) {
      return NextResponse.json(
        { success: false, error: 'Код должен состоять из 6 цифр' },
        { status: 400 }
      );
    }

    const sanitizedToken = typeof token === 'string' ? token.trim() : '';
    const tokenProvided = sanitizedToken.length > 0;

    // Find valid login token and mark as used atomically to prevent race conditions
    // Using findFirst + update separately could allow the same code to be used twice
    const loginToken = await prisma.loginToken.findFirst({
      where: {
        email: normalizedEmail,
        code: trimmedCode,
        ...(tokenProvided ? { token: sanitizedToken } : {}),
        used: false,
        expiresAt: {
          gt: new Date()
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!loginToken) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ Invalid or expired code');
      }
      
      // БЕЗОПАСНОСТЬ: Логируем failed login attempt
      const failureReason = tokenProvided ? 'invalid_or_expired_code_or_token' : 'invalid_or_expired_code';
      await logSecurityEventFromRequest(request, 'login_failed', {
        email: normalizedEmail,
        metadata: {
          reason: failureReason,
          tokenProvided,
        },
      });
      
      return NextResponse.json(
        { success: false, error: 'Неверный или истекший код' },
        { status: 400 }
      );
    }

    // ЗАЩИТА ОТ RACE CONDITION: Атомарное обновление с проверкой
    // Если два запроса придут одновременно, только один пройдет
    const updateResult = await prisma.loginToken.updateMany({
      where: { 
        id: loginToken.id,
        used: false // Проверяем еще раз, что не использован
      },
      data: { used: true }
    });

    // Если не обновлено ни одной записи - токен уже использован другим запросом
    if (updateResult.count === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ Token already used (race condition detected)');
      }
      
      const reuseReason = tokenProvided ? 'token_already_used' : 'code_already_used';
      await logSecurityEventFromRequest(request, 'login_failed', {
        email: normalizedEmail,
        metadata: {
          reason: reuseReason,
          possibleRaceCondition: true,
          tokenProvided,
        },
      });
      
      return NextResponse.json(
        { success: false, error: 'Код уже был использован' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Code verified');
    }

    // Create or update user
    const user = await upsertUser(normalizedEmail, {
      emailVerified: true
    });

    // БЕЗОПАСНОСТЬ: Логируем successful login
    await logSecurityEventFromRequest(request, 'login_success', {
      userId: user.id,
      email: user.email,
      metadata: { role: user.role, tokenProvided },
    });

    // Create access JWT token (short-lived)
    const accessToken = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create refresh token (long-lived)
    const refreshTokenValue = createRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    await createRefreshTokenRecord(user.id, refreshTokenValue);

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔑 JWT tokens created for user');
    }

    // Генерируем CSRF токен для защиты от CSRF атак
    const csrfToken = generateCsrfToken();

    // Create response with tokens in cookies
    const nextResponse = NextResponse.json({
      success: true,
      email: user.email,
      message: 'Авторизация успешна',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
      csrfToken, // Отдаём CSRF token клиенту для отправки в headers
    });

    // Устанавливаем cookies
    let response = setTokenCookie(nextResponse, accessToken);
    response = setRefreshTokenCookie(response, refreshTokenValue);
    response = setCsrfTokenCookie(response, csrfToken);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Response with cookies prepared');
      console.log('✅ Access token cookie set:', accessToken.substring(0, 20) + '...');
      console.log('✅ Refresh token cookie set:', refreshTokenValue.substring(0, 20) + '...');
      console.log('✅ CSRF token cookie set:', csrfToken.substring(0, 20) + '...');
    }
    
    return response;

  } catch (error) {
    console.error('Verify code error:', error);
    
    // БЕЗОПАСНОСТЬ: Логируем internal server error
    try {
      await logSecurityEventFromRequest(request, 'login_failed', {
        metadata: { reason: 'internal_error', error: error instanceof Error ? error.message : 'unknown' },
      });
    } catch (logError) {
      console.error('Failed to log verify code error:', logError);
    }
    
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
