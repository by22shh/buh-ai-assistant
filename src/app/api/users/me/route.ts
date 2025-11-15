import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, createEmailVerificationRequest } from '@/lib/auth-utils';
import { updateUserSchema } from '@/lib/schemas/user';
import { z } from 'zod';
import nodemailer from 'nodemailer';

/**
 * GET /api/users/me
 * Получить профиль текущего пользователя
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/users/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/me
 * Обновить профиль текущего пользователя
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Валидация с Zod
    const validated = updateUserSchema.parse(body);

    // Email нельзя изменять никому
    if (validated.email && validated.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email нельзя изменить' },
        { status: 403 }
      );
    }

    // Если пытаются сменить email и он отличается от текущего (старая логика, но теперь всегда будет заблокирована выше)
    if (false && validated.email && validated.email.toLowerCase() !== user.email?.toLowerCase()) {
      // Создаём запрос на верификацию нового email
      try {
        const { verification, code, token } = await createEmailVerificationRequest(
          user.id,
          validated.email
        );

        // Отправляем код на новый email
        const emailUser = process.env.EMAIL_USER;
        const emailPassword = process.env.EMAIL_PASSWORD;

        if (emailUser && emailPassword) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: emailUser,
              pass: emailPassword,
            },
          });

          await transporter.sendMail({
            from: `"Бухгалтерский помощник" <${emailUser}>`,
            to: validated.email,
            subject: 'Подтверждение смены email',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Подтверждение смены email</h2>
                <p>Вы запросили смену email на ${validated.email}</p>
                <p>Ваш код подтверждения:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                  ${code}
                </div>
                <p style="color: #666;">Код действителен 10 минут.</p>
                <p style="color: #999; font-size: 12px;">Если вы не запрашивали смену email, просто проигнорируйте это письмо.</p>
              </div>
            `,
          });
        }

        // Обновляем другие поля профиля (кроме email)
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: validated.firstName ?? undefined,
            lastName: validated.lastName ?? undefined,
            phone: validated.phone ?? undefined,
            position: validated.position ?? undefined,
            company: validated.company ?? undefined,
          },
          include: {
            demoStatus: true,
          },
        });

        return NextResponse.json({
          ...updatedUser,
          emailChangePending: true,
          verificationToken: token,
          message: 'Код подтверждения отправлен на новый email. Используйте его для завершения смены email.',
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Email уже используется')) {
          return NextResponse.json(
            { error: 'Email уже используется другим пользователем' },
            { status: 409 }
          );
        }
        throw error;
      }
    }

    // Если email не меняется, просто обновляем профиль
    // Email нельзя изменять никому, поэтому не включаем его в updateData
    const updateData: any = {
      firstName: validated.firstName ?? undefined,
      lastName: validated.lastName ?? undefined,
      phone: validated.phone ?? undefined,
      position: validated.position ?? undefined,
      company: validated.company ?? undefined,
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        demoStatus: true,
      },
    });

    return NextResponse.json(updatedUser);
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

    console.error('PUT /api/users/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
