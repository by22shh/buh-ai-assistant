# 🗄️ ИНСТРУКЦИЯ ПО НАСТРОЙКЕ БАЗЫ ДАННЫХ

**Версия:** v23
**Дата:** 19 октября 2025

---

## 🎯 ЧТО МЫ ИСПОЛЬЗУЕМ

- **Neon PostgreSQL** — бесплатный serverless PostgreSQL
- **Prisma ORM** — TypeScript ORM для работы с БД
- **Next.js API Routes** — backend внутри Next.js

---

## 📋 ПОШАГОВАЯ ИНСТРУКЦИЯ

### Шаг 1: Регистрация на Neon (5 минут)

1. **Откройте:** https://neon.tech/
2. **Нажмите:** "Sign Up" (можно через GitHub)
3. **Войдите** в аккаунт

---

### Шаг 2: Создание проекта БД (2 минуты)

1. **Нажмите:** "Create Project"
2. **Название:** `buh-ai-assistant` (или любое другое)
3. **Region:** выберите `Frankfurt` (ближе к России)
4. **Postgres version:** оставьте по умолчанию (16)
5. **Нажмите:** "Create Project"

⏳ Подождите 10-20 секунд, пока создаётся БД

---

### Шаг 3: Копирование строки подключения (1 минута)

После создания проекта вы увидите экран с данными подключения.

1. **Найдите секцию:** "Connection String"
2. **Скопируйте** строку, которая начинается с `postgresql://`

Пример:
```
postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/dbname?sslmode=require
```

---

### Шаг 4: Добавление в .env (1 минута)

1. **Откройте файл:** `.env` в корне проекта
   - Если файла нет, создайте его (скопируйте из `.env.example`)

2. **Добавьте строку:**
```env
DATABASE_URL="ваша_скопированная_строка"
```

Пример:
```env
DATABASE_URL="postgresql://neondb_owner:npg_xxx@ep-ancient-hall-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

**⚠️ Важно:** Строка должна быть в кавычках!

---

### Шаг 5: Генерация Prisma Client (1 минута)

Выполните в терминале:

```bash
cd buh-ai-assistant
bunx prisma generate
```

**Результат:**
```
✔ Generated Prisma Client
```

---

### Шаг 6: Запуск миграций (2 минуты)

Выполните команду:

```bash
bunx prisma migrate dev --name init
```

**Что произойдёт:**
1. Prisma создаст все таблицы в БД
2. Создаст файл миграции в `prisma/migrations/`
3. Сгенерирует Prisma Client

**Вы увидите:**
```
Your database is now in sync with your schema.

✔ Generated Prisma Client
```

---

### Шаг 7: Проверка (опционально, 2 минуты)

Откройте **Prisma Studio** — визуальный редактор БД:

```bash
bunx prisma studio
```

**Откроется:** http://localhost:5555

Вы увидите все таблицы:
- User
- Organization
- Document
- DemoStatus
- TemplateConfig

Можете добавить/посмотреть данные вручную!

---

### Шаг 8: Запуск приложения (1 минута)

```bash
bun run dev
```

Откройте: http://localhost:3000

**✅ ГОТОВО!** Теперь приложение работает с настоящей БД!

---

## 🧪 КАК ПРОВЕРИТЬ, ЧТО ВСЁ РАБОТАЕТ

### Тест 1: Авторизация

1. Откройте `/auth/login`
2. Введите номер телефона
3. Введите любой код
4. Войдите в систему

**Проверка в Prisma Studio:**
```bash
bunx prisma studio
```
→ Откройте таблицу "User"
→ Должна появиться запись с вашим телефоном

---

### Тест 2: Создание организации

1. Войдите в систему
2. Перейдите в "Организации"
3. Создайте новую организацию
4. Сохраните

**Проверка в Prisma Studio:**
→ Откройте таблицу "Organization"
→ Должна появиться ваша организация

---

### Тест 3: Создание документа

1. Выберите шаблон
2. Создайте документ
3. Заполните реквизиты
4. Сохраните

**Проверка в Prisma Studio:**
→ Откройте таблицу "Document"
→ Должен появиться документ

---

## 🚀 ДЕПЛОЙ НА NETLIFY

### 1. Добавьте переменную окружения

В Netlify Dashboard:
1. Site settings → Environment variables
2. Добавьте новую переменную:
   - **Key:** `DATABASE_URL`
   - **Value:** ваша строка подключения из Neon

### 2. Обновите команду сборки

В `netlify.toml` уже настроено:
```toml
[build]
  command = "bunx prisma generate && bun run build"
  publish = ".next"
```

### 3. Задеплойте

```bash
git push origin main
```

Netlify автоматически:
1. Запустит `prisma generate`
2. Соберёт проект
3. Задеплоит

**✅ Production готов!**

---

## 🐛 РЕШЕНИЕ ПРОБЛЕМ

### Ошибка: "Environment variable not found: DATABASE_URL"

**Решение:**
1. Проверьте, что `.env` файл существует
2. Проверьте, что `DATABASE_URL` в кавычках
3. Перезапустите dev server: `bun run dev`

---

### Ошибка: "Can't reach database server"

**Решение:**
1. Проверьте интернет-соединение
2. Проверьте, что строка подключения правильная
3. Зайдите в Neon Dashboard → убедитесь, что проект активен

---

### Ошибка: "Prisma Client not generated"

**Решение:**
```bash
bunx prisma generate
```

---

### Не видно таблиц в Prisma Studio

**Решение:**
```bash
# Запустите миграции ещё раз
bunx prisma migrate dev --name init
```

---

## 📊 ПРЕИМУЩЕСТВА NEON

### Бесплатный tier:
- ✅ 0.5 GB storage (хватит для 1000+ документов)
- ✅ 100 часов active time/месяц
- ✅ Автомасштабирование
- ✅ SSL подключение
- ✅ Автобэкапы

### Когда нужно больше:
- **Neon Pro:** $19/месяц
- **Storage:** до 200 GB
- **Active time:** безлимит

---

## 🔄 МИГРАЦИЯ ДАННЫХ ИЗ localStorage (опционально)

Если у вас есть данные в localStorage, можно их перенести.

**НЕ ДЕЛАЙТЕ ЭТО СЕЙЧАС!** Просто начните с чистой БД.

Если всё-таки нужно:
1. Экспортируйте данные из localStorage в JSON
2. Напишите скрипт для импорта
3. Запустите скрипт

*Это можно сделать позже, если понадобится.*

---

## ✅ ЧЕКЛИСТ

После выполнения всех шагов отметьте:

- [ ] ✅ Зарегистрировался на Neon.tech
- [ ] ✅ Создал проект БД
- [ ] ✅ Скопировал DATABASE_URL
- [ ] ✅ Добавил в `.env`
- [ ] ✅ Выполнил `bunx prisma generate`
- [ ] ✅ Выполнил `bunx prisma migrate dev`
- [ ] ✅ Запустил `bun run dev`
- [ ] ✅ Протестировал авторизацию
- [ ] ✅ Создал тестовую организацию
- [ ] ✅ Создал тестовый документ
- [ ] ✅ Открыл Prisma Studio
- [ ] ✅ Добавил DATABASE_URL в Netlify

---

## 📞 ПОДДЕРЖКА

**Если что-то не работает:**

1. Проверьте этот гайд ещё раз
2. Посмотрите логи в терминале
3. Проверьте Neon Dashboard (проект активен?)
4. Напишите: support@same.new

**Полезные команды:**
```bash
# Посмотреть схему БД
bunx prisma db pull

# Сбросить БД (ОСТОРОЖНО!)
bunx prisma migrate reset

# Посмотреть статус миграций
bunx prisma migrate status

# Открыть Prisma Studio
bunx prisma studio
```

---

## 🎉 ГОТОВО!

После выполнения всех шагов у вас будет:

- ✅ PostgreSQL база данных (Neon)
- ✅ Prisma ORM настроен
- ✅ Все таблицы созданы
- ✅ API routes работают
- ✅ Приложение сохраняет данные в БД
- ✅ Production-ready на 100%!

**Поздравляю! Теперь у вас полноценный backend! 🚀**

---

*Версия 23 — Full Backend Integration*
*19 октября 2025*
