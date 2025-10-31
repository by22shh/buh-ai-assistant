import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth-utils';
import { checkAiChatRateLimit } from '@/lib/rate-limit';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * POST /api/ai/chat
 * Генерация текста документа через OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting для AI чата
    const rateLimitResult = await checkAiChatRateLimit(user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too Many Requests',
          message: 'Слишком много запросов к AI. Попробуйте позже.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    const { userPrompt, templateName, conversationHistory } = await request.json();

    if (!userPrompt) {
      return NextResponse.json(
        { success: false, error: 'userPrompt обязателен' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Проверка конфигурации
    if (!apiKey || apiKey === 'sk-your_openai_api_key_here') {
      console.error('OpenAI не настроен');
      return NextResponse.json(
        { success: false, error: 'ИИ-сервис не настроен. Добавьте OPENAI_API_KEY в переменные окружения.' },
        { status: 503 }
      );
    }

    // Вызов OpenAI API
    const openai = new OpenAI({
      apiKey: apiKey
    });

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10);
    const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');

    // Системный промпт
    const systemPrompt = `Ты — профессиональный ИИ-помощник для бухгалтеров.
Твоя задача — помогать составлять юридически корректные тексты документов.

Текущий документ: ${templateName || 'Документ'}

Важные правила:
1. Используй корректную юридическую терминологию РФ
2. Структурируй текст по разделам и пунктам
3. Избегай неоднозначных формулировок
4. НЕ включай в ответ реквизиты организаций (ИНН, ОГРН, счета, адреса, ФИО, email, телефоны)
5. Отвечай на русском языке
6. Если пользователь загрузил файл — используй его как основу для редактирования

Формат ответа:
- Начни с краткого описания что ты сделал
- Затем предоставь готовый текст документа
- Используй нумерацию разделов и пунктов`;

    // Формируем историю сообщений
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: userPrompt }
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    const generatedText = completion.choices[0]?.message?.content || '';

    if (!generatedText) {
      return NextResponse.json(
        { success: false, error: 'ИИ не вернул ответ' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      text: generatedText,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error('OpenAI API error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка при генерации текста' },
      { status: 500 }
    );
  }
}
