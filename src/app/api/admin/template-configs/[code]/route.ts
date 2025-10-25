import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth-utils';

/**
 * GET /api/admin/template-configs/[code]
 * Получить конфигурацию реквизитов шаблона
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Проверка прав администратора
    const admin = await isAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const config = await prisma.templateConfig.findUnique({
      where: { templateCode: code },
    });

    // Если конфига нет, возвращаем null (это нормально)
    return NextResponse.json(config || { templateCode: code, requisitesConfig: null });
  } catch (error) {
    console.error('GET /api/admin/template-configs/[code] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/template-configs/[code]
 * Обновить конфигурацию реквизитов шаблона
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Проверка прав администратора
    const admin = await isAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { requisitesConfig } = await request.json();

    const config = await prisma.templateConfig.upsert({
      where: { templateCode: code },
      create: {
        templateCode: code,
        requisitesConfig,
      },
      update: {
        requisitesConfig,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('PUT /api/admin/template-configs/[code] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
