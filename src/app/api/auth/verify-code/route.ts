import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { upsertUser, createRefreshTokenRecord } from '@/lib/auth-utils';
import { createToken, createRefreshToken, setTokenCookie, setRefreshTokenCookie } from '@/lib/jwt';
import { checkAuthRateLimit, getIP } from '@/lib/rate-limit';

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

    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email и код обязательны' },
        { status: 400 }
      );
    }

    // Find valid login token
    const loginToken = await prisma.loginToken.findFirst({
      where: {
        email: email.toLowerCase(),
        code: code,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!loginToken) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ Invalid or expired code');
      }
      return NextResponse.json(
        { success: false, error: 'Неверный или истекший код' },
        { status: 400 }
      );
    }

    // Mark token as used
    await prisma.loginToken.update({
      where: { id: loginToken.id },
      data: { used: true }
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Code verified');
    }

    // Create or update user
    const user = await upsertUser(email.toLowerCase(), {
      emailVerified: true
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
    });

    const responseWithAccessCookie = setTokenCookie(nextResponse, accessToken);
    const responseWithBothCookies = setRefreshTokenCookie(responseWithAccessCookie, refreshTokenValue);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Response with cookies prepared');
      console.log('✅ Access token cookie set:', accessToken.substring(0, 20) + '...');
      console.log('✅ Refresh token cookie set:', refreshTokenValue.substring(0, 20) + '...');
    }
    
    return responseWithBothCookies;

  } catch (error) {
    console.error('Verify code error');
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
