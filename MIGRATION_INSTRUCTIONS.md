# 🗄️ Инструкции по настройке Prisma

## ⚠️ Ситуация

Миграции Prisma были удалены из репозитория. Нужно синхронизировать схему с базой данных.

## ⚡ Быстрый старт (для пустой БД)

```bash
# 1. Добавьте DATABASE_URL в .env
echo 'DATABASE_URL="postgresql://user:pass@host:5432/db"' >> .env

# 2. Синхронизируйте схему с БД (без миграций)
bunx prisma db push

# 3. Готово! БД создана и готова к работе
```

**Для пустой БД файлы миграций НЕ НУЖНЫ!** ✅

---

## 🚀 Решение

### Вариант 1: Пустая БД (рекомендуется) ✅

Если ваша база данных **пустая** (новый проект, чистая установка):

```bash
# Шаг 1: Настройте DATABASE_URL в .env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Шаг 2: Синхронизируйте схему с БД (без миграций)
bunx prisma db push

# Шаг 3: Сгенерируйте Prisma Client
bunx prisma generate
```

**Преимущества:**
- ✅ Быстро и просто
- ✅ Не создаёт лишние файлы миграций
- ✅ Идеально для начала проекта
- ✅ БД сразу готова к работе

---

### Вариант 2: БД с данными (нужны миграции)

Если в базе данных **уже есть данные** или вы работаете в production:

```bash
# Шаг 1: Настройте DATABASE_URL в .env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Шаг 2: Создайте миграцию
bunx prisma migrate dev --name production_init

# Шаг 3: Сгенерируйте Prisma Client
bunx prisma generate
```

**Когда использовать миграции:**
- 📊 В БД уже есть данные
- 🔄 Нужно версионировать изменения схемы
- 👥 Работаете в команде
- 🔙 Нужна возможность отката изменений
- 🚀 Production окружение

---

### Шаг 1: Настройте DATABASE_URL

Создайте файл `.env` (если его нет) и добавьте:

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Пример для локальной БД:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/buh_assistant"

# Пример для Neon (serverless):
# DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

---

## 📊 Что входит в схему

Текущая схема `prisma/schema.prisma` включает **10 моделей**:

1. **User** - Пользователи системы
   - Авторизация, роли, временный доступ
   - Связь с организациями, документами, токенами

2. **LoginToken** - Одноразовые коды для входа (6-digit)
   - Email verification
   - 10 минут TTL

3. **Organization** - Организации пользователей
   - Полные реквизиты (ИНН, КПП, ОГРН, банк)
   - Типы: ЮЛ / ИП

4. **Document** - Документы
   - Привязка к шаблону и организации
   - JSON реквизиты

5. **DemoStatus** - Демо-лимиты
   - Счётчик документов
   - Лимиты для бесплатных пользователей

6. **TemplateConfig** - Конфигурация реквизитов шаблонов
   - JSON настройки полей

7. **Template** - Шаблоны документов
   - CRUD в админке
   - Категории и теги

8. **AccessHistory** - История изменений доступа
   - Аудит действий администратора

9. **RefreshToken** - Refresh токены для JWT
   - Ротация токенов
   - Механизм отзыва

10. **EmailVerification** - Верификация смены email
    - 6-digit код
    - 10 минут TTL

---

## 🔍 Проверка миграций

### Статус миграций:
```bash
bunx prisma migrate status
```

### Открыть Prisma Studio:
```bash
bunx prisma studio
```

### Сбросить БД (⚠️ удалит все данные):
```bash
bunx prisma migrate reset
```

---

## 🐛 Troubleshooting

### Ошибка: "Environment variable not found: DATABASE_URL"
**Решение:** Создайте файл `.env` с `DATABASE_URL`

### Ошибка: "Migration failed"
**Решение:** 
1. Проверьте подключение к БД
2. Убедитесь что БД пустая или совместима со схемой
3. Попробуйте `bunx prisma migrate reset`

### Ошибка: "Database is not empty"
**Решение:** 
```bash
# Вариант 1: Сбросить БД
bunx prisma migrate reset

# Вариант 2: Применить baseline
bunx prisma migrate resolve --applied production_init
bunx prisma migrate deploy
```

---

## 📝 Примечания

- Миграции создаются в `prisma/migrations/`
- Каждая миграция содержит SQL файл
- Git должен отслеживать папку `migrations/`
- В production используйте `migrate deploy`, НЕ `migrate dev`

---

**Создано:** 30 октября 2025  
**Статус:** ✅ Схема готова, миграции нужно создать после настройки БД

