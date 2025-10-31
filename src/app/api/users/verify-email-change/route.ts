import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyEmailChange } from '@/lib/auth-utils';
import { z } from 'zod';

const verifyEmailChangeSchema = z.object({
  token: z.string().min(1, 'Token обязателен'),
  code: z.string().regex(/^\d{6}$/, 'Код должен быть 6-значным'),
});

/**
 * POST /api/users/verify-email-change
 * Подтвердить смену email с помощью кода
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Валидация
    const validated = verifyEmailChangeSchema.parse(body);

    // Подтверждаем смену email
    const result = await verifyEmailChange(validated.token, validated.code);

    if (!result) {
      return NextResponse.json(
        { error: 'Неверный или истёкший код подтверждения' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email успешно изменён',
      user: result.user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Email уже используется')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error('POST /api/users/verify-email-change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

