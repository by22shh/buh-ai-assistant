import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { updateTemplateSchema } from '@/lib/schemas/template';
import { z } from 'zod';

// GET /api/admin/templates/:code — получить шаблон по коду (только для админа)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { code } = await params;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const template = await prisma.template.findUnique({ where: { code } });
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    return NextResponse.json(template);
  } catch (error) {
    console.error('GET /api/admin/templates/:code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/templates/:code — обновить шаблон (только для админа)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { code } = await params;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json();

    // Валидация с Zod
    const validated = updateTemplateSchema.parse(body);

    const updated = await prisma.template.update({
      where: { code },
      data: {
        nameRu: validated.nameRu,
        shortDescription: validated.shortDescription,
        hasBodyChat: validated.hasBodyChat,
        category: validated.category,
        tags: validated.tags,
        isEnabled: validated.isEnabled,
        version: validated.version,
      },
    });

    return NextResponse.json(updated);
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

    console.error('PUT /api/admin/templates/:code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/templates/:code — удалить шаблон (только для админа)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { code } = await params;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    await prisma.template.delete({ where: { code } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/templates/:code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


