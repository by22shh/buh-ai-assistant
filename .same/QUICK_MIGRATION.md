# Быстрая миграция БД на Netlify (5 минут)

## 🎯 Самый простой способ

### Вариант 1: Через Neon Console (если используете Neon.tech)

1. **Откройте Neon Console**
   - Перейдите на https://console.neon.tech
   - Выберите ваш проект

2. **Откройте SQL Editor**
   - Вкладка "SQL Editor" в левом меню

3. **Скопируйте и выполните этот SQL:**

```sql
BEGIN;

-- Добавляем email колонку
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false;

-- Копируем phone в email (временно)
UPDATE "User" SET "email" = "phone" WHERE "email" IS NULL AND "phone" IS NOT NULL;

-- Делаем email обязательным
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Делаем phone опциональным
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;
DROP INDEX IF EXISTS "User_phone_key";

-- Создаем таблицу LoginToken
CREATE TABLE IF NOT EXISTS "LoginToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS "LoginToken_email_idx" ON "LoginToken"("email");
CREATE INDEX IF NOT EXISTS "LoginToken_code_idx" ON "LoginToken"("code");
CREATE INDEX IF NOT EXISTS "LoginToken_token_idx" ON "LoginToken"("token");
CREATE INDEX IF NOT EXISTS "LoginToken_expiresAt_idx" ON "LoginToken"("expiresAt");

COMMIT;
```

4. **Нажмите "Run"**

5. **Готово!** ✅

---

### Вариант 2: Через локальный Prisma CLI

1. **Получите DATABASE_URL из Netlify**
   - Netlify Dashboard → Site settings → Environment variables
   - Скопируйте значение `DATABASE_URL`

2. **Откройте терминал и выполните:**

```bash
# Установите DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Перейдите в директорию проекта
cd buh-ai-assistant

# Примените миграции
bunx prisma migrate deploy

# Проверьте
bunx prisma db push
```

3. **Готово!** ✅

---

## ✅ Проверка

После миграции откройте ваш сайт и попробуйте войти:

1. Перейдите на ваш Netlify сайт → `/auth/login`
2. Введите email
3. Получите код (на почту или в toast уведомлении)
4. Введите код
5. Должна произойти авторизация ✅

---

## 🆘 Если что-то не работает

### "Column already exists"
✅ Всё ОК! Миграция уже была выполнена ранее.

### "Cannot connect to database"
1. Проверьте DATABASE_URL в Netlify
2. Убедитесь что в конце есть `?sslmode=require`
3. Попробуйте через Neon Console

### "500 Internal Server Error" на сайте
1. Проверьте логи в Netlify Functions
2. Убедитесь что `EMAIL_USER` и `EMAIL_PASSWORD` настроены
3. Перезапустите деплой в Netlify

### Email не приходят
См. `.same/EMAIL_SETUP_GUIDE.md` - настройка Gmail App Password

---

## 📋 Что дальше?

После успешной миграции:

1. ✅ Настройте Gmail для отправки кодов → `.same/EMAIL_SETUP_GUIDE.md`
2. ✅ Обновите существующих пользователей с настоящими email (опционально)
3. ✅ Протестируйте авторизацию на разных браузерах
4. ✅ Готово к использованию!

---

## ⏱️ Время выполнения

- Через Neon Console: **2 минуты**
- Через Prisma CLI: **3 минуты**
- Полная проверка: **5 минут**

**Итого: ~5-10 минут** на всю миграцию!
