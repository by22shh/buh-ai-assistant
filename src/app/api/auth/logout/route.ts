import { NextResponse } from 'next/server';
import { clearTokenCookie } from '@/lib/jwt';

/**
 * POST /api/auth/logout
 * Выход из системы (удаление JWT токена)
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Вы вышли из системы',
  });

  return clearTokenCookie(response);
}
