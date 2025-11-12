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

    const { userPrompt, templateName, conversationHistory, currentBodyText } = await request.json();

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
Твоя задача — генерировать ТОЛЬКО текстовое содержание (тело) документа.

Текущий документ: ${templateName || 'Документ'}

КРИТИЧЕСКИ ВАЖНО:
1. Генерируй ТОЛЬКО основной текст документа (тело документа)
2. Никогда не подставляй реальные реквизиты организаций (ИНН, КПП, ОГРН, счета, адреса, email, телефоны, ФИО и т.д.)
3. Если в тексте есть плейсхолдеры вида \${...}, СОХРАНЯЙ их без изменений и на тех же местах. Удаляй плейсхолдер только если пользователь просит убрать соответствующий блок.
4. Не заменяй плейсхолдеры произвольным текстом и не придумывай значения.
5. НЕ добавляй шапку документа с реквизитами
6. НЕ добавляй подписи, печати, даты в конце документа, если это не требуется явно

Что нужно генерировать:
- Основной текст документа (предмет договора, условия, обязательства и т.п.)
- Структуру по разделам и пунктам
- Юридически корректные формулировки на русском языке
- Нумерацию разделов и пунктов

Если предоставлен текущий текст документа:
- Используй его как основу
- Вноси только те правки, о которых просит пользователь
- Сохраняй важные условия, если иное не требуется явно
- Возвращай обновлённую версию целиком, а не дифф

Пример ПРАВИЛЬНОГО ответа для договора:
"1. ПРЕДМЕТ ДОГОВОРА
1.1. Исполнитель обязуется оказать Заказчику услуги по...
2. СТОИМОСТЬ И ПОРЯДОК РАСЧЕТОВ
2.1. Стоимость услуг составляет..."

Пример НЕПРАВИЛЬНОГО ответа (НЕ делай так):
"ООО 'Компания' (ИНН 1234567890, адрес: Москва...)
1. ПРЕДМЕТ ДОГОВОРА
...
Генеральный директор _________________ Иванов И.И."

Если пользователь загрузил файл — используй его как основу, но удали все реквизиты.`;

    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

    if (typeof currentBodyText === 'string' && currentBodyText.trim().length > 0) {
      messages.push({
        role: 'user',
        content: `Это текущая версия документа. Сохраняй структуру и формулировки, если не нужно иное. Плейсхолдеры вида \${...} нужно оставить без изменений, если пользователь явно не просит убрать соответствующий блок. Вноси только запрошенные изменения и возвращай полностью обновлённый текст:\n\n${currentBodyText}`,
      });
    }

    if (Array.isArray(conversationHistory)) {
      conversationHistory.forEach((item: ChatMessage) => {
        if (item?.role && item?.content) {
          messages.push({
            role: item.role,
            content: item.content,
          });
        }
      });
    }

    messages.push({ role: 'user', content: userPrompt });

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
