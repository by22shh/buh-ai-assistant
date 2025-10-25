/**
 * OpenAI Integration Service
 * Документация: https://platform.openai.com/docs
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Генерация текста документа через OpenAI
 */
export async function generateDocumentText(
  userPrompt: string,
  templateName: string,
  conversationHistory: ChatMessage[] = []
): Promise<OpenAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-your_openai_api_key_here') {
    console.error('OpenAI API key not configured');
    return {
      success: false,
      error: 'ИИ-сервис не настроен. Добавьте OPENAI_API_KEY в переменные окружения.'
    };
  }

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10);
    const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');

    // Системный промпт
    const systemPrompt = `Ты — профессиональный ИИ-помощник для бухгалтеров.
Твоя задача — помогать составлять юридически корректные тексты документов.

Текущий документ: ${templateName}

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
      ...conversationHistory,
      { role: 'user', content: userPrompt }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || '';

    return {
      success: true,
      text: generatedText
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при генерации текста'
    };
  }
}

/**
 * Проверка наличия API ключа
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your_openai_api_key_here';
}
