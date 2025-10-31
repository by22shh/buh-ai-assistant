# Настройка Production-окружения

## Критические требования для запуска

### 1. База данных PostgreSQL
```bash
# Создать базу данных PostgreSQL
createdb buh_ai_assistant

# Установить переменную окружения
DATABASE_URL="postgresql://username:password@localhost:5432/buh_ai_assistant"
```

### 2. Миграция базы данных
```bash
# После настройки DATABASE_URL запустить миграции
npx prisma migrate deploy

# Перегенерировать Prisma Client
npx prisma generate
```

### 3. Переменные окружения
Создать файл `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/buh_ai_assistant"
JWT_SECRET="your-strong-jwt-secret-key"
ADMIN_EMAIL="admin@yourdomain.com"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Sentry (опционально)
SENTRY_DSN="your-sentry-dsn"
```

### 4. Функции управления доступом
После настройки БД следующие функции станут активными:
- ✅ Управление временным доступом пользователей (admin панель)
- ✅ История изменений доступа
- ✅ Демо-режим с ограничениями
- ✅ Проверка сроков доступа в middleware

### 5. Текущий статус TypeScript ошибок
**ВНИМАНИЕ**: В коде есть 39 TypeScript ошибок связанных с полями доступа (`accessFrom`, `accessUntil`, `accessComment`, `accessUpdatedBy`, `demoStatus`, `accessHistory`).

Эти ошибки исчезнут автоматически после:
1. Настройки подключения к БД
2. Запуска миграций
3. Перегенерации Prisma Client

### 6. Проверка готовности
```bash
# Проверить подключение к БД
npx prisma db pull

# Проверить TypeScript ошибки
npm run build
```

## Файлы с временными ограничениями

До настройки БД следующие функции работают с ограничениями:
- `src/middleware.ts` - проверка доступа пользователей
- `src/lib/auth-utils.ts` - управление доступом
- `src/app/api/admin/access/` - админ панель доступа

После настройки БД все функции будут работать полностью.