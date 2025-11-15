# 📊 Бухгалтерский ИИ-помощник

**Современное SaaS приложение** для автоматизации создания бухгалтерских документов с помощью искусственного интеллекта.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green)](https://github.com)

---

## ✨ Возможности

### Для пользователей:
- 🔐 **Авторизация через SMS** (Auth4App интеграция)
- 🏢 **Управление организациями** с полными реквизитами
- 📄 **10+ шаблонов документов** (счета, акты, договоры...)
- 🤖 **ИИ-генерация текста** документов (OpenAI GPT-4)
- 📤 **Экспорт в DOCX/PDF** с правильным форматированием
- 🗂️ **Архив документов** с поиском и фильтрами
- 🎨 **Темная тема** и полная адаптивность
- 📱 **Мобильная версия** - работает на всех устройствах

### Для администраторов:
- ⚙️ **Настройка шаблонов** - активация/деактивация
- 🏷️ **Управление тегами** - до 5 тегов на шаблон
- 📋 **Конфигурация реквизитов** - динамические поля для каждого шаблона
- 🎛️ **Пресеты** - готовые наборы полей

---

## 🏗️ Технологии

### Frontend:
- **Next.js 15** (App Router)
- **React 18** с TypeScript
- **shadcn/ui** + Radix UI компоненты
- **Tailwind CSS** для стилей
- **React Query** для state management
- **React Hook Form** + Zod для форм

### Backend:
- **Next.js API Routes** (22 endpoints)
- **Prisma ORM** для работы с БД
- **PostgreSQL** (Neon serverless)
- **JWT** авторизация в HttpOnly cookies
- **Middleware** для защиты routes

### UX/Performance:
- **Skeleton loaders** вместо спиннеров
- **Optimistic updates** - мгновенный UI (0ms)
- **React Query** кеширование
- **Confirm dialogs** для опасных действий

### Безопасность:
- **Zod validation** на клиенте и сервере
- **Rate limiting** (Upstash Redis)
- **Middleware** защита API
- **Sentry** мониторинг ошибок
- **Auto-backups** (Neon, каждые 24ч)

---

## 🚀 Быстрый старт

### Локальная разработка:

```bash
# 1. Клонировать репозиторий
git clone <your-repo>
cd buh-ai-assistant

# 2. Установить зависимости
bun install

# 3. Настроить переменные окружения
cp .env.example .env
# Добавьте DATABASE_URL и JWT_SECRET

# 4. Запустить миграции
bunx prisma migrate dev

# 5. Запустить dev server
bun run dev
```

Откройте http://localhost:3000

### Тестовый вход:
- **Номер:** +7 920 222-22-22
- **Код:** 1234
- **Админ:** +7 999 999-99-99

---

## 📦 Production Deploy

### Быстрый деплой (5 минут):

1. **Создать Neon БД:** https://neon.tech/
2. **Сгенерировать JWT:** `openssl rand -base64 32`
3. **Deploy на Netlify:** https://app.netlify.com/
4. **Добавить env variables:**
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   NODE_ENV=production
   ```
5. **Запустить миграции:** `bunx prisma migrate deploy`

**Готово!** ✅

Подробная инструкция: [.same/QUICK_DEPLOY.md](./.same/QUICK_DEPLOY.md)

> ⚠️ **Важно для production:** Для корректной работы rate limiting настройте Upstash Redis.  
> Без него все пользователи могут получать ошибку "Too Many Requests".

---

## 📚 Документация

Вся документация в папке `.same/`:

### Быстрый старт:
- **QUICK_DEPLOY.md** - деплой за 5 минут
- **PRODUCTION_DEPLOY_GUIDE.md** - полная инструкция
- **PROJECT_SUMMARY.md** - обзор проекта

### Разработка:
- **DATABASE_SETUP.md** - настройка PostgreSQL
- **BACKUPS_GUIDE.md** - стратегия бэкапов
- **TESTING_GUIDE.md** - тестирование

### История версий:
- **todos.md** - changelog всех версий
- **v27-api-migration-complete.md** - миграция на API
- **v29-quick-wins-complete.md** - UX улучшения

---

## 🗄️ Структура проекта

```
buh-ai-assistant/
├── src/
│   ├── app/                    # Next.js pages (App Router)
│   │   ├── api/               # API routes (22 endpoints)
│   │   ├── auth/              # Авторизация
│   │   ├── org/               # Организации
│   │   ├── docs/              # Архив документов
│   │   ├── templates/         # Каталог шаблонов
│   │   ├── admin/             # Админ-панель
│   │   └── profile/           # Профиль
│   ├── components/            # React компоненты
│   │   ├── ui/               # shadcn/ui компоненты
│   │   └── skeletons/        # Skeleton loaders
│   ├── hooks/                 # Custom hooks (React Query)
│   ├── lib/                   # Утилиты и конфиги
│   │   ├── schemas/          # Zod валидация
│   │   ├── data/             # Шаблоны документов
│   │   └── utils/            # Helpers
│   └── providers/             # React providers
├── prisma/
│   ├── schema.prisma         # Database схема
│   └── migrations/           # Миграции
└── .same/                     # Документация
```

---

## 🔐 Переменные окружения

### Обязательные:

```bash
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# Next.js
NODE_ENV=production
```

### Опциональные:

```bash
# Auth4App (для реальной SMS авторизации)
NEXT_PUBLIC_AUTH4APP_API_KEY=...
NEXT_PUBLIC_AUTH4APP_PROJECT_ID=...

# OpenAI (для ИИ генерации)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Upstash Redis (для rate limiting)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Sentry (для мониторинга)
NEXT_PUBLIC_SENTRY_DSN=...

# Rate Limiting (для разработки)
# Отключить rate limiting полностью (НЕ используйте в production!)
# DISABLE_RATE_LIMIT=true
```

Полный список: [.env.example](./.env.example)

> **💡 Совет:** При локальной разработке, если получаете ошибку "Too Many Requests", 
> добавьте `DISABLE_RATE_LIMIT=true` в `.env.local`.

---

## 📊 API Endpoints

### Public:
- `POST /api/auth/init` - Отправить SMS
- `POST /api/auth/confirm` - Подтвердить код
- `POST /api/auth/logout` - Выход

### Protected:
- `GET /api/users/me` - Текущий пользователь
- `PUT /api/users/me` - Обновить профиль

### Organizations:
- `GET /api/organizations` - Список
- `POST /api/organizations` - Создать
- `PUT /api/organizations/:id` - Обновить
- `DELETE /api/organizations/:id` - Удалить

### Documents:
- `GET /api/documents` - Список
- `POST /api/documents` - Создать
- `PUT /api/documents/:id` - Обновить
- `DELETE /api/documents/:id` - Удалить

### Admin:
- `GET /api/admin/template-configs/:code` - Конфиг шаблона
- `PUT /api/admin/template-configs/:code` - Обновить конфиг

### Utils:
- `POST /api/files/parse` - Парсинг файлов
- `POST /api/ai/chat` - ИИ-генерация
- `POST /api/documents/generate-docx` - DOCX
- `POST /api/documents/generate-pdf` - PDF

**Всего:** 22 endpoints

Полная документация: [API_REFERENCE.md](./API_REFERENCE.md)

---

## 🧪 Тестирование

```bash
# Запустить линтер
bun run lint

# Проверить типы TypeScript
bunx tsc --noEmit

# Открыть Prisma Studio
bunx prisma studio

# Тестировать API
curl http://localhost:3000/api/users/me
```

Полное руководство: [.same/TESTING_GUIDE.md](./.same/TESTING_GUIDE.md)

---

## 📈 Статус разработки

### v29 - Production Ready ✅

- [x] **Frontend:** 100%
- [x] **Backend:** 100%
- [x] **Database:** 100%
- [x] **Auth:** 100%
- [x] **Security:** 100%
- [x] **UX:** 100%
- [x] **Mobile:** 100%
- [x] **Docs:** 100%

**Готово к production!** 🚀

См. [.same/PROJECT_SUMMARY.md](./.same/PROJECT_SUMMARY.md)

---

## 💰 Стоимость

### Free Tier (до 100 пользователей/день):

| Сервис | Стоимость |
|--------|-----------|
| Netlify | $0 |
| Neon PostgreSQL | $0 |
| Upstash Redis | $0 |
| Sentry | $0 |
| **ИТОГО** | **$0/месяц** |

### При росте (до 10k пользователей):

| Сервис | Стоимость |
|--------|-----------|
| Netlify Pro | $19/мес |
| Neon Launch | $19/мес |
| Upstash | ~$10/мес |
| Sentry Team | $26/мес |
| **ИТОГО** | **~$74/месяц** |

---

## 🤝 Поддержка

### Документация:
- Все в папке `.same/`
- Начните с [PROJECT_SUMMARY.md](./.same/PROJECT_SUMMARY.md)

### Проблемы:
1. Проверьте [PRODUCTION_DEPLOY_GUIDE.md](./.same/PRODUCTION_DEPLOY_GUIDE.md)
2. См. раздел Troubleshooting
3. GitHub Issues
4. Email: support@same.new

---

## 📄 Лицензия

MIT License - см. [LICENSE](./LICENSE)

---
