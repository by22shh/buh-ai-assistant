import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/access/search
 * Поиск пользователя по email для выдачи доступа
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser(request);

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      );
    }

    // Ищем пользователя по email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден', found: false },
        { status: 404 }
      );
    }

    // Не позволяем искать админов
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Невозможно управлять доступом администраторов', found: true, user },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      found: true,
      user,
    });

  } catch (error) {
    console.error('POST /api/admin/access/search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

