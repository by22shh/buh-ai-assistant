# ⚡ НАЧНИТЕ ОТСЮДА

## 🚨 Важно! Код обновлен, но БД требует миграции

Ваш код переведен на **Email авторизацию**, но база данных еще использует старую схему с `phone`.

**Без миграции БД авторизация НЕ РАБОТАЕТ!**

---

## 🎯 Что нужно сделать (15 минут)

### Шаг 1: Миграция БД (5 минут) ⚡ ОБЯЗАТЕЛЬНО

Выберите один из способов:

#### Способ A: Через Neon Console (проще всего) ⭐

1. Откройте https://console.neon.tech
2. Выберите вашу БД
3. SQL Editor
4. Скопируйте весь код из файла `.same/migration.sql`
5. Вставьте в SQL Editor
6. Нажмите "Run"
7. ✅ Готово!

**Подробно с картинками:** `.same/VISUAL_MIGRATION_GUIDE.md`

#### Способ B: Через команду в терминале

```bash
# 1. Получите DATABASE_URL из Netlify Environment Variables
export DATABASE_URL="postgresql://..."

# 2. Перейдите в директорию проекта
cd buh-ai-assistant

# 3. Примените миграцию
bunx prisma migrate deploy
```

**Подробно:** `.same/QUICK_MIGRATION.md`

---

### Шаг 2: Настройка Gmail (5 минут) ⚡ ОБЯЗАТЕЛЬНО

Для отправки кодов на email нужен Gmail App Password:

1. Откройте https://myaccount.google.com/apppasswords
2. Выберите "Mail" → "Other" → "Buh Assistant"
3. Нажмите "Generate"
4. Скопируйте пароль (16 символов)
5. Добавьте в Netlify Environment Variables:
   - `EMAIL_USER=your.email@gmail.com`
   - `EMAIL_PASSWORD=xxxx xxxx xxxx xxxx`

**Подробно:** `.same/EMAIL_SETUP_GUIDE.md`

---

### Шаг 3: Перезапуск деплоя (1 минута)

В Netlify Dashboard:

1. Deploys → Trigger deploy → Deploy site
2. Дождитесь окончания сборки
3. ✅ Готово!

---

### Шаг 4: Тестирование (2 минуты)

1. Откройте ваш сайт → `/auth/login`
2. Введите email
3. Проверьте почту → должен прийти 6-значный код
4. Введите код
5. ✅ Вы должны войти в систему!

---

## 📚 Полная документация

Если нужны детали или что-то не работает:

- **📊 Блок-схема процесса** → `.same/MIGRATION_FLOWCHART.md`
- **🎨 Визуальный гайд** → `.same/VISUAL_MIGRATION_GUIDE.md`
- **⚡ Быстрый старт** → `.same/QUICK_MIGRATION.md`
- **📖 Полное руководство** → `.same/MIGRATION_GUIDE.md`
- **✅ Чеклист** → `.same/MIGRATION_CHECKLIST.md`
- **📧 Email настройка** → `.same/EMAIL_SETUP_GUIDE.md`
- **📚 Главная страница** → `.same/README.md`

---

## 🆘 Troubleshooting

### Email не приходят

1. Проверьте `EMAIL_USER` и `EMAIL_PASSWORD` в Netlify
2. Убедитесь что используете App Password, не обычный пароль
3. Проверьте папку Спам
4. См. `.same/EMAIL_SETUP_GUIDE.md` → Troubleshooting

### 500 Internal Server Error

1. Проверьте что миграция БД выполнена
2. Проверьте логи в Netlify Functions
3. Убедитесь что `DATABASE_URL` правильный
4. См. `.same/MIGRATION_CHECKLIST.md` → Troubleshooting

### "Invalid or expired code"

1. Коды действуют 10 минут
2. Попробуйте запросить новый код
3. Убедитесь что таблица `LoginToken` создана в БД

---

## ⏱️ Ожидаемое время

- ✅ Миграция БД: **5 минут**
- ✅ Настройка Email: **5 минут**
- ✅ Перезапуск деплоя: **2 минуты**
- ✅ Тестирование: **3 минуты**

**Итого: ~15 минут**

---

## 🎉 После завершения

У вас будет:

- ✅ Email авторизация вместо телефонов
- ✅ Простой вход с 6-значным кодом
- ✅ Отправка кодов на почту
- ✅ Независимость от Auth4App и мессенджеров
- ✅ Более простая и понятная система

---

## ❓ Вопросы?

1. Сначала проверьте **Troubleshooting** разделы в гайдах
2. Проверьте логи Netlify Functions
3. Проверьте Environment Variables в Netlify
4. См. подробную документацию в `.same/README.md`

---

**Начните с миграции БД прямо сейчас!** ⚡

👉 `.same/VISUAL_MIGRATION_GUIDE.md` - самый простой способ
