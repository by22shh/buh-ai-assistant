import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { getIP } from './rate-limit';

/**
 * Security Event Types
 */
export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'logout_all'
  | 'token_refresh'
  | 'token_refresh_failed'
  | 'email_change_requested'
  | 'email_change_completed'
  | 'access_denied'
  | 'rate_limit_exceeded'
  | 'csrf_validation_failed'
  | 'suspicious_activity';

/**
 * Security Log Entry
 */
export interface SecurityLogEntry {
  userId?: string;
  event: SecurityEventType;
  ip: string;
  userAgent?: string;
  email?: string;
  metadata?: Record<string, any>;
}

/**
 * Логировать security событие
 */
export async function logSecurityEvent(entry: SecurityLogEntry): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        userId: entry.userId || null,
        event: entry.event,
        ip: entry.ip,
        userAgent: entry.userAgent || null,
        email: entry.email || null,
        metadata: entry.metadata ?? undefined,
      },
    });
  } catch (error) {
    // Не должно падать приложение если логирование не удалось
    console.error('Failed to log security event:', error);
  }
}

/**
 * Логировать security событие из NextRequest
 */
export async function logSecurityEventFromRequest(
  request: NextRequest,
  event: SecurityEventType,
  additionalData?: Partial<SecurityLogEntry>
): Promise<void> {
  const ip = getIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  await logSecurityEvent({
    event,
    ip,
    userAgent,
    ...additionalData,
  });
}

/**
 * Получить security логи пользователя (для админов)
 */
export async function getUserSecurityLogs(
  userId: string,
  limit: number = 50
) {
  return await prisma.securityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Получить последние security события (для админов)
 */
export async function getRecentSecurityLogs(
  limit: number = 100,
  eventType?: SecurityEventType
) {
  return await prisma.securityLog.findMany({
    where: eventType ? { event: eventType } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Получить подозрительную активность (множественные failed attempts)
 */
export async function getSuspiciousActivity(
  timeWindowMinutes: number = 60,
  failedAttemptsThreshold: number = 5
) {
  const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  // Находим IP с множественными failed login attempts
  const failedAttempts = await prisma.securityLog.groupBy({
    by: ['ip'],
    where: {
      event: 'login_failed',
      createdAt: { gte: since },
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gte: failedAttemptsThreshold,
        },
      },
    },
  });

  return failedAttempts;
}

/**
 * Очистка старых логов (для поддержания производительности)
 * Рекомендуется запускать периодически (cron job)
 */
export async function cleanupOldSecurityLogs(daysToKeep: number = 90) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await prisma.securityLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}


