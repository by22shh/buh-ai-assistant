import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

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

    const data = await request.json();

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name_full: data.name_full,
        name_short: data.name_short,
        inn: data.inn,
        kpp: data.kpp,
        ogrn: data.ogrn,
        legal_address: data.legal_address,
        postal_address: data.postal_address,
        phone: data.phone,
        email: data.email,
        bank_name: data.bank_name,
        bank_bik: data.bank_bik,
        bank_corr_account: data.bank_corr_account,
        settlement_account: data.settlement_account,
        ceo_name: data.ceo_name,
        ceo_position: data.ceo_position,
        accountant_name: data.accountant_name,
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
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
