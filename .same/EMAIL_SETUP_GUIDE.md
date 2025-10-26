# Настройка Email для авторизации

## Быстрая настройка (5 минут)

Для отправки кодов авторизации используется Gmail SMTP.

### Шаг 1: Подготовьте Gmail аккаунт

Используйте любой Gmail аккаунт (можно создать новый специально для приложения).

### Шаг 2: Создайте "Пароль приложения"

1. Откройте https://myaccount.google.com/apppasswords
2. Войдите в свой Google аккаунт
3. В поле "Выберите приложение" → выберите **"Почта"**
4. В поле "Выберите устройство" → выберите **"Другое"** → введите "Buh Assistant"
5. Нажмите **"Создать"**
6. Скопируйте сгенерированный пароль (16 символов)

### Шаг 3: Добавьте в Netlify

В настройках Netlify → Environment Variables:

```
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=ваш_пароль_приложения_без_пробелов
```

### Шаг 4: Готово! ✅

Теперь коды будут отправляться на email пользователей.

## Пример email

```
Тема: Код для входа

Ваш код для входа в систему:

  123456

Код действителен 10 минут.
```

## Troubleshooting

### "Invalid login" или "Username and Password not accepted"

**Проблема:** Используете обычный пароль вместо пароля приложения.

**Решение:** Создайте пароль приложения по инструкции выше.

### "Less secure app access"

**Проблема:** Двухфакторная аутентификация не включена.

**Решение:**
1. Включите 2FA: https://myaccount.google.com/signinoptions/two-step-verification
2. После включения 2FA создайте пароль приложения

### Письма не приходят

**Проверьте:**
1. Правильность email в `EMAIL_USER`
2. Пароль приложения (без пробелов)
3. Папку "Спам" у получателя
4. Логи в Netlify Functions

## Альтернативные решения

Если Gmail не подходит, можно использовать:

### 1. Yandex Mail
```env
EMAIL_USER=your@yandex.ru
EMAIL_PASSWORD=app_password
```

В коде измените:
```typescript
service: 'yandex'  // вместо 'gmail'
```

### 2. Mail.ru
```env
EMAIL_USER=your@mail.ru
EMAIL_PASSWORD=app_password
```

В коде измените:
```typescript
host: 'smtp.mail.ru'
port: 465
secure: true
```

### 3. Другой SMTP

```typescript
const transporter = nodemailer.createTransport({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

## Безопасность

✅ **Используйте пароль приложения**, не обычный пароль
✅ **Не коммитьте** пароли в Git
✅ **Храните** пароли только в Netlify Environment Variables
✅ **Создайте отдельный** Gmail аккаунт для приложения (рекомендуется)

## Лимиты

Gmail SMTP бесплатно:
- **500 писем в день** для обычных аккаунтов
- **2000 писем в день** для Google Workspace

Этого достаточно для большинства приложений!
