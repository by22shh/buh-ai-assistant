# 📚 Документация проекта

Добро пожаловать в документацию "Бухгалтерский ИИ-помощник"!

---

## ⚡ НАЧНИТЕ ОТСЮДА

**👉 [START_HERE.md](./START_HERE.md) - Быстрый старт на 15 минут**

Код обновлен на Email авторизацию, но требуется миграция БД!

---

## 🚀 Пошаговые инструкции

**Только что обновили код?** Следуйте этим шагам:

1. **Миграция БД** → [`VISUAL_MIGRATION_GUIDE.md`](./VISUAL_MIGRATION_GUIDE.md) (5 минут)
2. **Настройка Email** → [`EMAIL_SETUP_GUIDE.md`](./EMAIL_SETUP_GUIDE.md) (5 минут)
3. **Проверка** → [`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md) (5 минут)

---

## 📖 Основные руководства

### Миграция базы данных

После перехода с Auth4App на Email авторизацию нужно обновить схему БД.

- **🎨 Визуальный гайд с картинками** → [`VISUAL_MIGRATION_GUIDE.md`](./VISUAL_MIGRATION_GUIDE.md) ⭐
- **⚡ Быстрый старт (5 мин)** → [`QUICK_MIGRATION.md`](./QUICK_MIGRATION.md)
- **📖 Полное руководство** → [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)
- **✅ Чеклист** → [`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md)
- **📝 SQL скрипт** → [`migration.sql`](./migration.sql)

### Email авторизация

Настройка и использование Email-based authentication.

- **📧 Настройка Gmail** → [`EMAIL_SETUP_GUIDE.md`](./EMAIL_SETUP_GUIDE.md)
- **🔐 Как работает** → [`EMAIL_AUTH_GUIDE.md`](./EMAIL_AUTH_GUIDE.md)

### Текущие задачи

- **✅ Список задач** → [`todos.md`](./todos.md)

---

## 🗂️ Структура документации

```
.same/
├── README.md                   # ← Вы здесь
├── START_HERE.md               # ⚡ НАЧНИТЕ ОТСЮДА! (15 мин)
├── todos.md                    # Текущие задачи
│
├── VISUAL_MIGRATION_GUIDE.md   # 🎨 Визуальный гайд миграции (с картинками)
├── QUICK_MIGRATION.md          # ⚡ Быстрая миграция БД (5 мин)
├── MIGRATION_GUIDE.md          # 📖 Полное руководство по миграции
├── MIGRATION_CHECKLIST.md      # ✅ Чеклист миграции
├── migration.sql               # 📝 SQL скрипт для миграции
│
├── EMAIL_SETUP_GUIDE.md        # 📧 Настройка Gmail для отправки email
└── EMAIL_AUTH_GUIDE.md         # 🔐 Документация Email авторизации
```

---

## ⚡ Частые вопросы

### Нужно ли делать миграцию БД?

**Да!** Если вы обновили код с Auth4App на Email авторизацию, миграция **обязательна**.

Без миграции авторизация не будет работать.

### Как настроить отправку email?

См. [`EMAIL_SETUP_GUIDE.md`](./EMAIL_SETUP_GUIDE.md) - пошаговая инструкция для Gmail.

### Что делать если email не приходят?

1. Проверьте настройку Gmail App Password
2. Проверьте папку Спам
3. Проверьте логи Netlify Functions
4. См. Troubleshooting в [`EMAIL_SETUP_GUIDE.md`](./EMAIL_SETUP_GUIDE.md)

### Как проверить что миграция прошла успешно?

См. раздел "Проверка" в [`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md)

---

## 🛠️ Полезные команды

### Prisma

```bash
# Применить миграции на production
export DATABASE_URL="ваш_url"
bunx prisma migrate deploy

# Открыть Prisma Studio
bunx prisma studio

# Проверить схему
bunx prisma validate

# Сгенерировать Prisma Client
bunx prisma generate
```

### Git

```bash
# Посмотреть изменения
git status

# Создать коммит
git add .
git commit -m "feat: migrate to email auth"

# Отправить на GitHub
git push origin main
```

### Netlify

```bash
# Войти в Netlify
netlify login

# Посмотреть статус
netlify status

# Посмотреть логи
netlify logs

# Trigger deploy
netlify deploy --prod
```

---

## 📞 Поддержка

Если что-то не работает:

1. Проверьте [`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md) - секция Troubleshooting
2. Проверьте [`EMAIL_SETUP_GUIDE.md`](./EMAIL_SETUP_GUIDE.md) - секция Troubleshooting
3. Проверьте логи в Netlify Functions
4. Проверьте Environment Variables в Netlify

---

## 🎯 Что дальше?

После успешной миграции и настройки:

1. ✅ Протестируйте авторизацию на разных браузерах
2. ✅ Обновите существующих пользователей с реальными email (если нужно)
3. ✅ Настройте rate limiting (опционально)
4. ✅ Кастомизируйте email templates (опционально)
5. ✅ Готово к production использованию!

---

## 📝 История изменений

- **2025-10-26**: Переход с Auth4App на Email авторизацию
  - Удалена интеграция Auth4App
  - Удалена Telegram/WhatsApp авторизация
  - Добавлена простая Email + код авторизация
  - Обновлена схема БД (User.email, LoginToken)
  - Создана документация

---

**Удачи с миграцией!** 🚀
