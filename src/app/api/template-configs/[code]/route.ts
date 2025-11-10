import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/template-configs/:code
 * Публичный endpoint для получения конфигурации реквизитов шаблона
 * (доступен всем авторизованным пользователям)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params;
    
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
    console.error('GET /api/template-configs/:code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

