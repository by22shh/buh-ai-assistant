import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { updateOrganizationSchema } from '@/lib/schemas/organization';
import { z } from 'zod';

/**
 * GET /api/organizations/[id]
 * Получить организацию по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organization = await prisma.organization.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('GET /api/organizations/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]
 * Обновить организацию
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Проверяем, принадлежит ли организация пользователю
    const existing = await prisma.organization.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Валидация с Zod
    const validated = updateOrganizationSchema.parse(body);

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        // Основные данные
        is_default: validated.is_default ?? undefined,
        subject_type: validated.subject_type,
        name_full: validated.name_full,
        name_short: validated.name_short ?? undefined,
        inn: validated.inn,
        kpp: validated.kpp ?? undefined,
        ogrn: validated.ogrn ?? undefined,
        ogrnip: validated.ogrnip ?? undefined,
        okpo: validated.okpo ?? undefined,
        okved: validated.okved ?? undefined,
        
        // Адреса и контакты
        address_legal: validated.address_legal,
        address_postal: validated.address_postal ?? undefined,
        phone: validated.phone ?? undefined,
        email: validated.email,
        website: validated.website ?? undefined,
        
        // Руководитель и полномочия
        head_title: validated.head_title,
        head_fio: validated.head_fio,
        authority_base: validated.authority_base,
        poa_number: validated.poa_number ?? undefined,
        poa_date: validated.poa_date ?? undefined,
        
        // Банковские реквизиты
        bank_bik: validated.bank_bik,
        bank_name: validated.bank_name,
        bank_ks: validated.bank_ks,
        bank_rs: validated.bank_rs,
        
        // Дополнительная информация
        seal_note: validated.seal_note ?? undefined,
        notes: validated.notes ?? undefined,
      },
    });

    return NextResponse.json(organization);
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

    console.error('PUT /api/organizations/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * Удалить организацию
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Проверяем, принадлежит ли организация пользователю
    const existing = await prisma.organization.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    await prisma.organization.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/organizations/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
