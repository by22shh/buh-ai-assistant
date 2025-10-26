-- ============================================
-- МИГРАЦИЯ БД: Переход на Email авторизацию
-- ============================================
--
-- Что делает этот скрипт:
-- 1. Добавляет email колонки в User
-- 2. Создает таблицу LoginToken
-- 3. Переносит phone → email
-- 4. Создает индексы
--
-- Время выполнения: ~10 секунд
-- Безопасность: Обернуто в транзакцию
-- ============================================

BEGIN;

-- ============================================
-- 1. ОБНОВЛЕНИЕ ТАБЛИЦЫ USER
-- ============================================

-- Добавляем email колонку
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Добавляем emailVerified колонку
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false;

-- Копируем phone в email для существующих пользователей
-- (Если у вас нет пользователей - эта строка ничего не сделает)
UPDATE "User"
SET "email" = "phone"
WHERE "email" IS NULL AND "phone" IS NOT NULL;

-- Делаем email обязательным полем
ALTER TABLE "User"
ALTER COLUMN "email" SET NOT NULL;

-- Создаем уникальный индекс на email
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"
ON "User"("email");

-- Делаем phone опциональным (раньше был обязательным)
ALTER TABLE "User"
ALTER COLUMN "phone" DROP NOT NULL;

-- Удаляем уникальный индекс с phone (если существует)
DROP INDEX IF EXISTS "User_phone_key";

-- ============================================
-- 2. СОЗДАНИЕ ТАБЛИЦЫ LOGINTOKEN
-- ============================================

-- Создаем таблицу для хранения одноразовых кодов
CREATE TABLE IF NOT EXISTS "LoginToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. ИНДЕКСЫ ДЛЯ LOGINTOKEN
-- ============================================

-- Индекс по email (для быстрого поиска кодов пользователя)
CREATE INDEX IF NOT EXISTS "LoginToken_email_idx"
ON "LoginToken"("email");

-- Индекс по коду (для проверки кода)
CREATE INDEX IF NOT EXISTS "LoginToken_code_idx"
ON "LoginToken"("code");

-- Индекс по токену (для проверки токена)
CREATE INDEX IF NOT EXISTS "LoginToken_token_idx"
ON "LoginToken"("token");

-- Индекс по времени истечения (для удаления старых кодов)
CREATE INDEX IF NOT EXISTS "LoginToken_expiresAt_idx"
ON "LoginToken"("expiresAt");

-- ============================================
-- 4. ПОДТВЕРЖДЕНИЕ ИЗМЕНЕНИЙ
-- ============================================

COMMIT;

-- ============================================
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================
--
-- После выполнения скрипта выполните:
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'User' AND column_name IN ('email', 'emailVerified', 'phone');
--
-- Ожидаемый результат:
-- email        | text    | NO
-- emailVerified| boolean | YES
-- phone        | text    | YES
--
-- ============================================
