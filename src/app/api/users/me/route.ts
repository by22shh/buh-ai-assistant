import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

/**
 * GET /api/users/me
 * Получить профиль текущего пользователя
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/users/me - Checking authentication');
    console.log('🍪 Cookies received:', request.cookies.getAll());
    
    const user = await getCurrentUser(request);

    if (!user) {
      console.log('❌ No user found - unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', { id: user.id, email: user.email, role: user.role });
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

    const data = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        position: data.position,
        company: data.company,
      },
      include: {
        demoStatus: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PUT /api/users/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
