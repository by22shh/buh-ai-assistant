# 🚀 ROADMAP ДЛЯ PRODUCTION

**Текущий статус:** v24 - 95% готовности
**Дата:** 19 октября 2025

---

## 📊 ЧТО УЖЕ ЕСТЬ (100%)

### Backend ✅
- PostgreSQL через Prisma
- 22 API endpoints (CRUD для всего)
- JWT авторизация
- Middleware защита
- Генерация DOCX/PDF
- Парсинг файлов
- OpenAI интеграция
- Auth4App интеграция

### Frontend ✅
- Next.js 15 + React 18
- shadcn/ui компоненты
- Темная тема
- Мобильная адаптивность
- Поиск и фильтры
- Предпросмотр документов
- React Query настроен

### Security ✅
- JWT в HttpOnly cookies
- Middleware защита API
- XSS/CSRF защита
- Role-based access

---

## 🎯 ПРИОРИТЕТ 1: КРИТИЧНО (1-2 недели)

### 1. Миграция фронтенда на API ⚠️

**Проблема:** Фронтенд использует localStorage вместо API

**Что нужно:**
- [ ] Обновить `/org` на useOrganizations hook
- [ ] Обновить `/org/create` на API
- [ ] Обновить `/org/[id]/edit` на API
- [ ] Обновить `/docs` на useDocuments hook
- [ ] Обновить `/doc/[id]/requisites` на createDocument API
- [ ] Обновить `/profile` на useUser hook
- [ ] Убрать все импорты mockData
- [ ] Тестирование всех форм

**Польза:**
- ✅ Данные сохраняются в БД
- ✅ Работает для всех пользователей
- ✅ Демо-лимит работает реально

**Время:** 3-4 дня
**Сложность:** 🟡 Средняя

---

### 2. Rate Limiting для API 🔴

**Проблема:** Нет защиты от DDoS и спама

**Решение:**
```bash
bun add @upstash/ratelimit @upstash/redis
```

**Реализация:**
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 запросов в 10 секунд
});

// В middleware:
const { success } = await ratelimit.limit(ip);
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

**Лимиты:**
- API: 10 req/10s на IP
- Auth: 5 req/min на номер
- AI chat: 3 req/min на пользователя

**Время:** 1 день
**Сложность:** 🟢 Низкая

---

### 3. Input Validation + Sanitization 🔴

**Проблема:** Нет валидации на сервере

**Решение:**
```bash
bun add zod validator
```

**Пример:**
```typescript
// src/lib/schemas/organization.ts
import { z } from 'zod';

export const organizationSchema = z.object({
  name_full: z.string().min(3).max(200),
  inn: z.string().regex(/^\d{10}$|^\d{12}$/).refine(validateINN),
  kpp: z.string().regex(/^\d{9}$/).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
});

// В API route:
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = organizationSchema.parse(body); // Throws если невалидно
  // ...
}
```

**Где применить:**
- Organizations create/update
- Documents create/update
- User profile update
- Template configs

**Время:** 2 дня
**Сложность:** 🟢 Низкая

---

### 4. Error Monitoring (Sentry) 🔴

**Проблема:** Не знаем об ошибках пользователей

**Решение:**
```bash
bun add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Настройка:**
```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**Что отслеживаем:**
- JS ошибки на клиенте
- API errors на сервере
- Unhandled promises
- Network errors
- Performance issues

**Время:** 1 день
**Сложность:** 🟢 Низкая

---

### 5. Database Backups 🔴

**Проблема:** Нет backup стратегии

**Решение (Neon):**
- Neon автоматически делает backups
- Настроить point-in-time recovery
- Добавить manual snapshots перед миграциями

**Настройка:**
```bash
# Перед миграцией:
bunx prisma migrate deploy --create-only

# Создать snapshot в Neon Dashboard
# Затем применить миграцию
bunx prisma migrate deploy
```

**Дополнительно:**
- Экспорт данных раз в неделю (pg_dump)
- Хранение в S3/Google Drive
- Тестирование восстановления

**Время:** 1 день
**Сложность:** 🟢 Низкая

---

## 🎯 ПРИОРИТЕТ 2: ВАЖНО (2-3 недели)

### 6. Валидация форм (react-hook-form + zod) 🟡

**Проблема:** Ручная валидация, много кода

**Решение:**
```bash
bun add react-hook-form @hookform/resolvers zod
```

**Пример:**
```typescript
const schema = z.object({
  name_full: z.string().min(3, 'Минимум 3 символа'),
  inn: z.string().regex(/^\d{10}$/, 'ИНН должен быть 10 цифр'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});

// В форме:
<Input {...register('name_full')} />
{errors.name_full && <p className="text-red-500">{errors.name_full.message}</p>}
```

**Страницы:**
- /org/create
- /org/[id]/edit
- /doc/[id]/requisites
- /profile
- /admin/templates/*

**Время:** 3 дня
**Сложность:** 🟡 Средняя

---

### 7. Оптимистичные обновления (React Query) 🟡

**Проблема:** Интерфейс тормозит при каждом действии

**Решение:**
```typescript
const { mutate } = useMutation({
  mutationFn: createOrganization,
  onMutate: async (newOrg) => {
    // Оптимистичное обновление
    await queryClient.cancelQueries({ queryKey: ['organizations'] });
    const previous = queryClient.getQueryData(['organizations']);
    queryClient.setQueryData(['organizations'], (old) => [...old, newOrg]);
    return { previous };
  },
  onError: (err, newOrg, context) => {
    // Откат при ошибке
    queryClient.setQueryData(['organizations'], context.previous);
  },
  onSettled: () => {
    // Рефетч для синхронизации
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
  },
});
```

**Где применить:**
- Создание организаций
- Создание документов
- Обновление профиля
- Удаление

**Время:** 2 дня
**Сложность:** 🟡 Средняя

---

### 8. Skeleton Loaders 🟡

**Проблема:** Пустые экраны при загрузке

**Решение:**
```typescript
{isLoading ? (
  <div className="space-y-4">
    {[1,2,3].map(i => (
      <Card key={i} className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </Card>
    ))}
  </div>
) : (
  // Реальные данные
)}
```

**Где добавить:**
- Список организаций
- Список документов
- Каталог шаблонов
- Профиль

**Время:** 1 день
**Сложность:** 🟢 Низкая

---

### 9. Confirm Dialogs 🟡

**Проблема:** Случайное удаление без подтверждения

**Решение:**
```typescript
import { AlertDialog } from '@/components/ui/alert-dialog';

const [deleteId, setDeleteId] = useState<string | null>(null);

<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Удалить организацию?</AlertDialogTitle>
      <AlertDialogDescription>
        Это действие нельзя отменить. Все документы этой организации останутся.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Отмена</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Где добавить:**
- Удаление организации
- Удаление документа
- Удаление шаблона (админ)

**Время:** 1 день
**Сложность:** 🟢 Низкая

---

### 10. Email Notifications 🟡

**Проблема:** Пользователь не получает уведомлений

**Решение:**
```bash
bun add resend
```

**Сценарии:**
- Приветственное письмо после регистрации
- Уведомление о создании документа
- Предупреждение о достижении лимита (4/5 документов)
- Письмо при истечении демо-доступа

**Пример:**
```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: 'Добро пожаловать!',
    html: '<p>Привет, {name}! Спасибо за регистрацию.</p>',
  });
}
```

**Время:** 2 дня
**Сложность:** 🟡 Средняя

---

## 🎯 ПРИОРИТЕТ 3: ЖЕЛАТЕЛЬНО (3-4 недели)

### 11. История изменений (Audit Log) 🟢

**Зачем:** Отслеживание действий пользователей

**Схема:**
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String   // "created", "updated", "deleted"
  entity    String   // "organization", "document"
  entityId  String
  changes   Json?    // Что изменилось
  createdAt DateTime @default(now())

  user User @relation(...)
}
```

**Где логировать:**
- Создание/изменение организаций
- Создание/изменение документов
- Изменения в шаблонах (админ)
- Изменения доступа (админ)

**Интерфейс:**
```
/admin/audit-log
Фильтры: пользователь, действие, дата, сущность
```

**Время:** 3 дня
**Сложность:** 🟡 Средняя

---

### 12. Экспорт/Импорт данных 🟢

**Организации:**
- Экспорт в CSV/Excel
- Импорт из CSV с валидацией
- Шаблон для импорта

**Документы:**
- Массовое скачивание (ZIP)
- Экспорт метаданных

**Реализация:**
```typescript
// Экспорт
import { parse } from 'json2csv';

const csv = parse(organizations, {
  fields: ['name_full', 'inn', 'kpp', 'email']
});

// Импорт
import Papa from 'papaparse';

Papa.parse(file, {
  complete: (results) => {
    // Валидация и создание
  }
});
```

**Время:** 2 дня
**Сложность:** 🟡 Средняя

---

### 13. Версионирование документов 🟢

**Зачем:** Откат к предыдущим версиям

**Схема:**
```prisma
model DocumentVersion {
  id         String   @id
  documentId String
  version    Int
  bodyText   String?
  requisites Json?
  createdAt  DateTime
  createdBy  String
}
```

**Интерфейс:**
- Кнопка "История версий" в документе
- Список всех версий с датами
- Сравнение версий (diff)
- Восстановление версии

**Время:** 3 дня
**Сложность:** 🟡 Средняя

---

### 14. Улучшенный поиск (Full-text) 🟢

**Проблема:** Поиск только по названию

**Решение:**
```prisma
// Добавить в Document:
@@map("documents")
@@index([templateCode, userId])
// Для PostgreSQL full-text search:
// CREATE INDEX idx_documents_search ON documents USING gin(to_tsvector('russian', body_text));
```

**Функции:**
- Поиск по тексту документа
- Поиск по реквизитам
- Автодополнение
- Подсветка найденного

**Время:** 2 дня
**Сложность:** 🟡 Средняя

---

### 15. File Uploads (S3) 🟢

**Зачем:** Хранение файлов пользователей

**Решение:**
```bash
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Сценарии:**
- Загрузка логотипа организации
- Вложения к документам
- Шаблоны документов (DOCX)

**API:**
```typescript
POST /api/upload/presigned-url
→ { url, key }

// Клиент загружает напрямую в S3
PUT {url} (file)

POST /api/upload/confirm
→ Сохранение в БД
```

**Время:** 3 дня
**Сложность:** 🟡 Средняя

---

## 🎯 ПРИОРИТЕТ 4: ОПТИМИЗАЦИЯ (ongoing)

### 16. Performance Optimization

**CDN:**
- Cloudflare для статики
- Image optimization (next/image)
- Font optimization

**Code Splitting:**
```typescript
const AdminPanel = dynamic(() => import('./AdminPanel'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

**Database:**
- Индексы для частых запросов
- Connection pooling (Prisma уже делает)
- Query optimization

**Время:** 2 дня
**Сложность:** 🟡 Средняя

---

### 17. E2E тестирование (Playwright)

```bash
bun add -D @playwright/test
bunx playwright install
```

**Тесты:**
- Регистрация и логин
- Создание организации
- Создание документа
- Скачивание DOCX/PDF

**Время:** 3 дня
**Сложность:** 🟡 Средняя

---

### 18. CI/CD Pipeline

**GitHub Actions:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: bun install
      - run: bun run lint
      - run: bun run test
      - run: bunx playwright test
```

**Автодеплой:**
- Push в main → Netlify deploy
- Запуск тестов перед деплоем
- Уведомления в Slack/Telegram

**Время:** 1 день
**Сложность:** 🟢 Низкая

---

## 📊 СВОДНАЯ ТАБЛИЦА

| Улучшение | Приоритет | Время | Сложность | Ценность |
|-----------|-----------|-------|-----------|----------|
| Миграция на API | 🔴 | 3-4д | 🟡 | ⭐⭐⭐⭐⭐ |
| Rate Limiting | 🔴 | 1д | 🟢 | ⭐⭐⭐⭐⭐ |
| Input Validation | 🔴 | 2д | 🟢 | ⭐⭐⭐⭐⭐ |
| Sentry | 🔴 | 1д | 🟢 | ⭐⭐⭐⭐⭐ |
| Backups | 🔴 | 1д | 🟢 | ⭐⭐⭐⭐⭐ |
| react-hook-form | 🟡 | 3д | 🟡 | ⭐⭐⭐⭐ |
| Оптимистичные обновления | 🟡 | 2д | 🟡 | ⭐⭐⭐⭐ |
| Skeleton Loaders | 🟡 | 1д | 🟢 | ⭐⭐⭐ |
| Confirm Dialogs | 🟡 | 1д | 🟢 | ⭐⭐⭐ |
| Email Notifications | 🟡 | 2д | 🟡 | ⭐⭐⭐⭐ |
| Audit Log | 🟢 | 3д | 🟡 | ⭐⭐⭐ |
| Экспорт/Импорт | 🟢 | 2д | 🟡 | ⭐⭐⭐ |
| Версионирование | 🟢 | 3д | 🟡 | ⭐⭐⭐ |
| Full-text Search | 🟢 | 2д | 🟡 | ⭐⭐⭐ |
| File Uploads | 🟢 | 3д | 🟡 | ⭐⭐⭐ |
| Performance | 🟢 | 2д | 🟡 | ⭐⭐⭐⭐ |
| E2E Tests | 🟢 | 3д | 🟡 | ⭐⭐⭐⭐ |
| CI/CD | 🟢 | 1д | 🟢 | ⭐⭐⭐⭐ |

---

## ⏱️ TIMELINE

### Неделя 1-2: Критично
- Миграция на API (4д)
- Rate Limiting (1д)
- Input Validation (2д)
- Sentry (1д)
- Backups (1д)
- **Итого:** 9 дней

### Неделя 3-4: Важно
- react-hook-form (3д)
- Оптимистичные обновления (2д)
- Skeleton Loaders (1д)
- Confirm Dialogs (1д)
- Email Notifications (2д)
- **Итого:** 9 дней

### Неделя 5-6: Желательно
- Audit Log (3д)
- Экспорт/Импорт (2д)
- Версионирование (3д)
- Full-text Search (2д)
- **Итого:** 10 дней

### Неделя 7+: Оптимизация
- File Uploads (3д)
- Performance (2д)
- E2E Tests (3д)
- CI/CD (1д)
- **Итого:** 9 дней

**ОБЩЕЕ ВРЕМЯ:** 5-7 недель до идеального production

---

## 🎯 МИНИМУМ ДЛЯ ЗАПУСКА

Если нужно запустить БЫСТРО:

**Обязательно (1 неделя):**
1. ✅ Миграция на API
2. ✅ Rate Limiting
3. ✅ Input Validation
4. ✅ Sentry
5. ✅ Backups

**И ВСЁ!** Можно запускать production.

Остальное добавлять постепенно по мере роста.

---

## 💰 СТОИМОСТЬ СЕРВИСОВ

**Минимальная конфигурация:**
- Neon PostgreSQL: $0 (free tier)
- Netlify: $0 (free tier)
- Sentry: $0 (free tier, 5k events/mo)
- Upstash Redis: $0 (free tier)
- Resend Email: $0 (free tier, 100 emails/day)

**Total: $0/месяц** до ~100 пользователей

**При росте:**
- Neon Pro: $19/mo
- Netlify Pro: $19/mo
- Sentry Team: $26/mo
- Upstash Pay-as-go: ~$10/mo
- Resend Pro: $20/mo

**Total: ~$94/месяц** до 10k пользователей

---

**Готов реализовать любой из пунктов! Выбирай что начать! 🚀**
