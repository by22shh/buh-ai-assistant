import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

/**
 * POST /api/auth/send-code
 * Отправка 6-значного кода на email для входа
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email обязателен' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate token (for verification)
    const token = crypto.randomBytes(32).toString('hex');

    // Expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete old unused tokens for this email
    await prisma.loginToken.deleteMany({
      where: {
        email: email.toLowerCase(),
        used: false,
        expiresAt: {
          lt: new Date()
        }
      }
    });

    // Create new token with code
    await prisma.loginToken.create({
      data: {
        email: email.toLowerCase(),
        code: code,
        token: token,
        expiresAt: expiresAt,
        used: false,
      }
    });

    console.log('✅ Login code generated:', {
      email: email.toLowerCase(),
      code: code,
      token: token.substring(0, 10) + '...',
      expiresAt: expiresAt.toISOString()
    });

    // Send email with code via SMTP
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;

      if (!emailUser || !emailPassword) {
        console.warn('⚠️ Email credentials not configured - returning code in response');
        return NextResponse.json({
          success: true,
          message: 'Код сгенерирован (email не настроен)',
          token: token,
          code: code // Показываем код когда email не настроен
        });
      }

      // Создаем SMTP transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      // Отправляем email
      await transporter.sendMail({
        from: `"Бухгалтерский помощник" <${emailUser}>`,
        to: email,
        subject: 'Код для входа',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Код для входа</h2>
            <p>Ваш код для входа в систему:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #666;">Код действителен 10 минут.</p>
            <p style="color: #999; font-size: 12px;">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
          </div>
        `,
      });

      console.log('✅ Email sent successfully to:', email);

      return NextResponse.json({
        success: true,
        message: 'Код отправлен на email',
        token: token,
      });

    } catch (emailError) {
      console.error('❌ Email send error:', emailError);

      // Если ошибка отправки - возвращаем код для возможности входа
      return NextResponse.json({
        success: true,
        message: 'Код сгенерирован (ошибка отправки email)',
        token: token,
        code: code,
      });
    }

  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
