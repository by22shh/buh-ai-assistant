# 🔧 ДЕТАЛЬНЫЕ РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ

## 🔴 ПРИОРИТЕТ 1: КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ

### 1. Добавить пагинацию в GET endpoints

**Проблема:** Запросы возвращают все записи без ограничений.

**Исправление для `src/app/api/documents/route.ts`:**

```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем параметры пагинации из query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100); // Макс 100
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          templateCode: true,
          templateVersion: true,
          bodyText: true,
          requisites: true,
          hasBodyChat: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name_full: true,
              name_short: true,
              inn: true,
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Применить аналогично для:**
- `/api/organizations`
- `/api/admin/templates`
- `/api/admin/access`

---

### 2. Исправить race condition в verify-code

**Проблема:** Между проверкой кода и отметкой может быть использован код дважды.

**Исправление `src/app/api/auth/verify-code/route.ts`:**

```typescript
// Использовать транзакцию для атомарности
const loginToken = await prisma.$transaction(async (tx) => {
  const token = await tx.loginToken.findFirst({
    where: {
      email: email.toLowerCase(),
      code: code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) {
    return null;
  }

  // Атомарно отмечаем как использованный
  await tx.loginToken.update({
    where: { id: token.id },
    data: { used: true },
  });

  return token;
});
```

---

### 3. Добавить валидацию в admin endpoints

**Создать схему `src/lib/schemas/admin.ts`:**

```typescript
import { z } from 'zod';

export const grantAccessSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime(),
  admin_note: z.string().max(500).optional(),
});

export const revokeAccessSchema = z.object({
  comment: z.string().max(500).optional(),
});
```

**Использовать в `src/app/api/admin/access/[userId]/route.ts`:**

```typescript
import { grantAccessSchema, revokeAccessSchema } from '@/lib/schemas/admin';

// В POST:
const body = await request.json();
const validated = grantAccessSchema.parse(body);
const { start_date, end_date, admin_note } = validated;

// В DELETE:
const body = await request.json();
const validated = revokeAccessSchema.parse(body);
const { comment } = validated;
```

---

## 🟡 ПРИОРИТЕТ 2: ВАЖНЫЕ УЛУЧШЕНИЯ

### 4. Централизованная обработка ошибок

**Создать `src/lib/error-handler.ts`:**

```typescript
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): NextResponse {
  // Логирование (в production через структурированное логирование)
  if (process.env.NODE_ENV === 'production') {
    // Отправить в Sentry/другой сервис
    console.error('Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  } else {
    console.error('Error:', error);
  }

  // Обработка известных типов ошибок
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        details: error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Не раскрываем детали в production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error instanceof Error
      ? error.message
      : 'Unknown error';

  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}
```

**Использовать в API routes:**

```typescript
export async function GET(request: NextRequest) {
  try {
    // ... код
  } catch (error) {
    return handleError(error);
  }
}
```

---

### 5. Добавить таймауты для внешних API

**Создать wrapper `src/lib/api-timeout.ts`:**

```typescript
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 30000 // 30 секунд
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
```

**Использовать в `src/app/api/ai/chat/route.ts`:**

```typescript
import { fetchWithTimeout } from '@/lib/api-timeout';

const completion = await fetchWithTimeout(
  'https://api.openai.com/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  },
  60000 // 60 секунд для OpenAI
).then((res) => res.json());
```

---

### 6. Добавить кэширование

**Создать `src/lib/cache.ts`:**

```typescript
import { prisma } from './prisma';

// Простое in-memory кэширование (для production использовать Redis)
const cache = new Map<string, { data: any; expiresAt: number }>();

export async function getCachedTemplates() {
  const cacheKey = 'templates:all';
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const templates = await prisma.template.findMany({
    where: { isEnabled: true },
    orderBy: { createdAt: 'desc' },
  });

  // Кэш на 5 минут
  cache.set(cacheKey, {
    data: templates,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return templates;
}
```

---

## 🟢 ПРИОРИТЕТ 3: УЛУЧШЕНИЯ

### 7. Маскировать детали ошибок в production

**Исправление `src/app/api/ai/chat/route.ts`:**

```typescript
} catch (error: any) {
  console.error('OpenAI API error:', error);

  // Не раскрываем детали в production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Ошибка при генерации текста'
      : error.message || 'Ошибка при генерации текста';

  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
}
```

---

### 8. Добавить JSDoc комментарии

**Пример для `src/lib/auth-utils.ts`:**

```typescript
/**
 * Получить текущего пользователя из JWT токена
 * 
 * @param request - Next.js Request объект
 * @returns Пользователь или null если токен невалиден
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser(request);
 * if (!user) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export async function getCurrentUser(request: NextRequest) {
  // ... код
}
```

---

### 9. Добавить фильтрацию в API

**Расширить `src/app/api/documents/route.ts`:**

```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateCode = searchParams.get('templateCode');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    // Строим фильтр
    const where: any = { userId: user.id };
    
    if (templateCode) {
      where.templateCode = templateCode;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { bodyText: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // ... select
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      data: documents,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    // ...
  }
}
```

---

### 10. Использовать транзакции для атомарных операций

**Пример в `src/lib/auth-utils.ts`:**

```typescript
export async function upsertUser(email: string, data?: {...}) {
  return await prisma.$transaction(async (tx) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = adminEmail ? email.toLowerCase() === adminEmail.toLowerCase() : false;

    const user = await tx.user.upsert({
      where: { email: email.toLowerCase() },
      create: {
        email: email.toLowerCase(),
        emailVerified: data?.emailVerified ?? true,
        role: isAdmin ? 'admin' : 'user',
        ...data,
        demoStatus: {
          create: {
            documentsUsed: 0,
            documentsLimit: 5,
            isActive: true,
          },
        },
      },
      update: {
        emailVerified: data?.emailVerified ?? true,
        ...data,
      },
      include: {
        demoStatus: true,
      },
    });

    return user;
  });
}
```

---

## 📋 ЧЕКЛИСТ ИСПРАВЛЕНИЙ

### Критичные (до production)
- [ ] Добавить пагинацию во все GET endpoints
- [ ] Исправить race condition в verify-code через транзакцию
- [ ] Добавить Zod валидацию в admin endpoints
- [ ] Добавить базовые тесты (хотя бы для auth flow)

### Важные (рекомендуется)
- [ ] Централизованная обработка ошибок
- [ ] Таймауты для внешних API
- [ ] Кэширование шаблонов
- [ ] Структурированное логирование

### Улучшения (можно позже)
- [ ] JSDoc комментарии
- [ ] Фильтрация и поиск в API
- [ ] Маскирование ошибок в production
- [ ] Транзакции для атомарных операций

---

**Версия:** 1.0  
**Дата:** 2025-01-28

