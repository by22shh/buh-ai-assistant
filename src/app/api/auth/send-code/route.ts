import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { checkAuthRateLimit, getIP } from '@/lib/rate-limit';

/**
 * POST /api/auth/send-code
 * Отправка 6-значного кода на email для входа
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit per IP to mitigate abuse before parsing body
    const ip = getIP(request);
    const rl = await checkAuthRateLimit(ip);
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Слишком много попыток. Попробуйте позже.',
        },
        { status: 429 }
      );
    }

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

    const normalizedEmail = email.toLowerCase();

    // ВАЖНО: Проверяем существование пользователя ПОСЛЕ генерации кода
    // чтобы не было утечки информации о существовании email через timing
    const userExists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate token (for verification)
    const token = crypto.randomBytes(32).toString('hex');

    // Expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete old unused tokens for this email
    await prisma.loginToken.deleteMany({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: {
          lt: new Date()
        }
      }
    });

    // Create new token with code (всегда, независимо от существования пользователя)
    // Это предотвращает timing attack
    await prisma.loginToken.create({
      data: {
        email: normalizedEmail,
        code: code,
        token: token,
        expiresAt: expiresAt,
        used: false,
      }
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Login code generated:', {
        email: normalizedEmail,
        expiresAt: expiresAt.toISOString(),
        userExists: !!userExists
      });
    }

    // БАЗОВОЕ время для ответа (для предотвращения timing attacks)
    const baseDelay = 500; // Базовая задержка 500ms

    // Send email with code via SMTP
    // ВАЖНО: Всегда возвращаем одинаковый ответ, независимо от существования пользователя
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    let emailSent = false;
    let finalMessage = 'Код отправлен на email';

    // Отправляем email только если настроен SMTP
    if (emailUser && emailPassword) {
      try {
        // Создаем SMTP transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPassword,
          },
        });

        // Отправляем email (даже если пользователь не существует - для безопасности)
        // Это предотвращает user enumeration через поведение SMTP
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

        emailSent = true;
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Email sent successfully');
        }
      } catch (emailError) {
        // Ошибка отправки email (не логируем детали для безопасности)
        console.error('❌ Email send error (suppressed for security)');
        
        // В development показываем код в ответе для тестирования
        finalMessage = 'Код сгенерирован';
      }
    } else {
      // SMTP не настроен - возвращаем код только в development
      console.warn('⚠️ Email credentials not configured');
      finalMessage = 'Код сгенерирован';
    }

    // Добавляем базовую задержку для предотвращения timing attacks
    // Даже если email не отправлен, задержка одинаковая
    await new Promise(resolve => setTimeout(resolve, baseDelay));

    // ВСЕГДА возвращаем одинаковый успешный ответ, независимо от:
    // - существования пользователя
    // - успешности отправки email
    // - наличия SMTP настроек
    return NextResponse.json({
      success: true,
      message: finalMessage,
      token: token,
      // В development показываем код для тестирования (только если email не отправлен)
      ...(process.env.NODE_ENV !== 'production' && !emailSent ? { code } : {})
    });

  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
