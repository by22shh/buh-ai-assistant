import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { templateConfigSchema } from '@/lib/schemas/template';
import { z } from 'zod';

/**
 * GET /api/admin/template-configs/:code
 * Получить конфигурацию реквизитов для шаблона
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const resolvedParams = await params;
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const config = await prisma.templateConfig.findUnique({
      where: { templateCode: resolvedParams.code },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Template configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);

  } catch (error) {
    console.error('GET /api/admin/template-configs/:code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/template-configs/:code
 * Создать или обновить конфигурацию реквизитов для шаблона
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const resolvedParams = await params;
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Валидация с Zod
    const validated = templateConfigSchema.parse(body);

    // Валидируем, что код в URL совпадает с кодом в теле запроса
    if (validated.templateCode !== resolvedParams.code) {
      return NextResponse.json(
        { error: 'Template code mismatch' },
        { status: 400 }
      );
    }

    // Создаем или обновляем конфигурацию
    const config = await prisma.templateConfig.upsert({
      where: { templateCode: resolvedParams.code },
      update: { requisitesConfig: validated.requisitesConfig || null },
      create: { 
        templateCode: resolvedParams.code,
        requisitesConfig: validated.requisitesConfig || null
      },
    });

    return NextResponse.json(config);

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

    console.error('PUT /api/admin/template-configs/:code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/template-configs/:code
 * Удалить конфигурацию реквизитов для шаблона (сброс к умолчанию)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const resolvedParams = await params;
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await prisma.templateConfig.delete({
      where: { templateCode: resolvedParams.code },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE /api/admin/template-configs/:code error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Template configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}