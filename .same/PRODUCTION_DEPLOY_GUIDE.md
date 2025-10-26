# 🚀 РУКОВОДСТВО ПО PRODUCTION DEPLOY

**Версия:** v29
**Дата:** 20 октября 2025
**Платформа:** Netlify + Neon PostgreSQL

---

## 📋 ЧЕКЛИСТ ГОТОВНОСТИ

Перед деплоем убедитесь:

### Код:
- [x] ✅ Все данные сохраняются через API (не localStorage)
- [x] ✅ JWT авторизация настроена
- [x] ✅ Middleware защищает API routes
- [x] ✅ React Query с оптимистичными обновлениями
- [x] ✅ Skeleton loaders на всех страницах
- [x] ✅ Confirm dialogs для опасных действий
- [x] ✅ Темная тема работает
- [x] ✅ Мобильная адаптивность
- [x] ✅ Линтер без ошибок

### Безопасность:
- [x] ✅ Zod валидация на сервере
- [x] ✅ Rate limiting (с Upstash или mock)
- [x] ✅ JWT секрет готов (32+ символов)
- [x] ✅ CORS настроен
- [x] ✅ Sensitive данные в .env

### База данных:
- [ ] ⚠️ PostgreSQL БД создана (Neon)
- [ ] ⚠️ DATABASE_URL получен
- [ ] ⚠️ Миграции выполнены
- [ ] ⚠️ Тестовые данные (опционально)

---

## 🗄️ ШАГ 1: НАСТРОЙКА NEON POSTGRESQL

### 1.1 Создание проекта

1. Откройте: https://neon.tech/
2. Нажмите **Sign Up** (если нет аккаунта)
3. **Create Project**:
   - Project Name: `buh-ai-assistant-prod`
   - Region: выберите ближайший (Europe: Frankfurt)
   - PostgreSQL version: 16 (latest)
4. Нажмите **Create Project**

### 1.2 Получение DATABASE_URL

После создания проекта:

1. Перейдите в **Dashboard** → **Connection Details**
2. Выберите **Connection string**
3. Скопируйте полный URL:
   ```
   postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Сохраните его!** Пригодится для Netlify

### 1.3 Настройка автобэкапов

1. Dashboard → **Settings** → **Compute**
2. **Auto-suspend**: 5 minutes (экономия ресурсов)
3. **Backups**: Automatic (включено по умолчанию)
4. **Point-in-time recovery**: 7 days (Free tier)

✅ **Neon готов!**

---

## 🔐 ШАГ 2: ГЕНЕРАЦИЯ JWT SECRET

### 2.1 Сгенерировать секретный ключ

**Вариант 1: OpenSSL**
```bash
openssl rand -base64 32
```

**Вариант 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Вариант 3: Online**
- https://generate-secret.vercel.app/32

**Пример результата:**
```
a3f8d9c2b1e7f6a5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1
```

⚠️ **ВАЖНО:**
- Минимум 32 символа
- Используйте разные ключи для dev и prod
- Никогда не коммитьте в Git

✅ **JWT_SECRET готов!**

---

## 🌐 ШАГ 3: ДЕПЛОЙ НА NETLIFY

### 3.1 Подготовка кода

1. **Убедитесь что код в Git:**
   ```bash
   cd buh-ai-assistant
   git add .
   git commit -m "feat: ready for production deploy v29"
   git push origin main
   ```

2. **Проверьте package.json:**
   ```json
   {
     "scripts": {
       "build": "next build",
       "start": "next start"
     }
   }
   ```

3. **Проверьте next.config.js:**
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     // Для Netlify dynamic site
   };

   module.exports = nextConfig;
   ```

### 3.2 Создание Netlify Site

1. Откройте: https://app.netlify.com/
2. Нажмите **Add new site** → **Import an existing project**
3. Выберите **GitHub** (или где у вас репозиторий)
4. Авторизуйте Netlify в GitHub
5. Выберите репозиторий: `buh-ai-assistant`
6. **Build settings:**
   - Branch: `main`
   - Build command: `npm run build` (или `bun run build`)
   - Publish directory: `.next`
   - Functions directory: `netlify/functions` (оставьте пустым)

⚠️ **НЕ НАЖИМАЙТЕ "Deploy" ЕЩЁ!** Сначала настроим переменные окружения.

### 3.3 Настройка Environment Variables

В Netlify Dashboard → **Site settings** → **Environment variables**:

Добавьте следующие переменные:

#### Обязательные:

```bash
# Database
DATABASE_URL=postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require

# JWT
JWT_SECRET=a3f8d9c2b1e7f6a5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1
JWT_EXPIRES_IN=7d

# Next.js
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
```

#### Опциональные (для полного функционала):

```bash
# Auth4App (для реальной авторизации)
NEXT_PUBLIC_AUTH4APP_API_KEY=your_auth4app_api_key
NEXT_PUBLIC_AUTH4APP_PROJECT_ID=your_project_id

# OpenAI (для ИИ генерации)
OPENAI_API_KEY=sk-your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# Upstash Redis (для rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Sentry (для мониторинга ошибок)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=your_sentry_token

# Админ
NEXT_PUBLIC_ADMIN_PHONE=+79999999999

# Demo
NEXT_PUBLIC_DEMO_DOCUMENTS_LIMIT=5
```

### 3.4 Первый деплой

1. Нажмите **Deploy site**
2. Ждите 3-5 минут
3. Следите за логами в **Deploys** → **Deploy log**

**Ожидаемый результат:**
```
✓ Building application
✓ Collecting page data
✓ Finalizing page optimization
✓ Deploying to Netlify Edge
✓ Site is live at https://xxx.netlify.app
```

⚠️ **Если деплой упал:**
- Проверьте Build log на ошибки
- Убедитесь что DATABASE_URL правильный
- Проверьте что все зависимости установлены

---

## 🔧 ШАГ 4: МИГРАЦИИ БД

После успешного деплоя нужно выполнить миграции:

### 4.1 Локально (рекомендуется)

```bash
# 1. Установите DATABASE_URL из production
export DATABASE_URL="postgresql://..."

# 2. Выполните миграции
bunx prisma migrate deploy

# 3. Проверьте что таблицы созданы
bunx prisma studio
```

### 4.2 Через Netlify CLI (альтернатива)

```bash
# Установить Netlify CLI
npm install -g netlify-cli

# Залогиниться
netlify login

# Подключиться к сайту
netlify link

# Выполнить команду в контексте Netlify
netlify exec -- bunx prisma migrate deploy
```

### 4.3 Проверка БД

Откройте Neon Console → **Tables**

Должны быть таблицы:
- ✅ `User`
- ✅ `Organization`
- ✅ `Document`
- ✅ `DemoStatus`
- ✅ `TemplateConfig`

---

## 🧪 ШАГ 5: ТЕСТИРОВАНИЕ PRODUCTION

### 5.1 Базовые тесты

Откройте ваш сайт: `https://your-site.netlify.app`

**1. Авторизация:**
- [ ] Открывается страница входа
- [ ] Можно ввести номер телефона
- [ ] Работает mock-код (если Auth4App не настроен)
- [ ] Перенаправляет на `/templates`

**2. Создание организации:**
- [ ] `/org/create` открывается
- [ ] Форма валидируется
- [ ] После создания появляется в списке
- [ ] Проверьте в Prisma Studio - должна быть запись

**3. Создание документа:**
- [ ] Выберите шаблон
- [ ] Заполните реквизиты
- [ ] Документ создаётся
- [ ] Появляется в `/docs`
- [ ] Проверьте в БД

**4. Демо-лимит:**
- [ ] Создайте 5 документов
- [ ] При попытке создать 6-й - ошибка
- [ ] Redirect на `/trial/expired`

### 5.2 Тесты UI/UX

- [ ] Skeleton loaders показываются при загрузке
- [ ] Confirm dialog при удалении организации
- [ ] Оптимистичные обновления работают (мгновенный UI)
- [ ] Темная тема переключается
- [ ] Мобильная версия адаптивна

### 5.3 Тесты безопасности

**1. Проверить JWT:**
```bash
# Попытка без токена
curl https://your-site.netlify.app/api/organizations

# Должен вернуть 401 Unauthorized
```

**2. Проверить rate limiting:**
```bash
# 25 запросов подряд
for i in {1..25}; do
  curl https://your-site.netlify.app/api/organizations
done

# После 20-го должен вернуть 429 Too Many Requests
```

**3. Проверить валидацию:**
```bash
# Невалидный ИНН
curl -X POST https://your-site.netlify.app/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"inn": "123"}'

# Должен вернуть 400 с описанием ошибки
```

---

## 📊 ШАГ 6: МОНИТОРИНГ

### 6.1 Netlify Analytics

**Бесплатно включено:**
- Трафик
- Bandwidth
- Build time
- Function invocations

**Где смотреть:**
- Netlify Dashboard → **Analytics**

### 6.2 Sentry (опционально)

Если настроили `NEXT_PUBLIC_SENTRY_DSN`:

1. Откройте: https://sentry.io/
2. Перейдите в ваш проект
3. **Issues** → увидите все ошибки в production

### 6.3 Neon Metrics

1. Neon Console → **Monitoring**
2. Смотрите:
   - Database connections
   - Query performance
   - Storage usage

---

## 🔄 ШАГ 7: CONTINUOUS DEPLOYMENT

После первого деплоя Netlify автоматически:

✅ **При каждом push в main:**
1. Забирает новый код
2. Запускает build
3. Деплоит на production

✅ **При каждом PR:**
1. Создаёт preview deployment
2. Можно протестировать изменения
3. Merge → автодеплой в prod

**Настройка:**
- Netlify Dashboard → **Site settings** → **Build & deploy**
- **Deploy contexts** → **Production branch**: main
- **Branch deploys**: All (для preview)

---

## 🌍 ШАГ 8: КАСТОМНЫЙ ДОМЕН (опционально)

### 8.1 Добавить домен

1. Netlify Dashboard → **Domain settings**
2. **Add custom domain**
3. Введите ваш домен: `buh-assistant.ru`
4. Netlify даст DNS записи

### 8.2 Настроить DNS

У вашего регистратора доменов добавьте:

**Вариант A: Netlify DNS (рекомендуется)**
```
Nameservers:
dns1.p01.nsone.net
dns2.p01.nsone.net
dns3.p01.nsone.net
dns4.p01.nsone.net
```

**Вариант B: A Record**
```
Type: A
Name: @
Value: 75.2.60.5
```

### 8.3 SSL сертификат

Netlify автоматически выпустит Let's Encrypt сертификат:
- ✅ HTTPS включён
- ✅ Автопродление
- ✅ Бесплатно

Ждите 30-60 минут для DNS propagation.

---

## 🐛 TROUBLESHOOTING

### Проблема 1: Build Failed

**Ошибка:** `Error: Cannot find module 'xyz'`

**Решение:**
```bash
# Убедитесь что зависимость в package.json
bun add xyz

# Закоммитьте и пушните
git add package.json bun.lockb
git commit -m "fix: add missing dependency"
git push
```

---

### Проблема 2: DATABASE_URL не работает

**Ошибка:** `Error: Connection refused`

**Решение:**
1. Проверьте что DATABASE_URL правильный
2. Убедитесь что `?sslmode=require` в конце
3. Проверьте что IP разрешён в Neon (обычно разрешены все)
4. Перезапустите деплой

---

### Проблема 3: 500 Internal Server Error

**Ошибка:** Сайт открывается, но API возвращает 500

**Решение:**
1. Откройте Netlify → **Functions** → **Logs**
2. Посмотрите ошибку
3. Чаще всего: DATABASE_URL или JWT_SECRET не установлен
4. Добавьте в Environment Variables → Redeploy

---

### Проблема 4: JWT не работает

**Ошибка:** `401 Unauthorized` на всех запросах

**Решение:**
1. Проверьте что JWT_SECRET установлен в Netlify
2. Убедитесь что JWT_SECRET >= 32 символа
3. Перелогиньтесь (получите новый токен)
4. Проверьте cookies в DevTools

---

### Проблема 5: Rate Limiting не работает

**Ошибка:** Нет 429 после 20 запросов

**Причина:** Upstash Redis не настроен

**Решение:**
- Это нормально! Работает в mock-режиме
- Чтобы включить реальный rate limiting:
  1. Регистрация: https://upstash.com/
  2. Create Database → REST API
  3. Копируйте URL и Token
  4. Добавьте в Netlify Environment Variables
  5. Redeploy

---

## 📈 ПРОИЗВОДИТЕЛЬНОСТЬ

### Оптимизация (опционально):

**1. Edge Functions (Netlify)**
- Автоматически используются для API routes
- Лучшая latency

**2. Image Optimization**
- Next.js автоматически оптимизирует
- Используйте `next/image` везде

**3. Database Connection Pooling**
- Prisma автоматически делает pooling
- Neon serverless = auto-scaling

**4. Caching**
- React Query кеширует на клиенте (1 минута)
- Можно увеличить в `src/providers/QueryProvider.tsx`

---

## 💰 СТОИМОСТЬ

### Free Tier (до 100 пользователей/день):

| Сервис | Free Tier | Достаточно для |
|--------|-----------|----------------|
| **Netlify** | 100 GB bandwidth | ~10k визитов/месяц |
| **Neon PostgreSQL** | 0.5 GB storage | ~1000 документов |
| **Upstash Redis** | 10k commands/день | ~100 пользователей |
| **Sentry** | 5k events/месяц | ~500 ошибок/месяц |
| **Resend** | 100 emails/день | Уведомления |

**TOTAL: $0/месяц** 🎉

### Платные планы (при росте):

| Сервис | Plan | Цена | Лимиты |
|--------|------|------|--------|
| **Netlify Pro** | Pro | $19/мес | 1 TB bandwidth |
| **Neon** | Launch | $19/мес | 10 GB, auto-scaling |
| **Upstash** | Pay-as-go | ~$10/мес | Unlimited |
| **Sentry** | Team | $26/мес | 50k events |

**TOTAL: ~$74/месяц** для 10k пользователей

---

## ✅ ФИНАЛЬНЫЙ ЧЕКЛИСТ

### Перед запуском:
- [ ] DATABASE_URL настроен в Netlify
- [ ] JWT_SECRET сгенерирован и добавлен
- [ ] Миграции выполнены
- [ ] Тестовая регистрация работает
- [ ] Можно создать организацию
- [ ] Можно создать документ
- [ ] Демо-лимит срабатывает
- [ ] Skeleton loaders работают
- [ ] Confirm dialogs работают
- [ ] Темная тема переключается

### Опционально:
- [ ] Auth4App настроен
- [ ] OpenAI API ключ добавлен
- [ ] Upstash Redis настроен
- [ ] Sentry настроен
- [ ] Кастомный домен подключён
- [ ] SSL сертификат активен

### После запуска:
- [ ] Проверить Netlify Analytics
- [ ] Проверить Sentry Dashboard (если настроен)
- [ ] Проверить Neon Monitoring
- [ ] Создать тестовый аккаунт
- [ ] Пройти полный user flow
- [ ] Проверить на мобильном

---

## 🎯 NEXT STEPS

### 1. Маркетинг:
- Создать landing page
- Добавить SEO meta tags
- Настроить Google Analytics

### 2. Улучшения:
- Email уведомления (Resend)
- Экспорт/Импорт данных
- Telegram bot интеграция

### 3. Масштабирование:
- CDN для статики (Cloudflare)
- Upgrade Neon при росте
- Monitoring и alerting

---

## 📞 ПОДДЕРЖКА

### Если что-то не работает:

1. **Проверьте Netlify Deploy Log**
   - Dashboard → Deploys → Deploy log

2. **Проверьте Function Logs**
   - Dashboard → Functions → Logs

3. **Проверьте Sentry (если настроен)**
   - https://sentry.io/ → Issues

4. **Проверьте Neon**
   - Console → Monitoring

5. **Обратитесь в поддержку:**
   - Netlify: https://answers.netlify.com/
   - Neon: https://neon.tech/docs/
   - Same: support@same.new

---

## 🎉 ПОЗДРАВЛЯЕМ!

**Ваше приложение в production! 🚀**

**Готово:**
- ✅ Деплой на Netlify
- ✅ PostgreSQL БД работает
- ✅ JWT авторизация
- ✅ Все UX улучшения
- ✅ Мониторинг настроен

**Статус:** Production-Ready 100%

**Версия:** v29

---

*Production Deploy Guide*
*20 октября 2025*
