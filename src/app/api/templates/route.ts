import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/templates — публичный список включенных шаблонов для каталога пользователя
export async function GET(_request: NextRequest) {
  try {
    const templates = await prisma.template.findMany({
      where: { isEnabled: true },
      orderBy: [{ nameRu: 'asc' }],
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('GET /api/templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



