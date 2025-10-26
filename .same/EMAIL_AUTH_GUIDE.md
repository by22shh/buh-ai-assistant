# Email Authentication System

## Обзор

Приложение использует простую и безопасную систему авторизации через email с одноразовыми кодами.

## Как это работает

### Для пользователя:

1. **Введите email** на странице входа
2. **Получите 6-значный код** на почту
3. **Введите код** на сайте
4. **Готово** - вы авторизованы!

### Технически:

1. Пользователь вводит email
2. Система генерирует 6-значный код
3. Код сохраняется в базе данных с временем истечения (10 минут)
4. Код отправляется на email пользователя
5. Пользователь вводит код
6. Система проверяет код в БД
7. При совпадении - создается JWT токен и пользователь авторизован

## Endpoints

### POST /api/auth/send-code

Отправка кода на email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Код отправлен на email",
  "token": "verification_token",
  "code": "123456" // только в development
}
```

### POST /api/auth/verify-code

Проверка кода и авторизация.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "email": "user@example.com",
  "message": "Авторизация успешна",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "emailVerified": true
  }
}
```

## База данных

### User model

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  emailVerified Boolean  @default(false)
  role          String   @default("user")
  // ... other fields
}
```

### LoginToken model

```prisma
model LoginToken {
  id         String   @id @default(uuid())
  email      String
  code       String   // 6-digit code
  token      String   @unique
  expiresAt  DateTime
  used       Boolean  @default(false)
  createdAt  DateTime @default(now())
}
```

## Email Service Integration

### Используется Gmail SMTP

Email отправляются через Gmail SMTP с использованием Nodemailer.

**Необходимо настроить:**
1. `EMAIL_USER` - ваш Gmail адрес
2. `EMAIL_PASSWORD` - пароль приложения Gmail

### Настройка (5 минут)

**Подробная инструкция:** см. `.same/EMAIL_SETUP_GUIDE.md`

**Быстро:**
1. Создайте пароль приложения: https://myaccount.google.com/apppasswords
2. Добавьте в Netlify Environment Variables:
   ```
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```
3. Готово!

### Fallback режим

Если `EMAIL_USER` или `EMAIL_PASSWORD` не настроены:
- Код **возвращается в API ответе** (показывается на сайте)
- Удобно для тестирования
- ⚠️ **Небезопасно** для production!

## Безопасность

### Защита от брутфорса

- Коды истекают через 10 минут
- Старые неиспользованные коды удаляются при запросе нового
- Каждый код можно использовать только один раз

### JWT Токены

- httpOnly cookie
- Secure в production
- sameSite: 'lax'
- Срок действия: 7 дней

## Admin Configuration

Укажите email администратора в `.env`:

```env
NEXT_PUBLIC_ADMIN_EMAIL="admin@yourdomain.com"
```

Пользователь с этим email автоматически получит роль `admin`.

## Миграция данных

Если у вас были пользователи с телефонами, выполните миграцию:

```sql
-- Добавить email column
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN DEFAULT false;

-- Скопировать phone в email (временно)
UPDATE "User" SET "email" = "phone" WHERE "email" IS NULL;

-- Сделать email обязательным
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Сделать phone опциональным
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;
DROP INDEX IF EXISTS "User_phone_key";
```

## Testing

### Manual Testing

1. Откройте страницу логина
2. Введите любой email
3. Код появится в toast уведомлении (development mode)
4. Введите код
5. Вы авторизованы!

### API Testing

```bash
# Send code
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Verify code (use code from console logs)
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

## Troubleshooting

### Код не приходит на email

1. Проверьте что настроен `RESEND_API_KEY`
2. Проверьте логи сервера на ошибки
3. Проверьте папку спам
4. В development коды показываются в toast, email не отправляется

### "Неверный или истекший код"

1. Код действителен только 10 минут
2. Каждый код можно использовать только раз
3. Убедитесь что вводите правильный код
4. Запросите новый код

### JWT токен не сохраняется

1. Проверьте что настроен `JWT_SECRET`
2. В production должен быть `secure: true` для cookies
3. Проверьте настройки CORS если фронтенд на другом домене
