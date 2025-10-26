import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

/**
 * GET /api/users/me
 * Получить профиль текущего пользователя
 */
export async function GET(request: NextRequest) {
  try {
    console.log('========================================');
    console.log('📥 GET /api/users/me - START');
    console.log('🌐 URL:', request.url);
    console.log('🍪 All Cookies:', request.cookies.getAll());
    console.log('🔑 Cookie names:', request.cookies.getAll().map(c => c.name));
    console.log('📋 Headers:', Object.fromEntries(request.headers.entries()));
    
    // Пробуем получить токен вручную
    const tokenCookie = request.cookies.get('token');
    console.log('🎯 Token cookie:', tokenCookie ? 'FOUND' : 'NOT FOUND');
    if (tokenCookie) {
      console.log('📝 Token value preview:', tokenCookie.value.substring(0, 50) + '...');
    }
    
    const user = await getCurrentUser(request);

    if (!user) {
      console.log('❌ No user found - getCurrentUser returned null');
      console.log('========================================');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', { id: user.id, email: user.email, role: user.role });
    console.log('========================================');
    return NextResponse.json(user);
  } catch (error) {
    console.error('❌ GET /api/users/me error:', error);
    console.log('========================================');
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
