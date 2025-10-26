# 🔄 МИГРАЦИЯ ФРОНТЕНДА НА API

**Версия:** v24
**Дата:** 19 октября 2025

---

## ✅ ЧТО УЖЕ ГОТОВО

### 1. API Client
**Файл:** `src/lib/api-client.ts`

Автоматически добавляет headers с телефоном пользователя:
```typescript
import { api } from '@/lib/api-client';

// GET запрос
const orgs = await api.get('/api/organizations');

// POST запрос
const newOrg = await api.post('/api/organizations', data);

// PUT запрос
const updated = await api.put('/api/organizations/123', data);

// DELETE запрос
await api.delete('/api/organizations/123');
```

---

### 2. Custom Hooks

**✅ useOrganizations** (`src/hooks/useOrganizations.ts`)
```typescript
const {
  organizations,      // Список организаций
  isLoading,          // Загрузка
  error,              // Ошибка
  refresh,            // Обновить список
  createOrganization, // Создать
  updateOrganization, // Обновить
  deleteOrganization, // Удалить
  getById,            // Получить по ID
} = useOrganizations();
```

**✅ useDocuments** (`src/hooks/useDocuments.ts`)
```typescript
const {
  documents,      // Список документов
  isLoading,      // Загрузка
  error,          // Ошибка
  refresh,        // Обновить список
  createDocument, // Создать
  updateDocument, // Обновить
  deleteDocument, // Удалить
  getById,        // Получить по ID
} = useDocuments();
```

**✅ useUser** (`src/hooks/useUser.ts`)
```typescript
const {
  user,           // Текущий пользователь
  isLoading,      // Загрузка
  error,          // Ошибка
  refresh,        // Обновить
  updateProfile,  // Обновить профиль
  login,          // Логин (создать в БД)
} = useUser();
```

---

### 3. Логин обновлен

**✅ Файл:** `src/app/auth/login/page.tsx`

Теперь при логине:
1. Создаётся пользователь в localStorage (для совместимости)
2. Синхронизируется с БД через `/api/users/login`
3. Автоматически создаётся DemoStatus

---

## 📋 ЧТО НУЖНО ОБНОВИТЬ

### Следующие страницы нужно мигрировать на hooks:

#### 1. **`/org` — Список организаций**

**Было:**
```typescript
const organizations = mockOrganizations.getAll(user.id);
```

**Нужно:**
```typescript
const { organizations, isLoading, error } = useOrganizations();

if (isLoading) return <div>Загрузка...</div>;
if (error) return <div>Ошибка: {error}</div>;
```

---

#### 2. **`/org/create` — Создание организации**

**Было:**
```typescript
const org = mockOrganizations.create(formData);
toast.success('Организация создана');
router.push('/org');
```

**Нужно:**
```typescript
const { createOrganization } = useOrganizations();

const handleSubmit = async () => {
  setLoading(true);
  try {
    await createOrganization(formData);
    // Toast автоматически показывается в hook
    router.push('/org');
  } catch (err) {
    // Ошибка уже обработана в hook
  } finally {
    setLoading(false);
  }
};
```

---

#### 3. **`/org/[id]/edit` — Редактирование организации**

**Было:**
```typescript
const org = mockOrganizations.getById(id);
mockOrganizations.update(id, formData);
```

**Нужно:**
```typescript
const { organizations, updateOrganization, isLoading } = useOrganizations();
const org = organizations.find(o => o.id === id);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await updateOrganization(id, formData);
    router.push(`/org/${id}/view`);
  } catch (err) {
    // Ошибка обработана в hook
  } finally {
    setLoading(false);
  }
};
```

---

#### 4. **`/docs` — Архив документов**

**Было:**
```typescript
const documents = mockDocuments.getAll(user.id);
```

**Нужно:**
```typescript
const { documents, isLoading, error } = useDocuments();

if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}
```

---

#### 5. **`/doc/[id]/requisites` — Создание документа**

**Было:**
```typescript
const doc = mockDocuments.create({
  userId: user.id,
  templateCode,
  templateVersion,
  bodyText,
  requisites,
});

router.push('/docs');
```

**Нужно:**
```typescript
const { createDocument } = useDocuments();

const handleSubmit = async () => {
  setLoading(true);
  try {
    const doc = await createDocument({
      organizationId: selectedOrgId,
      templateCode,
      templateVersion,
      bodyText,
      requisites,
      hasBodyChat: true,
    });

    // Toast автоматически
    router.push('/docs');
  } catch (err) {
    if (err.message.includes('Demo limit')) {
      router.push('/trial/expired');
    }
  } finally {
    setLoading(false);
  }
};
```

---

#### 6. **`/profile` — Профиль пользователя**

**Было:**
```typescript
const user = mockAuth.getCurrentUser();
mockAuth.updateProfile({ firstName, lastName, ... });
```

**Нужно:**
```typescript
const { user, updateProfile, isLoading } = useUser();

const handleSave = async () => {
  setLoading(true);
  try {
    await updateProfile({
      firstName,
      lastName,
      email,
      position,
      company,
    });
    // Toast автоматически
  } catch (err) {
    // Ошибка обработана
  } finally {
    setLoading(false);
  }
};

// Демо-статус теперь в user.demoStatus
const { documentsUsed, documentsLimit, isActive } = user?.demoStatus || {};
```

---

## 🎨 КОМПОНЕНТЫ ЗАГРУЗКИ

### Спиннер:

```typescript
{isLoading && (
  <div className="flex items-center justify-center p-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
)}
```

### Skeleton (для карточек):

```typescript
{isLoading ? (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </Card>
    ))}
  </div>
) : (
  // Реальный контент
)}
```

---

## 🐛 ОБРАБОТКА ОШИБОК

### Hooks уже обрабатывают ошибки:

```typescript
const { error } = useOrganizations();

if (error) {
  return (
    <Card className="p-12 text-center">
      <p className="text-destructive">Ошибка: {error}</p>
      <Button onClick={() => window.location.reload()}>
        Перезагрузить
      </Button>
    </Card>
  );
}
```

### Для форм:

```typescript
const handleSubmit = async () => {
  try {
    await createOrganization(formData);
    // Успех - toast показывается автоматически
  } catch (err) {
    // Ошибка - toast показывается автоматически
    // Можно добавить дополнительную логику
    setFormErrors(err.message);
  }
};
```

---

## ✅ ЧЕКЛИСТ МИГРАЦИИ

Для каждой страницы:

- [ ] Импортировать нужный hook
- [ ] Заменить `mockData` на hook
- [ ] Добавить `isLoading` state (спиннер)
- [ ] Добавить обработку `error`
- [ ] Обновить `handleSubmit` для async/await
- [ ] Убрать ручные `toast` вызовы (hook делает сам)
- [ ] Протестировать создание/обновление/удаление
- [ ] Проверить в Prisma Studio что данные в БД

---

## 🧪 КАК ТЕСТИРОВАТЬ

### 1. Откройте страницу

### 2. Проверьте loading state
- Должен показаться спиннер
- Потом загрузиться данные из API

### 3. Создайте/обновите данные
- Должен показаться toast
- Данные должны обновиться на странице

### 4. Проверьте в БД
```bash
bunx prisma studio
```
- Откроется http://localhost:5555
- Проверьте что данные сохранились

---

## 🎯 ПРИОРИТЕТЫ

### Критичные (обязательно):
1. ✅ `/auth/login` — уже сделано
2. ⚠️ `/org/create` — создание организаций
3. ⚠️ `/doc/[id]/requisites` — создание документов
4. ⚠️ `/docs` — просмотр архива

### Важные:
5. ⚠️ `/org` — список организаций
6. ⚠️ `/org/[id]/edit` — редактирование
7. ⚠️ `/profile` — профиль

### Опциональные:
8. `/org/[id]/view` — просмотр (read-only)
9. Остальные страницы

---

## 💡 СОВЕТЫ

### 1. **Постепенная миграция**
Не обязательно мигрировать все сразу. Hooks работают параллельно с mockData.

### 2. **Тестируйте после каждой страницы**
После обновления страницы:
- Протестируйте её
- Проверьте в Prisma Studio
- Только потом переходите к следующей

### 3. **Loading states улучшают UX**
Пользователи видят что происходит загрузка, а не "пустой экран".

### 4. **Ошибки обрабатываются автоматически**
Hooks показывают toast с ошибкой. Вам нужно только обработать специфичные случаи (например, redirect при лимите).

---

## 🚀 ПРИМЕР ПОЛНОЙ МИГРАЦИИ

### Было: `/org/create/page.tsx`

```typescript
const handleSubmit = () => {
  const org = mockOrganizations.create(formData);
  toast.success('Организация создана');
  router.push('/org');
};
```

### Стало:

```typescript
'use client';

import { useOrganizations } from '@/hooks/useOrganizations';
import { useState } from 'react';

export default function CreateOrgPage() {
  const { createOrganization } = useOrganizations();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ ... });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createOrganization(formData);
      // Toast показывается автоматически
      router.push('/org');
    } catch (err) {
      // Toast с ошибкой показывается автоматически
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* форма */}
      <Button type="submit" disabled={loading}>
        {loading ? 'Создание...' : 'Создать'}
      </Button>
    </form>
  );
}
```

---

## 📊 ПРОГРЕСС МИГРАЦИИ

| Страница | Статус | Приоритет |
|----------|--------|-----------|
| `/auth/login` | ✅ Done | 🔴 |
| `/org/create` | ⚠️ TODO | 🔴 |
| `/doc/[id]/requisites` | ⚠️ TODO | 🔴 |
| `/docs` | ⚠️ TODO | 🔴 |
| `/org` | ⚠️ TODO | 🟡 |
| `/org/[id]/edit` | ⚠️ TODO | 🟡 |
| `/profile` | ⚠️ TODO | 🟡 |
| `/org/[id]/view` | ⚠️ TODO | 🟢 |

---

## 🎉 ГОТОВО!

После миграции всех страниц:
- ✅ Фронтенд полностью работает с API
- ✅ Данные сохраняются в PostgreSQL
- ✅ Приложение production-ready на 100%

---

**Удачи в миграции! 🚀**

*Версия 24 - Frontend API Integration*
*19 октября 2025*
