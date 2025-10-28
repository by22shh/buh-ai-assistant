import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, checkDemoLimit, incrementDocumentUsage } from '@/lib/auth-utils';

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

    // Проверяем демо-лимит (если пользователь не админ)
    if (user.role !== 'admin') {
      const hasLimit = await checkDemoLimit(user.id);
      if (!hasLimit) {
        return NextResponse.json(
          { error: 'Demo limit exceeded' },
          { status: 403 }
        );
      }
    }

    const data = await request.json();

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        organizationId: data.organizationId,
        title: data.title,
        templateCode: data.templateCode,
        templateVersion: data.templateVersion,
        bodyText: data.bodyText,
        requisites: data.requisites,
        hasBodyChat: data.hasBodyChat || false,
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

    // Увеличиваем счётчик использованных документов
    if (user.role !== 'admin') {
      await incrementDocumentUsage(user.id);
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('POST /api/documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
