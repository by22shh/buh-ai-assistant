# ⚡ БЫСТРЫЙ ДЕПЛОЙ (5 минут)

Минимальные шаги для запуска в production.

---

## 1️⃣ NEON POSTGRESQL (2 мин)

1. https://neon.tech/ → Sign Up → Create Project
2. Скопируйте **Connection String**:
   ```
   postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

---

## 2️⃣ JWT SECRET (30 сек)

Сгенерируйте:
```bash
openssl rand -base64 32
```

Или: https://generate-secret.vercel.app/32

---

## 3️⃣ NETLIFY DEPLOY (2 мин)

1. https://app.netlify.com/ → Add new site → Import from Git
2. Выберите репозиторий
3. **НЕ НАЖИМАЙТЕ Deploy еще!**

---

## 4️⃣ ENV VARIABLES (1 мин)

Site settings → Environment variables → Add:

```bash
# Обязательные
DATABASE_URL=postgresql://...из_шага_1
JWT_SECRET=...из_шага_2
NODE_ENV=production

# Опциональные (можно пропустить)
NEXT_PUBLIC_ADMIN_PHONE=+79999999999
NEXT_PUBLIC_DEMO_DOCUMENTS_LIMIT=5
```

---

## 5️⃣ DEPLOY (30 сек)

1. Нажмите **Deploy site**
2. Ждите 3-5 минут
3. Готово! ✅

---

## 6️⃣ МИГРАЦИИ (1 мин)

```bash
export DATABASE_URL="postgresql://...из_шага_1"
bunx prisma migrate deploy
```

---

## 7️⃣ ПРОВЕРКА

Откройте `https://your-site.netlify.app`

1. Войдите (номер: +7 920 222-22-22, код: 1234)
2. Создайте организацию
3. Создайте документ
4. Проверьте в Prisma Studio - данные в БД ✅

---

## ✅ ГОТОВО!

**Ваш сайт работает!** 🎉

Полная инструкция: [PRODUCTION_DEPLOY_GUIDE.md](./PRODUCTION_DEPLOY_GUIDE.md)

---

**Время:** 5-7 минут
**Стоимость:** $0
**Статус:** Production-Ready ✅
