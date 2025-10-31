import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { createTemplateSchema } from '@/lib/schemas/template';
import { z } from 'zod';

// GET /api/admin/templates — список шаблонов (только для админа)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('GET /api/admin/templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/templates — создать шаблон (только для админа)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json();

    // Валидация с Zod
    const validated = createTemplateSchema.parse(body);

    const created = await prisma.template.create({
      data: {
        code: validated.code,
        nameRu: validated.nameRu,
        shortDescription: validated.shortDescription,
        hasBodyChat: validated.hasBodyChat,
        category: validated.category,
        tags: validated.tags,
        isEnabled: validated.isEnabled,
        version: validated.version,
      },
    });

    return NextResponse.json(created, { status: 201 });
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

    console.error('POST /api/admin/templates error:', error);
    if (error instanceof Error && /Unique constraint/.test(error.message)) {
      return NextResponse.json({ error: 'Шаблон с таким code уже существует' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


