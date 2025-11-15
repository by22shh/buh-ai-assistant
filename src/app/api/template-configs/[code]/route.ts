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
    
    const [config, templateBody] = await Promise.all([
      prisma.templateConfig.findUnique({
        where: { templateCode: resolvedParams.code },
      }),
      prisma.templateBody.findUnique({
        where: { templateCode: resolvedParams.code },
        select: { placeholders: true },
      }),
    ]);

    if (!config) {
      return NextResponse.json(
        { error: 'Template configuration not found' },
        { status: 404 }
      );
    }

    // Объединяем placeholderBindings из конфигурации и placeholders из templateBody
    const requisitesConfig = config.requisitesConfig as any;
    const placeholderBindingsFromConfig = requisitesConfig?.placeholderBindings || [];
    const placeholdersFromBody = Array.isArray(templateBody?.placeholders) ? templateBody.placeholders : [];

    // Если в конфигурации нет placeholderBindings, но есть в templateBody, используем их
    let finalPlaceholderBindings = placeholderBindingsFromConfig;
    if (placeholderBindingsFromConfig.length === 0 && placeholdersFromBody.length > 0) {
      // Преобразуем placeholders из templateBody в формат placeholderBindings
      finalPlaceholderBindings = placeholdersFromBody.map((placeholder: any) => ({
        name: placeholder.name || placeholder.normalized,
        label: placeholder.label || placeholder.suggestedLabel || placeholder.name || placeholder.normalized,
      }));
    }

    // Если есть placeholderBindings, добавляем их в requisitesConfig
    if (finalPlaceholderBindings.length > 0) {
      if (!requisitesConfig) {
        return NextResponse.json({
          ...config,
          requisitesConfig: {
            placeholderBindings: finalPlaceholderBindings,
          },
        });
      }

      return NextResponse.json({
        ...config,
        requisitesConfig: {
          ...requisitesConfig,
          placeholderBindings: finalPlaceholderBindings,
        },
      });
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



