import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { getTokenFromRequest, verifyToken } from './jwt';
import crypto from 'crypto';

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
    select: {
      id: true,
      email: true,
      emailVerified: true,
      role: true,
      firstName: true,
      lastName: true,
      phone: true,
      position: true,
      company: true,
      createdAt: true,
      updatedAt: true,
      demoStatus: {
        select: {
          documentsUsed: true,
          documentsLimit: true,
          isActive: true,
          expiresAt: true,
        }
      },
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
  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin = adminEmail ? email.toLowerCase() === adminEmail.toLowerCase() : false;

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

/**
 * Проверить временный доступ пользователя
 */
export async function checkAccessPeriod(userId: string): Promise<{ 
  hasAccess: boolean; 
  status: 'active' | 'expired' | 'not_granted' | 'not_started';
  message?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessFrom: true,
      accessUntil: true,
      role: true,
    },
  });

  if (!user) {
    return { hasAccess: false, status: 'not_granted', message: 'Пользователь не найден' };
  }

  // Админы имеют неограниченный доступ
  if (user.role === 'admin') {
    return { hasAccess: true, status: 'active' };
  }

  const now = new Date();
  
  // Если доступ не назначен
  if (!user.accessFrom || !user.accessUntil) {
    return { hasAccess: false, status: 'not_granted', message: 'Доступ не предоставлен' };
  }
  
  // Если доступ еще не начался
  if (now < user.accessFrom) {
    return { 
      hasAccess: false, 
      status: 'not_started', 
      message: `Доступ начнется ${user.accessFrom.toLocaleDateString('ru-RU')}` 
    };
  }
  
  // Если доступ истек
  if (now > user.accessUntil) {
    return { 
      hasAccess: false, 
      status: 'expired', 
      message: `Доступ истек ${user.accessUntil.toLocaleDateString('ru-RU')}` 
    };
  }
  
  // Доступ активен
  return { hasAccess: true, status: 'active' };
}

/**
 * Предоставить или продлить доступ пользователю (только для админа)
 */
export async function grantUserAccess(
  userId: string,
  adminEmail: string,
  data: {
    startDate: Date;
    endDate: Date;
    comment?: string;
  }
) {
  const { startDate, endDate, comment } = data;

  // Валидация дат
  if (endDate <= startDate) {
    throw new Error('Дата окончания должна быть позже даты начала');
  }

  // Обновляем пользователя
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      accessFrom: startDate,
      accessUntil: endDate,
      accessComment: comment,
      accessUpdatedBy: adminEmail,
    },
    include: {
      demoStatus: true,
    },
  });

  // Записываем в историю
  await prisma.accessHistory.create({
    data: {
      userId,
      action: 'grant_or_extend',
      updatedBy: adminEmail,
      comment,
      accessFrom: startDate,
      accessUntil: endDate,
    },
  });

  return updatedUser;
}

/**
 * Отключить доступ пользователя (только для админа)
 */
export async function revokeUserAccess(userId: string, adminEmail: string, comment?: string) {
  const now = new Date();

  // Обновляем пользователя - устанавливаем accessUntil на текущее время
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      accessUntil: now,
      accessComment: comment || 'Доступ отключен администратором',
      accessUpdatedBy: adminEmail,
    },
  });

  // Записываем в историю
  await prisma.accessHistory.create({
    data: {
      userId,
      action: 'revoke',
      accessFrom: null,
      accessUntil: now,
      comment: comment || 'Доступ отключен администратором',
      updatedBy: adminEmail,
    },
  });

  return updatedUser;
}

/**
 * Получить историю изменений доступа пользователя
 */
export async function getUserAccessHistory(userId: string) {
  return await prisma.accessHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20, // Последние 20 записей
  });
}

/**
 * Получить список пользователей для управления доступом (только для админа)
 */
export async function getUsersForAccessManagement() {
  return await prisma.user.findMany({
    where: {
      role: 'user', // Только обычные пользователи
    },
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
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Создать refresh токен в БД
 */
export async function createRefreshTokenRecord(userId: string, token: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

  return await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

/**
 * Проверить и получить refresh токен из БД
 */
export async function validateRefreshToken(token: string) {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
        },
      },
    },
  });

  if (!refreshToken) {
    return null;
  }

  // Проверяем, не истёк ли токен
  if (refreshToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: refreshToken.id } });
    return null;
  }

  // Проверяем, не отозван ли токен
  if (refreshToken.revoked) {
    return null;
  }

  return refreshToken;
}

/**
 * Отозвать refresh токен
 */
export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.updateMany({
    where: { token, revoked: false },
    data: {
      revoked: true,
      revokedAt: new Date(),
    },
  });
}

/**
 * Отозвать все refresh токены пользователя
 */
export async function revokeAllUserRefreshTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: {
      revoked: true,
      revokedAt: new Date(),
    },
  });
}

/**
 * Удалить истёкшие refresh токены
 */
export async function cleanupExpiredRefreshTokens() {
  await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revoked: true, revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Удаляем отозванные старше 30 дней
      ],
    },
  });
}

/**
 * Создать запрос на смену email (отправляет код подтверждения на новый email)
 */
export async function createEmailVerificationRequest(
  userId: string,
  newEmail: string
) {
  // Проверяем, не занят ли email другим пользователем
  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail.toLowerCase() },
  });

  if (existingUser && existingUser.id !== userId) {
    throw new Error('Email уже используется другим пользователем');
  }

  // Генерируем код и токен
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

  // Удаляем старые неиспользованные запросы
  await prisma.emailVerification.deleteMany({
    where: {
      userId,
      used: false,
      expiresAt: { lt: new Date() },
    },
  });

  // Создаём новый запрос
  const verification = await prisma.emailVerification.create({
    data: {
      userId,
      newEmail: newEmail.toLowerCase(),
      code,
      token,
      expiresAt,
    },
  });

  return { verification, code, token };
}

/**
 * Проверить и подтвердить смену email
 */
export async function verifyEmailChange(token: string, code: string) {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      token,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });

  if (!verification) {
    return null;
  }

  // Проверяем, не занят ли email
  const existingUser = await prisma.user.findUnique({
    where: { email: verification.newEmail },
  });

  if (existingUser && existingUser.id !== verification.userId) {
    throw new Error('Email уже используется другим пользователем');
  }

  // Обновляем email пользователя
  const updatedUser = await prisma.user.update({
    where: { id: verification.userId },
    data: {
      email: verification.newEmail,
      emailVerified: true,
    },
  });

  // Отмечаем верификацию как использованную
  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { used: true },
  });

  // Отзываем все refresh токены пользователя при смене email
  await revokeAllUserRefreshTokens(verification.userId);

  return { user: updatedUser, verification };
}
