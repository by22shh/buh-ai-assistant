# Авторизация и роли через Auth4App

---

## Связанные страницы

- [Страница с шаблонами](../%D0%9A%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3%20%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD%D0%BE%D0%B2%20(Admin)%20290eb7bb740980fbb1f9e84a8df0ee21/%D0%9A%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3%20%D1%88%D0%B0%D0%B1%D0%BB%D0%BE%D0%BD%D0%BE%D0%B2%20%E2%80%94%20%D0%90%D0%B4%D0%BC%D0%B8%D0%BD%20(Admin)%2028aeb7bb740980fcac13d4842d08e63d.md) — базовый роут после входа (User).
- [Управление доступом/тарифом (Admin)](../%D0%90%D0%B4%D0%BC%D0%B8%D0%BD%D0%B8%D1%81%D1%82%D1%80%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D0%B8%20%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF%D1%8B%20290eb7bb740980659db0e65bfbc7f49f/%D0%A1%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0%20%C2%AB%D0%A3%D0%BF%D1%80%D0%B0%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5%20%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF%D0%BE%D0%BC%20%D1%82%D0%B0%D1%80%D0%B8%D1%84%D0%BE%D0%BC%C2%BB%20(Admin)%2028feb7bb74098096964ddbcdba8407e3.md) — доступ к админ-функциям.
- [Демо закончился](../%D0%A0%D0%B0%D0%B1%D0%BE%D1%82%D0%B0%20%D1%81%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BC%D0%B8%20(User)%20290eb7bb7409804da0aed86f3433deb2/%D0%A1%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0%20%C2%AB%D0%94%D0%B5%D0%BC%D0%BE%20%D0%B7%D0%B0%D0%BA%D0%BE%D0%BD%D1%87%D0%B8%D0%BB%D1%81%D1%8F%C2%BB%20(User)%2028feb7bb740980168788f46a803fbc3f.md) — поведение при истёкшем периоде.
- [Тело документа — чат](../%D0%A0%D0%B0%D0%B1%D0%BE%D1%82%D0%B0%20%D1%81%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BC%D0%B8%20(User)%20290eb7bb7409804da0aed86f3433deb2/%D0%A1%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0%20%C2%AB%D0%A2%D0%B5%D0%BB%D0%BE%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%20%E2%80%94%20%D1%87%D0%B0%D1%82%C2%BB%20(User)%2028feb7bb74098049b036fe710b2cce31.md) / [Заполнение реквизитов](../%D0%A0%D0%B0%D0%B1%D0%BE%D1%82%D0%B0%20%D1%81%20%D0%B4%D0%BE%D0%BA%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D0%B0%D0%BC%D0%B8%20(User)%20290eb7bb7409804da0aed86f3433deb2/%D0%A1%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0%20%C2%AB%D0%97%D0%B0%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5%20%D1%80%D0%B5%D0%BA%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BE%D0%B2%C2%BB%20(User)%2028feb7bb7409809eac65ca6a6512831e.md) — ограничения по доступу в рабочие экраны.

## Цель

- Единый вход по номеру телефона (OTP по SMS/WhatsApp) через **Auth4App**.
- Роли: `admin`, `user`.
- Контроль доступа по «периоду действия» (даты начала/окончания), который менеджер/админ продлевает вручную.
- Блокировка функционала по истечении периода (экран «Демо закончился»).

> В Auth4App логика — «инициализация авторизации» (создание запроса) и «подтверждение кода». Также есть тестовый номер для автологина в тесте/модерации магазинов. (Auth4App)
> 

---

## Маршруты (frontend)

- **Старт логина:** `GET /auth/login` → кнопка «Войти по телефону»
- **Ввод телефона:** `POST /auth/request` → отправка номера в Auth4App (инициализация)
- **Ввод кода (OTP):** `POST /auth/confirm` → подтверждение кода, получение `accessToken` (JWT) от нашего backend
- **Выход:** `POST /auth/logout` → очистка токена/сессии

---

## Backend API (наш)

- `POST /api/auth/request` → проксирует запрос в Auth4App (инициализация)
- `POST /api/auth/confirm` → подтверждает код в Auth4App; маппит телефон к нашему пользователю; выдаёт наш **JWT** (`sub`, `role`, `access_until`)
- `GET /api/me` → профиль (телефон, роль, дата истечения доступа)
- `GET /api/admin/*` → защищённые админ-эндпоинты
- `GET /api/user/*` → защищённые пользовательские эндпоинты

> В Auth4App сценарий: вы инициируете авторизацию (получаете auth_id/ссылку/переадресацию), а затем подтверждаете код — см. раздел «Инициализация авторизации». (Auth4App)
> 

---

## Роли и доступ

### Модель пользователя (DB)

```json
{
  "id": "uuid",
  "phone": "+7XXXXXXXXXX",
  "role": "admin" | "user",
  "access_from": "2025-10-01T00:00:00Z",
  "access_until": "2025-10-31T23:59:59Z",
  "created_at": "...",
  "updated_at": "..."
}

```

### Правило доступа

- **user/admin** → вход разрешён, если `now ∈ [access_from, access_until]`.
- Если `now > access_until` → любой защищённый маршрут backend возвращает `403` с кодом `ACCESS_EXPIRED`.

---

## Страница «Управление доступом/тарифом» (только админ)

- Маршрут: `/admin/access`
- Функции:
    - Поиск по телефону
    - Просмотр `access_from`, `access_until`, `role`
    - Кнопки: **Выдать/Продлить доступ** (установка дат), **Сменить роль** (`user` ↔ `admin`)
- Сохранение — PATCH на `/api/admin/access/:userId`

> Эта страница — внутренняя, без оплат. Менеджер руками задаёт период. (Связь с экраном «Демо закончился»: см. ниже.)
> 

---

## Экран «Демо закончился»

- Показать, если backend вернул `403 ACCESS_EXPIRED`.
- Маршрут: перехватываем глобально в фронте и ведём на `/billing/expired` (или `/demo-ended`).
- На экране:
    - Заголовок “Демо закончился”
    - Текст: «Ваш доступ истёк. Напишите нам, продлим доступ»
    - CTA: «Связаться в Telegram»
- Возврат к работе — после того как **админ** продлит период; следующий запрос к API пройдёт.

---

## Потоки (flows)

### 1) Логин (OTP)

1. Пользователь вводит телефон → `POST /api/auth/request`
2. Backend вызывает Auth4App «инициализацию» (см. KB) → уходит код по SMS/WhatsApp. ([Auth4App](https://support.auth4app.com/books/rest-api/page/inicializaciia-avtorizacii))
3. Пользователь вводит код → `POST /api/auth/confirm`
4. Backend подтверждает в Auth4App → находит/создаёт пользователя → генерирует наш JWT, где:
    - `sub`: userId
    - `phone`: номер
    - `role`: `admin`/`user`
    - `access_until`: ISO-дата
5. Front сохраняет токен (httpOnly cookie или memory + silent refresh).

> Для теста можно задать тестовый номер, который автоматически авторизуется (без тарификации). По умолчанию у Auth4App есть дефолтный тестовый номер +7 920 222-22-22. (Auth4App)
> 

### 2) Доступ к защищённым страницам

- Front при навигации бьётся к `GET /api/me`.
- Если 200 — пропускаем.
- Если `403 ACCESS_EXPIRED` — редирект на «Демо закончился».

---

## Защита роутов (backend middleware, псевдокод)

```jsx
// requireAuth.js
module.exports = function requireAuth(role /* optional */) {
  return function (req, res, next) {
    const token = parseBearerOrCookie(req);
    if (!token) return res.status(401).json({ code: 'UNAUTHORIZED' });

    let payload;
    try {
      payload = verifyJWT(token, process.env.JWT_PUBLIC_KEY);
    } catch (e) {
      return res.status(401).json({ code: 'TOKEN_INVALID' });
    }

    // доступ по времени
    const now = Date.now();
    if (payload.access_until && now > Date.parse(payload.access_until)) {
      return res.status(403).json({ code: 'ACCESS_EXPIRED' });
    }

    // роль
    if (role && payload.role !== role) {
      return res.status(403).json({ code: 'FORBIDDEN' });
    }

    req.user = payload;
    next();
  };
};

```

Примеры применения:

```jsx
// только авторизованным
app.get('/api/user/docs', requireAuth(), handler);

// только админам
app.patch('/api/admin/access/:userId', requireAuth('admin'), patchAccessHandler);

```

---

## Интеграция с Auth4App (backend)

**Инициализация авторизации** (отправка кода):

- Вызываем REST Auth4App (см. KB «Инициализация авторизации»), передаём телефон. В ответ — статус/идентификатор запроса. ([Auth4App](https://support.auth4app.com/books/rest-api/page/inicializaciia-avtorizacii))

**Подтверждение кода**:

- Вызываем REST Auth4App confirm-эндпоинт с кодом и идентификатором/телефоном.
- При успехе — считаем пользователя авторизованным; ищем его у нас:
    - если нет — создаём, роль по умолчанию `user`, выставляем `access_until` (например, дата конца демо);
    - если есть — читаем его `role` и `access_until`.
- Генерируем наш JWT и отдаём фронту.

> В KB есть готовые примеры интеграций (Laravel, Django, Node/Express, ASP.NET Core, Go, PHP), можно опереться на них при реализации. (Auth4App)
> 

---

## Хранение токена (frontend)

- Рекомендуемо: httpOnly cookie (минимум XSS-поверхность).
- Альтернатива: Bearer в памяти + silent refresh (если реализуете рефреш-токены).

---

## Настройки/секреты (ENV)

- `AUTH4APP_API_KEY` / `AUTH4APP_PROJECT_ID` (или значения, требуемые их REST API)
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`
- `DEMO_ACCESS_DAYS` (кол-во дней бесплатного периода)
- `BACKEND_BASE_URL`

---

## Тестирование

- Установить тестовый номер в панели Auth4App (либо использовать дефолтный `+7 920 222-22-22`) для автологина без тарификации. ([Auth4App](https://support.auth4app.com/books/rest-api/page/testovyi-nomer-telefona))
- Пройти e2e: логин → доступ к защищённой странице → ручное истечение `access_until` → проверка редиректа на «Демо закончился».

---

## Что важно не забыть

- Везде, где требуется вход (каталог шаблонов с созданием доков, реквизиты, экспорт), проверять JWT и `access_until`.
- Страницу «Управление доступом/тарифом» — **только** под ролью `admin`.
- «Демо закончился» — показывать без лишних деталей, с ясным CTA (Telegram).

Если хочешь, могу подготовить минимальные серверные хэндлеры (`/api/auth/request`, `/api/auth/confirm`) под Node/Express с каркасом вызовов Auth4App — скажи стек.