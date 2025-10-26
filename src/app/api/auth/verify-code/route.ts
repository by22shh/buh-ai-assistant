import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { upsertUser } from '@/lib/auth-utils';
import { createToken, setTokenCookie } from '@/lib/jwt';

/**
 * POST /api/auth/verify-code
 * Проверка 6-значного кода и выдача JWT токена
 */
export async function POST(request: NextRequest) {
  try {
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
      console.log('❌ Invalid or expired code:', { email, code });
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

    console.log('✅ Code verified:', { email, code });

    // Create or update user
    const user = await upsertUser(email.toLowerCase(), {
      emailVerified: true
    });

    // Create JWT token
    const jwtToken = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create response with token in cookie
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

    return setTokenCookie(nextResponse, jwtToken);

  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
