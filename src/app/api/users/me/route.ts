import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { updateUserSchema } from '@/lib/schemas/user';
import { z } from 'zod';

/**
 * GET /api/users/me
 * Получить профиль текущего пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/users/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/me
 * Обновить профиль текущего пользователя
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Валидация с Zod
    const validated = updateUserSchema.parse(body);

    // Email нельзя изменять никому
    if (validated.email && validated.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email нельзя изменить' },
        { status: 403 }
      );
    }

    // Если email не меняется, просто обновляем профиль
    // Email нельзя изменять никому, поэтому не включаем его в updateData
    const updateData: any = {
      firstName: validated.firstName ?? undefined,
      lastName: validated.lastName ?? undefined,
      phone: validated.phone ?? undefined,
      position: validated.position ?? undefined,
      company: validated.company ?? undefined,
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        demoStatus: true,
      },
    });

    return NextResponse.json(updatedUser);
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

    console.error('PUT /api/users/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
