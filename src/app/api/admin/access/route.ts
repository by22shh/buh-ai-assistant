import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUsersForAccessManagement } from '@/lib/auth-utils';

/**
 * GET /api/admin/access
 * Получить список пользователей для управления доступом (только для админа)
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

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const users = await getUsersForAccessManagement();

    // Форматируем данные согласно спецификации
    const formattedUsers = users.map(user => {
      const now = new Date();
      let status = 'Нет доступа';
      
      if (user.accessUntil) {
        if (now > user.accessUntil) {
          status = `Доступ истёк: ${user.accessUntil.toLocaleDateString('ru-RU')}`;
        } else if (user.accessFrom && now >= user.accessFrom) {
          status = `Активен до: ${user.accessUntil.toLocaleDateString('ru-RU')}`;
        } else if (user.accessFrom && now < user.accessFrom) {
          status = `Начнется: ${user.accessFrom.toLocaleDateString('ru-RU')}`;
        }
      }

      return {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status,
        current_access: {
          status: user.accessUntil && now <= user.accessUntil ? 'active' : 'inactive',
          start_date: user.accessFrom?.toISOString(),
          end_date: user.accessUntil?.toISOString(),
          updated_by: user.accessUpdatedBy,
          admin_note: user.accessComment,
        },
        demoStatus: user.demoStatus,
        createdAt: user.createdAt.toISOString(),
      };
    });

    return NextResponse.json(formattedUsers);

  } catch (error) {
    console.error('GET /api/admin/access error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
