# Миграция базы данных на Netlify

## 📋 Что нужно мигрировать

После перехода с Auth4App (phone) на Email авторизацию изменилась схема БД:

**Было:**
- `User.phone` - основной идентификатор (уникальный)
- Авторизация через Auth4App

**Стало:**
- `User.email` - основной идентификатор (уникальный)
- `User.phone` - опциональное поле
- Новая модель `LoginToken` для кодов

## 🎯 Цель миграции

1. Добавить поле `email` в таблицу `User`
2. Создать таблицу `LoginToken`
3. Перенести существующих пользователей (если есть)
4. Сделать `phone` опциональным

## 🚀 Способы выполнения миграции

### Способ 1: Prisma Migrate (Рекомендуется) ⭐

Это самый безопасный способ. Prisma автоматически создаст SQL скрипты миграции.

#### Шаг 1: Локальная подготовка

```bash
cd buh-ai-assistant

# Убедитесь что у вас актуальная схема
cat prisma/schema.prisma

# Создайте миграцию
bunx prisma migrate dev --name email_auth_migration

# Prisma создаст файл миграции в prisma/migrations/
```

#### Шаг 2: Применение на Production БД

**Вариант A: Через Netlify CLI (Локально)**

```bash
# Установите Netlify CLI если еще нет
npm install -g netlify-cli

# Залогиньтесь
netlify login

# Перейдите в директорию проекта
cd buh-ai-assistant

# Установите production DATABASE_URL локально
export DATABASE_URL="your_production_database_url"

# Примените миграции
bunx prisma migrate deploy

# Проверьте что всё ок
bunx prisma db push
```

**Вариант B: Через Netlify Build Hook**

Создайте файл скрипта для автоматической миграции при деплое:

```json
// package.json - добавьте скрипт
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma migrate deploy && next build"
  }
}
```

⚠️ **Внимание:** Этот способ может быть рискованным, т.к. миграция будет запускаться при каждом деплое.

---

### Способ 2: Прямой SQL (Быстрый способ)

Если у вас есть доступ к PostgreSQL через клиент (psql, pgAdmin, TablePlus и т.д.):

#### Шаг 1: Подключитесь к БД

Используйте `DATABASE_URL` из Netlify Environment Variables.

```bash
# Формат: postgresql://user:password@host:5432/database
psql "postgresql://user:password@host:5432/database?sslmode=require"
```

#### Шаг 2: Выполните SQL скрипт

```sql
-- Начало транзакции
BEGIN;

-- 1. Добавить новые колонки в User
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "email" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false;

-- 2. Скопировать phone в email для существующих пользователей
UPDATE "User"
SET "email" = "phone"
WHERE "email" IS NULL AND "phone" IS NOT NULL;

-- 3. Установить email обязательным и уникальным
ALTER TABLE "User"
ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- 4. Сделать phone опциональным
ALTER TABLE "User"
ALTER COLUMN "phone" DROP NOT NULL;

DROP INDEX IF EXISTS "User_phone_key";

-- 5. Создать таблицу LoginToken
CREATE TABLE IF NOT EXISTS "LoginToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Создать индексы для LoginToken
CREATE INDEX IF NOT EXISTS "LoginToken_email_idx" ON "LoginToken"("email");
CREATE INDEX IF NOT EXISTS "LoginToken_code_idx" ON "LoginToken"("code");
CREATE INDEX IF NOT EXISTS "LoginToken_token_idx" ON "LoginToken"("token");
CREATE INDEX IF NOT EXISTS "LoginToken_expiresAt_idx" ON "LoginToken"("expiresAt");

-- Зафиксировать изменения
COMMIT;
```

#### Шаг 3: Проверьте результат

```sql
-- Проверьте структуру User
\d "User"

-- Проверьте существующих пользователей
SELECT id, email, phone, role FROM "User";

-- Проверьте структуру LoginToken
\d "LoginToken"
```

---

### Способ 3: Через Neon Console (Если используете Neon)

Если ваша БД на [Neon.tech](https://neon.tech):

1. Откройте https://console.neon.tech
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Вставьте SQL скрипт из Способа 2
5. Нажмите **Run**

---

## 🔍 Проверка после миграции

### 1. Проверьте схему БД

```bash
# Локально с production DATABASE_URL
export DATABASE_URL="your_production_url"
bunx prisma db pull

# Сравните с вашей schema.prisma
bunx prisma validate
```

### 2. Проверьте данные

```sql
-- Все пользователи должны иметь email
SELECT COUNT(*) FROM "User" WHERE "email" IS NULL;
-- Должно вернуть 0

-- Проверьте что таблица LoginToken создана
SELECT COUNT(*) FROM "LoginToken";
```

### 3. Тест авторизации

1. Откройте ваш сайт на Netlify
2. Перейдите на `/auth/login`
3. Введите email
4. Проверьте что код приходит (или появляется в консоли)
5. Введите код и войдите

---

## 📝 Миграция существующих пользователей

Если у вас есть пользователи с phone, но без email:

### Вариант 1: Простой (phone → email)

```sql
-- Временно используем phone как email
UPDATE "User"
SET "email" = "phone"
WHERE "email" IS NULL;
```

⚠️ **Недостаток:** Email будет = телефон (например `+79537839873`)

### Вариант 2: Создать фейковые email

```sql
-- Создаем email вида phone@temp.local
UPDATE "User"
SET "email" = CONCAT(REPLACE("phone", '+', ''), '@temp.local')
WHERE "email" IS NULL;
```

Пример: `+79537839873` → `79537839873@temp.local`

### Вариант 3: Запросить у пользователей email при первом входе

1. Оставьте старых пользователей с phone в email
2. При входе проверяйте формат email
3. Если email похож на телефон - показывайте форму для ввода настоящего email
4. Обновляйте email в БД

```typescript
// Пример проверки
const isPhoneAsEmail = user.email.match(/^\d+@temp\.local$/);
if (isPhoneAsEmail) {
  // Redirect to /auth/update-email
}
```

---

## 🚨 Troubleshooting

### Ошибка: "column already exists"

```sql
-- Используйте IF NOT EXISTS
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "email" TEXT;
```

### Ошибка: "cannot make NOT NULL column"

```sql
-- Сначала заполните email значениями
UPDATE "User" SET "email" = "phone" WHERE "email" IS NULL;

-- Потом сделайте NOT NULL
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
```

### Ошибка: "duplicate key value violates unique constraint"

```sql
-- Найдите дубликаты
SELECT email, COUNT(*)
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;

-- Удалите дубликаты вручную или обновите email
```

### Не можете подключиться к БД

1. Проверьте `DATABASE_URL` в Netlify Environment Variables
2. Проверьте что в URL есть `?sslmode=require` для Neon
3. Проверьте firewall правила на вашей БД
4. Попробуйте через Neon Console SQL Editor

---

## ✅ Checklist после миграции

- [ ] Таблица `User` имеет колонку `email` (NOT NULL, UNIQUE)
- [ ] Таблица `User` имеет колонку `emailVerified` (BOOLEAN)
- [ ] Колонка `User.phone` теперь опциональная
- [ ] Таблица `LoginToken` создана
- [ ] Индексы созданы для `LoginToken`
- [ ] Все существующие пользователи имеют валидный `email`
- [ ] `bunx prisma validate` проходит успешно
- [ ] Авторизация через email работает
- [ ] JWT токены выдаются корректно
- [ ] Редирект после входа работает

---

## 🎯 Быстрый старт (рекомендуемый путь)

```bash
# 1. Подключитесь к production БД
export DATABASE_URL="ваш_production_url_из_netlify"

# 2. Примените миграции
cd buh-ai-assistant
bunx prisma migrate deploy

# 3. Проверьте
bunx prisma db push
bunx prisma studio  # Откройте и проверьте данные

# 4. Тест на production
# Откройте ваш Netlify сайт → /auth/login → попробуйте войти
```

---

## 📞 Нужна помощь?

Если что-то пошло не так:

1. Сделайте бэкап БД перед миграцией
2. Проверьте логи Netlify Functions
3. Проверьте Environment Variables в Netlify
4. Попробуйте миграцию на dev БД сначала

---

## 🔐 Безопасность

**ВАЖНО:** Перед миграцией production БД:

1. ✅ Сделайте бэкап БД
2. ✅ Протестируйте миграцию на dev/staging БД
3. ✅ Убедитесь что есть доступ к БД на случай отката
4. ✅ Запланируйте миграцию в непиковое время
5. ✅ Сообщите пользователям о возможном downtime

---

Готово! Выберите подходящий способ и следуйте инструкциям пошагово.
