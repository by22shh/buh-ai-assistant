import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, checkDemoLimit, checkAccessPeriod, incrementDocumentUsage } from '@/lib/auth-utils';
import { createDocumentSchema } from '@/lib/schemas/document';
import { z } from 'zod';

/**
 * GET /api/documents
 * Получить список документов пользователя
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

    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        templateCode: true,
        templateVersion: true,
        bodyText: true,
        requisites: true,
        hasBodyChat: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name_full: true,
            name_short: true,
            inn: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('GET /api/documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents
 * Создать новый документ
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Проверяем доступ (если пользователь не админ)
    if (user.role !== 'admin') {
      // Сначала проверяем временный доступ по времени
      const accessCheck = await checkAccessPeriod(user.id);
      
      if (!accessCheck.hasAccess) {
        // Если нет доступа по времени - проверяем демо-лимит
        if (accessCheck.status === 'not_granted') {
          const hasDemoLimit = await checkDemoLimit(user.id);
          if (!hasDemoLimit) {
            return NextResponse.json(
              { error: 'Demo limit exceeded' },
              { status: 403 }
            );
          }
        } else {
          // Доступ истек или не начался
          return NextResponse.json(
            { 
              error: 'Access Expired',
              message: accessCheck.message 
            },
            { status: 403 }
          );
        }
      }
      // Если есть доступ по времени - пропускаем проверку демо-лимита
    }

    const body = await request.json();

    // Валидация с Zod
    const validated = createDocumentSchema.parse(body);

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        organizationId: validated.organizationId || undefined,
        title: validated.title || undefined,
        templateCode: validated.templateCode,
        templateVersion: validated.templateVersion,
        bodyText: validated.bodyText || undefined,
        requisites: validated.requisites || undefined,
        hasBodyChat: validated.hasBodyChat || false,
      },
      select: {
        id: true,
        title: true,
        templateCode: true,
        templateVersion: true,
        bodyText: true,
        requisites: true,
        hasBodyChat: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name_full: true,
            name_short: true,
            inn: true,
          }
        },
      },
    });

    // Увеличиваем счётчик использованных документов ТОЛЬКО для demo пользователей
    // (у кого нет временного платного доступа)
    if (user.role !== 'admin') {
      const accessCheck = await checkAccessPeriod(user.id);
      
      // Увеличиваем счётчик только если пользователь в demo режиме (нет платного доступа)
      if (accessCheck.status === 'not_granted') {
        await incrementDocumentUsage(user.id);
      }
    }

    return NextResponse.json(document, { status: 201 });
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

    console.error('POST /api/documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
