# 🔴 КРИТИЧНЫЕ ЗАДАЧИ ДЛЯ 100% РАБОТЫ

**Текущий статус:** 95% готовности
**Дата:** 19 октября 2025

---

## ⚠️ ГЛАВНАЯ ПРОБЛЕМА

### 🔴 Фронтенд использует localStorage вместо API

**Почему это критично:**
- ❌ Данные НЕ сохраняются в PostgreSQL
- ❌ Данные теряются при очистке браузера
- ❌ Не работает на разных устройствах
- ❌ Backups бесполезны (данные в localStorage, а не в БД)
- ❌ Демо-лимит не работает реально
- ❌ Admin панель не управляет реальными данными

**Что работает неправильно:**
```typescript
// ❌ СЕЙЧАС (localStorage):
const orgs = mockOrganizations.getAll(userId);
// → Данные в браузере, не в БД

// ✅ ДОЛЖНО БЫТЬ (API):
const { organizations } = useOrganizations();
// → Данные из PostgreSQL через API
```

---

## 📋 КРИТИЧНЫЕ ИСПРАВЛЕНИЯ (2-3 дня)

### 1. Миграция страниц на API (ОБЯЗАТЕЛЬНО!) 🔴

**Страницы, которые ОБЯЗАТЕЛЬНО нужно обновить:**

#### `/org` - Список организаций
```typescript
// ❌ Сейчас:
const organizations = mockOrganizations.getAll(user.id);

// ✅ Должно быть:
const { organizations, isLoading, error } = useOrganizations();
```

#### `/org/create` - Создание организации
```typescript
// ❌ Сейчас:
const org = mockOrganizations.create(formData);
router.push('/org');

// ✅ Должно быть:
const { createOrganization } = useOrganizations();
await createOrganization(formData);
router.push('/org');
```

#### `/org/[id]/edit` - Редактирование
```typescript
// ❌ Сейчас:
mockOrganizations.update(id, formData);

// ✅ Должно быть:
const { updateOrganization } = useOrganizations();
await updateOrganization(id, formData);
```

#### `/docs` - Архив документов
```typescript
// ❌ Сейчас:
const documents = mockDocuments.getAll(user.id);

// ✅ Должно быть:
const { documents, isLoading, error } = useDocuments();
```

#### `/doc/[id]/requisites` - Создание документа
```typescript
// ❌ Сейчас:
const doc = mockDocuments.create({ ... }, userId);

// ✅ Должно быть:
const { createDocument } = useDocuments();
const doc = await createDocument({ ... });
```

#### `/profile` - Личный кабинет
```typescript
// ❌ Сейчас:
const user = mockAuth.getCurrentUser();
mockAuth.updateProfile(formData);

// ✅ Должно быть:
const { user, updateProfile } = useUser();
await updateProfile(formData);
```

**Время:** 2 дня
**Важность:** 🔴🔴🔴 КРИТИЧНО

---

### 2. Убрать все импорты mockData 🔴

**Что удалить:**
```typescript
// ❌ Удалить из всех файлов:
import { mockAuth, mockOrganizations, mockDocuments, mockDemo } from '@/lib/store/mockData';
```

**Где проверить:**
```bash
# Найти все файлы с mockData:
grep -r "mockData" src/app/
grep -r "mockOrganizations" src/app/
grep -r "mockDocuments" src/app/
grep -r "mockAuth" src/app/
```

**Время:** 1 час
**Важность:** 🔴🔴🔴 КРИТИЧНО

---

### 3. Обновить API routes с validation 🟡

**Что нужно:**
- [x] `/api/organizations` - validation добавлен ✅
- [ ] `/api/organizations/[id]` - добавить validation
- [ ] `/api/documents` - добавить validation
- [ ] `/api/documents/[id]` - добавить validation
- [ ] `/api/users/me` - добавить validation

**Пример:**
```typescript
// Добавить в каждый POST/PUT:
import { updateOrganizationSchema } from '@/lib/schemas/organization';

const body = await request.json();
const validated = updateOrganizationSchema.parse(body);
// ... use validated
```

**Время:** 2 часа
**Важность:** 🟡 Важно

---

## 🐛 БАГИ ДЛЯ ИСПРАВЛЕНИЯ

### 1. Auth flow не создаёт пользователя в БД 🟡

**Проблема:**
```typescript
// src/app/auth/login/page.tsx
// После успешной авторизации:
const localUser = mockAuth.login(data.phone); // ❌ localStorage
// Нужно: создать в БД через API
```

**Решение:**
```typescript
// После Auth4App confirm:
const response = await fetch('/api/users/login', {
  method: 'POST',
  body: JSON.stringify({ phone: data.phone })
});
const dbUser = await response.json();
// Сохранить JWT токен (уже есть в cookie)
router.push(dbUser.role === 'admin' ? '/admin/templates' : '/templates');
```

**Время:** 30 минут
**Важность:** 🟡 Важно

---

### 2. Демо-лимит не проверяется при создании документа 🟡

**Проблема:**
```typescript
// src/app/doc/[id]/requisites/page.tsx
// Создание документа БЕЗ проверки лимита
const doc = mockDocuments.create({ ... }, userId);
```

**Решение:**
API route `/api/documents` уже проверяет лимит:
```typescript
// src/app/api/documents/route.ts
if (user.role !== 'admin') {
  const hasLimit = await checkDemoLimit(user.id);
  if (!hasLimit) {
    return NextResponse.json(
      { error: 'Demo limit exceeded' },
      { status: 403 }
    );
  }
}
```

Просто использовать API вместо mockData!

**Время:** Исправится автоматически при миграции на API
**Важность:** 🟡 Важно

---

### 3. Скачивание DOCX/PDF не использует реальные данные 🟡

**Проблема:**
```typescript
// src/app/docs/page.tsx
const doc = documents.find(d => d.docId === docId);
// doc из localStorage, а не из БД
```

**Решение:**
После миграции на API - документы будут из БД

**Время:** Исправится автоматически
**Важность:** 🟡 Важно

---

## 🔧 ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ (не критично)

### 1. Loading states 🟢

**Добавить спиннеры:**
```typescript
const { organizations, isLoading } = useOrganizations();

if (isLoading) {
  return <Spinner />;
}
```

**Где:**
- Список организаций
- Список документов
- Профиль
- Каталог шаблонов

**Время:** 2 часа
**Важность:** 🟢 Желательно

---

### 2. Error boundaries 🟢

**Добавить обработку ошибок:**
```typescript
const { error } = useOrganizations();

if (error) {
  return <ErrorMessage message={error.message} />;
}
```

**Время:** 1 час
**Важность:** 🟢 Желательно

---

### 3. Оптимистичные обновления 🟢

**Мгновенный UI:**
```typescript
const { mutate } = useMutation({
  mutationFn: createOrganization,
  onMutate: async (newOrg) => {
    // Показать сразу в UI
    queryClient.setQueryData(['organizations'], old => [...old, newOrg]);
  }
});
```

**Время:** 3 часа
**Важность:** 🟢 Желательно

---

### 4. Confirm dialogs 🟢

**Подтверждение удаления:**
```typescript
<AlertDialog>
  <AlertDialogTitle>Удалить организацию?</AlertDialogTitle>
  <AlertDialogDescription>
    Это действие нельзя отменить.
  </AlertDialogDescription>
  <AlertDialogAction onClick={handleDelete}>
    Удалить
  </AlertDialogAction>
</AlertDialog>
```

**Время:** 2 часа
**Важность:** 🟢 Желательно

---

## 📊 ПРИОРИТИЗАЦИЯ

### КРИТИЧНО (должно быть для запуска):
1. ✅ **Миграция на API** - 2 дня
2. ✅ **Удалить mockData** - 1 час
3. ✅ **Validation в API routes** - 2 часа

**Total: 2-3 дня**

### ВАЖНО (желательно перед запуском):
4. ✅ **Auth создает в БД** - 30 минут
5. ✅ **Loading states** - 2 часа
6. ✅ **Error handling** - 1 час

**Total: +3.5 часа**

### ЖЕЛАТЕЛЬНО (можно добавить позже):
7. ⚪ Оптимистичные обновления - 3 часа
8. ⚪ Confirm dialogs - 2 часа
9. ⚪ Skeleton loaders - 2 часа

**Total: +7 часов**

---

## ⏱️ TIMELINE ДО 100%

### День 1-2: Миграция на API
- [ ] `/org` на useOrganizations
- [ ] `/org/create` на createOrganization
- [ ] `/org/[id]/edit` на updateOrganization
- [ ] `/docs` на useDocuments
- [ ] `/doc/[id]/requisites` на createDocument
- [ ] `/profile` на useUser

### День 2-3: Чистка и validation
- [ ] Удалить все импорты mockData
- [ ] Добавить validation в остальные API routes
- [ ] Обновить auth flow
- [ ] Добавить loading states
- [ ] Добавить error handling

### День 3: Тестирование
- [ ] Создать организацию
- [ ] Создать документ
- [ ] Проверить демо-лимит
- [ ] Скачать DOCX/PDF
- [ ] Проверить на разных устройствах
- [ ] Проверить backups в БД

---

## ✅ CHECKLIST ДЛЯ 100%

### Критично:
- [ ] Все страницы используют API (не mockData)
- [ ] Данные сохраняются в PostgreSQL
- [ ] Демо-лимит работает реально
- [ ] Auth создаёт пользователя в БД
- [ ] Validation работает на всех API routes

### Важно:
- [ ] Loading states на всех страницах
- [ ] Error handling везде
- [ ] Backups работают (данные в БД)
- [ ] Работает на разных устройствах

### Проверка:
- [ ] Создать организацию → проверить в БД (Prisma Studio)
- [ ] Создать документ → проверить в БД
- [ ] Очистить localStorage → данные остались
- [ ] Открыть на другом устройстве → данные есть
- [ ] Создать 6 документов → демо-лимит сработал

---

## 🎯 ЧТО ДЕЛАТЬ ПРЯМО СЕЙЧАС

### Вариант A: Быстрый старт (1 день)
Обновить только критичные страницы:
1. `/org/create` - создание организаций
2. `/doc/[id]/requisites` - создание документов
3. `/docs` - просмотр архива

**Этого хватит для базовой работы!**

### Вариант B: Полноценный (2-3 дня)
Обновить всё из списка выше.

**Рекомендую:** Вариант B для 100% готовности

---

## 💡 ПОЧЕМУ ЭТО КРИТИЧНО

### Без миграции на API:
- ❌ Пользователь создал документ → очистил кеш браузера → всё потеряно
- ❌ Пользователь зашёл с телефона → нет его организаций
- ❌ Админ изменил шаблон → изменения только у него
- ❌ Backup БД → пустая БД (всё в localStorage)
- ❌ Demo-лимит → можно обойти очисткой localStorage

### С миграцией на API:
- ✅ Данные в PostgreSQL → backups работают
- ✅ Работает на всех устройствах
- ✅ Демо-лимит работает реально
- ✅ Админ управляет реальными данными
- ✅ Production-ready на 100%

---

## 📊 ТЕКУЩИЙ VS ЦЕЛЕВОЙ СТАТУС

| Функция | Сейчас | После миграции |
|---------|--------|----------------|
| **Сохранение данных** | localStorage ❌ | PostgreSQL ✅ |
| **Backups** | Не работают ❌ | Работают ✅ |
| **Мультиустройство** | Не работает ❌ | Работает ✅ |
| **Демо-лимит** | Mock ❌ | Реальный ✅ |
| **Admin панель** | Mock ❌ | Реальная ✅ |
| **Production** | 95% ⚠️ | 100% ✅ |

---

**ИТОГО: 2-3 дня до 100% готовности! 🚀**
