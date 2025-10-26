# Netlify Setup Guide

## 🔐 Обязательные переменные окружения

Для работы приложения на Netlify необходимо установить следующие переменные окружения:

### Путь к настройкам:
1. Откройте https://app.netlify.com
2. Выберите ваш сайт
3. Перейдите в **Site settings** → **Environment variables**

### Обязательные переменные:

#### JWT_SECRET (ОБЯЗАТЕЛЬНО!)
```
Name: JWT_SECRET
Value: test-secret-key-for-development-min-32-chars-long-12345678
```

⚠️ **ВАЖНО**: Для продакшена сгенерируйте безопасный ключ:
```bash
openssl rand -base64 32
```

#### JWT_EXPIRES_IN (опционально, по умолчанию "7d")
```
Name: JWT_EXPIRES_IN
Value: 7d
```

### Опциональные переменные:

#### Admin Email
```
Name: NEXT_PUBLIC_ADMIN_EMAIL
Value: your-admin@email.com
```

#### Database (если используется Prisma)
```
Name: DATABASE_URL
Value: postgresql://user:password@host:5432/dbname
```

#### Email (если используется отправка email)
```
Name: EMAIL_FROM
Value: noreply@yourdomain.com

Name: SMTP_HOST
Value: smtp.gmail.com

Name: SMTP_PORT
Value: 587

Name: SMTP_USER
Value: your-email@gmail.com

Name: SMTP_PASS
Value: your-app-password
```

## 🔄 После добавления переменных:

### Вариант 1: Через Netlify UI
1. Перейдите в **Deploys**
2. Нажмите **"Trigger deploy"** → **"Clear cache and deploy site"**

### Вариант 2: Через Git
```bash
git commit --allow-empty -m "Trigger Netlify redeploy"
git push origin main
```

## ✅ Проверка

После деплоя проверьте:
1. Войдите на ваш сайт
2. Попробуйте авторизоваться
3. Проверьте доступ к защищённым страницам (/org, /docs, /profile)
4. В логах Netlify Functions должны появиться сообщения о создании и проверке JWT токенов

## 🐛 Troubleshooting

### Проблема: "Invalid or expired token"
- Проверьте, что JWT_SECRET установлен на Netlify
- Убедитесь, что сделали редеплой после установки переменных
- Очистите cookies в браузере и войдите заново

### Проблема: "Unauthorized" на всех страницах
- JWT_SECRET не установлен или имеет неверное значение
- Сделайте редеплой после установки переменных

### Проблема: Cookie не сохраняется
- Проверьте, что ваш домен использует HTTPS
- Для production secure cookies должны быть true

