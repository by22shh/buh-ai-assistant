import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { getTokenFromRequest, verifyToken } from './jwt';

/**
 * Получить текущего пользователя из JWT токена
 */
export async function getCurrentUser(request: NextRequest) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      demoStatus: true,
    },
  });

  return user;
}

/**
 * Создать или обновить пользователя при входе
 */
export async function upsertUser(email: string, data?: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  company?: string;
  emailVerified?: boolean;
}) {
  // Проверяем, является ли email админским
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com';
  const isAdmin = email.toLowerCase() === adminEmail.toLowerCase();

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      emailVerified: data?.emailVerified ?? true,
      role: isAdmin ? 'admin' : 'user',
      ...data,
      demoStatus: {
        create: {
          documentsUsed: 0,
          documentsLimit: 5,
          isActive: true,
        },
      },
    },
    update: {
      emailVerified: data?.emailVerified ?? true,
      ...data
    },
    include: {
      demoStatus: true,
    },
  });

  return user;
}

/**
 * Проверить, является ли пользователь администратором
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user?.role === 'admin';
}

/**
 * Проверить демо-лимит пользователя
 */
export async function checkDemoLimit(userId: string): Promise<boolean> {
  const demoStatus = await prisma.demoStatus.findUnique({
    where: { userId },
  });

  if (!demoStatus) return false;

  return demoStatus.isActive && demoStatus.documentsUsed < demoStatus.documentsLimit;
}

/**
 * Увеличить счётчик использованных документов
 */
export async function incrementDocumentUsage(userId: string) {
  const demoStatus = await prisma.demoStatus.findUnique({
    where: { userId },
  });

  if (!demoStatus) return;

  await prisma.demoStatus.update({
    where: { userId },
    data: {
      documentsUsed: demoStatus.documentsUsed + 1,
    },
  });
}
