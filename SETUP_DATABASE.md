# 🚀 Быстрая настройка базы данных Neon

## ⚡ 3 шага до запуска

### Шаг 1: Получите DATABASE_URL из Neon

1. Откройте https://neon.tech
2. Войдите в свой проект
3. Найдите **Connection String**
4. Скопируйте строку подключения

Выглядит примерно так:
```
postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

### Шаг 2: Добавьте в .env

Создайте файл `.env` в корне проекта:

```bash
# .env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="ваш_секрет_минимум_32_символа"
```

**Важно:** `.env` уже в `.gitignore` - секреты не попадут в Git ✅

---

### Шаг 3: Синхронизируйте схему с Neon

```bash
# Prisma создаст таблицы в вашей Neon базе данных
bunx prisma db push

# Сгенерирует TypeScript типы
bunx prisma generate
```

---

## ✅ Готово!

Теперь ваш код подключен к Neon:

```typescript
// Этот код работает с вашей Neon БД:
const user = await prisma.user.findUnique({ ... })
                     ↓
              [Prisma ORM]
                     ↓
              [DATABASE_URL]
                     ↓
              [Neon PostgreSQL]
```

---

## 🔍 Проверка подключения

```bash
# Откроет веб-интерфейс для просмотра БД
bunx prisma studio
```

Откроется http://localhost:5555 с вашими таблицами из Neon!

---

## 📊 Что создаст Prisma в Neon:

После `bunx prisma db push` в вашей Neon базе появятся **10 таблиц**:

1. `User` - Пользователи
2. `LoginToken` - Коды для входа
3. `Organization` - Организации
4. `Document` - Документы
5. `DemoStatus` - Демо-лимиты
6. `Template` - Шаблоны
7. `TemplateConfig` - Конфигурации
8. `AccessHistory` - История доступа
9. `RefreshToken` - Refresh токены
10. `EmailVerification` - Верификация email

---

## 🎯 ВАЖНО:

- **Neon** = ваша база данных (уже есть) ✅
- **Prisma** = инструмент в коде (уже есть) ✅
- **DATABASE_URL** = связь между ними (нужно добавить) ⚠️

---

## 💡 Аналогия для программистов:

| Технология | Роль |
|------------|------|
| PostgreSQL (Neon) | Физический сервер БД |
| Prisma | ORM (как Eloquent/TypeORM/Hibernate) |
| DATABASE_URL | Connection string |
| `prisma.user.create()` | Замена чистому SQL |

---

## 🆘 Troubleshooting

### "Environment variable not found: DATABASE_URL"
✅ Создайте `.env` файл в корне проекта

### "Can't reach database server"
✅ Проверьте что DATABASE_URL правильный
✅ Проверьте что Neon проект активен

### "Migration failed"
✅ Используйте `bunx prisma db push` (не migrate dev)
✅ Для пустой БД миграции не нужны!

---

**Время на настройку:** 2 минуты ⏱️  
**После этого всё заработает!** 🚀

