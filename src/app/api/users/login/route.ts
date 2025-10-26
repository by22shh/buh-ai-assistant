import { NextRequest, NextResponse } from 'next/server';
import { upsertUser } from '@/lib/auth-utils';

/**
 * POST /api/users/login
 * Создать или обновить пользователя при входе
 * DEPRECATED: Use /api/auth/verify-code instead
 */
export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, phone, position, company } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await upsertUser(email, {
      firstName,
      lastName,
      phone,
      position,
      company,
      emailVerified: true,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('POST /api/users/login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
