import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, grantUserAccess, revokeUserAccess, getUserAccessHistory } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/access/:userId
 * Получить информацию о доступе конкретного пользователя
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await getCurrentUser(request);
    const resolvedParams = await params;

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

    // Получаем данные пользователя
    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accessFrom: true,
        accessUntil: true,
        accessComment: true,
        accessUpdatedBy: true,
        createdAt: true,
        demoStatus: {
          select: {
            documentsUsed: true,
            documentsLimit: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Получаем историю изменений доступа
    const history = await getUserAccessHistory(resolvedParams.userId);

    // Форматируем ответ согласно спецификации
    const now = new Date();
    let status = 'Нет активного доступа';
    
    if (user.accessUntil) {
      if (now > user.accessUntil) {
        status = `Доступ истёк: ${user.accessUntil.toLocaleDateString('ru-RU')}`;
      } else if (user.accessFrom && now >= user.accessFrom) {
        status = `Активен до: ${user.accessUntil.toLocaleDateString('ru-RU')}`;
      }
    }

    const response = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      current_access: {
        status: user.accessUntil && now <= user.accessUntil ? 'active' : 'inactive',
        start_date: user.accessFrom?.toISOString(),
        end_date: user.accessUntil?.toISOString(),
        updated_at: user.accessUpdatedBy ? new Date().toISOString() : null,
        updated_by: user.accessUpdatedBy,
        admin_note: user.accessComment,
      },
      history: history.map(record => ({
        at: record.createdAt.toISOString(),
        action: record.action,
        start_date: record.accessFrom?.toISOString(),
        end_date: record.accessUntil?.toISOString(),
        by: record.updatedBy,
        note: record.comment,
      })),
      demoStatus: user.demoStatus,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET /api/admin/access/:userId error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/access/:userId
 * Выдать или продлить доступ пользователю
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await getCurrentUser(request);
    const resolvedParams = await params;

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
    const { start_date, end_date, admin_note } = body;

    // Валидация данных
    if (!end_date) {
      return NextResponse.json(
        { error: 'end_date обязателен' },
        { status: 400 }
      );
    }

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = new Date(end_date);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'Дата окончания должна быть не раньше даты начала' },
        { status: 400 }
      );
    }

    // Предоставляем доступ
    const updatedUser = await grantUserAccess(resolvedParams.userId, admin.email, {
      startDate,
      endDate,
      comment: admin_note,
    });

    return NextResponse.json({
      success: true,
      message: 'Доступ успешно предоставлен',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        current_access: {
          status: 'active',
          start_date: updatedUser.accessFrom?.toISOString(),
          end_date: updatedUser.accessUntil?.toISOString(),
          updated_by: updatedUser.accessUpdatedBy,
          admin_note: updatedUser.accessComment,
        },
      },
    });

  } catch (error) {
    console.error('POST /api/admin/access/:userId error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/access/:userId
 * Отключить доступ пользователя
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await getCurrentUser(request);
    const resolvedParams = await params;

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
    const { comment } = body;

    // Отключаем доступ
    const updatedUser = await revokeUserAccess(
      resolvedParams.userId,
      admin.email,
      comment || 'Доступ отключен администратором'
    );

    return NextResponse.json({
      success: true,
      message: 'Доступ успешно отключен',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        current_access: {
          status: 'inactive',
          start_date: updatedUser.accessFrom?.toISOString(),
          end_date: updatedUser.accessUntil?.toISOString(),
          updated_by: updatedUser.accessUpdatedBy,
          admin_note: updatedUser.accessComment,
        },
      },
    });

  } catch (error) {
    console.error('DELETE /api/admin/access/:userId error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
