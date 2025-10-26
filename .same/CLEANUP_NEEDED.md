# ⚠️ ПОЛНЫЙ АУДИТ МОКОВ И ОТЛАДОЧНОГО КОДА

**Дата:** 20 октября 2025
**Статус:** Детальный анализ завершён

---

## 📊 СВОДКА

| Категория | Количество | Критичность |
|-----------|------------|-------------|
| **mockAuth импорты** | 15 файлов | 🟡 Средняя |
| **mockOrganizations** | 1 файл | 🟡 Средняя |
| **mockDocuments** | 1 файл | 🟡 Средняя |
| **mockDemo** | 1 файл | 🟡 Средняя |
| **mockTemplateRequisites** | 2 файла | ✅ OK |
| **mockAccess** | 2 файла | ✅ OK |
| **console.log (отладка)** | 18 мест | 🟡 Желательно убрать |
| **console.warn (mock режим)** | 4 места | ✅ OK |
| **console.error (ошибки)** | 32 места | ✅ OK |
| **TODO комментарии** | 3 места | ✅ OK |

---

## 🔍 ДЕТАЛЬНЫЙ АНАЛИЗ

### 1. mockAuth - 15 ФАЙЛОВ 🟡

**Критичность:** Средняя (не критично, но желательно убрать)

**Проблема:** Дублирование данных в localStorage и PostgreSQL

#### Найдено в:

1. **`src/app/auth/login/page.tsx`**
   ```typescript
   import { mockAuth } from "@/lib/store/mockData";
   const localUser = mockAuth.login(data.phone, code);
   ```

2. **`src/app/templates/page.tsx`**
   ```typescript
   import { mockAuth, mockDemo } from "@/lib/store/mockData";
   const user = mockAuth.getCurrentUser();
   ```

3. **`src/app/org/page.tsx`** ⚠️ УЖЕ ЧАСТИЧНО ОБНОВЛЁН
   ```typescript
   import { mockAuth } from "@/lib/store/mockData";
   const user = mockAuth.getCurrentUser();
   ```

4. **`src/app/org/create/page.tsx`**
   ```typescript
   import { mockAuth } from "@/lib/store/mockData";
   const user = mockAuth.getCurrentUser();
   ```

5. **`src/app/org/[id]/view/page.tsx`**
   ```typescript
   import { mockAuth, mockOrganizations } from "@/lib/store/mockData";
   const user = mockAuth.getCurrentUser();
   ```

6. **`src/app/org/[id]/edit/page.tsx`**
   ```typescript
   import { mockAuth } from "@/lib/store/mockData";
   const user = mockAuth.getCurrentUser();
   ```

7. **`src/app/doc/[id]/body/page.tsx`**
   ```typescript
   import { mockAuth, mockDocuments } from "@/lib/store/mockData";
   const user = mockAuth.getCurrentUser();
   ```

8. **`src/app/admin/templates/page.tsx`**
   ```typescript
   import { mockAuth } from "@/lib/store/mockData";
   const user = mockAuth.getCurrentUser();
   mockAuth.logout(); // ⚠️ Также есть logout
   ```

9. **`src/app/admin/templates/create/page.tsx`**
   ```typescript
   import { mockAuth } from "@/lib/store/mockData";
   const user = mockAuth.getCurrentUser();
   ```

10. **`src/app/admin/templates/[code]/page.tsx`**
    ```typescript
    import { mockAuth } from "@/lib/store/mockData";
    const user = mockAuth.getCurrentUser();
    ```

11. **`src/app/admin/templates/[code]/edit/page.tsx`**
    ```typescript
    import { mockAuth } from "@/lib/store/mockData";
    const user = mockAuth.getCurrentUser();
    ```

12. **`src/app/admin/templates/[code]/requisites/page.tsx`**
    ```typescript
    import { mockAuth, mockTemplateRequisites } from "@/lib/store/mockData";
    const user = mockAuth.getCurrentUser();
    ```

13. **`src/app/admin/access/page.tsx`**
    ```typescript
    import { mockAuth, mockAccess } from "@/lib/store/mockData";
    const user = mockAuth.getCurrentUser();
    mockAuth.logout(); // ⚠️ Также есть logout
    ```

14. **`src/app/admin/access/[userId]/page.tsx`**
    ```typescript
    import { mockAuth, mockAccess } from "@/lib/store/mockData";
    const user = mockAuth.getCurrentUser();
    ```

**Что заменить:**
```typescript
// ❌ СЕЙЧАС:
import { mockAuth } from "@/lib/store/mockData";
const user = mockAuth.getCurrentUser();
if (!user) router.push("/auth/login");

// ✅ ДОЛЖНО БЫТЬ:
import { useUser } from "@/hooks/useUser";
const { user, isLoading } = useUser();
useEffect(() => {
  if (!isLoading && !user) router.push("/auth/login");
}, [user, isLoading, router]);
```

---

### 2. mockOrganizations - 1 ФАЙЛ 🟡

**Файл:** `src/app/org/[id]/view/page.tsx`

```typescript
import { mockOrganizations } from "@/lib/store/mockData";
const organization = mockOrganizations.getById(orgId);
```

**Что заменить:**
```typescript
// ❌ СЕЙЧАС:
const organization = mockOrganizations.getById(orgId);

// ✅ ДОЛЖНО БЫТЬ:
const { getById } = useOrganizations();
const organization = getById(orgId);
```

---

### 3. mockDocuments - 1 ФАЙЛ 🟡

**Файл:** `src/app/doc/[id]/body/page.tsx`

```typescript
import { mockDocuments } from "@/lib/store/mockData";
mockDocuments.update(docId, { bodyText: text, hasBodyChat: true });
```

**Что заменить:**
```typescript
// ❌ СЕЙЧАС:
mockDocuments.update(docId, { bodyText: text });

// ✅ ДОЛЖНО БЫТЬ:
const { updateDocument } = useDocuments();
await updateDocument(docId, { bodyText: text });
```

---

### 4. mockDemo - 1 ФАЙЛ 🟡

**Файл:** `src/app/templates/page.tsx`

```typescript
import { mockDemo } from "@/lib/store/mockData";
const demoStatus = mockDemo.getStatus(user.id);
```

**Что заменить:**
```typescript
// ❌ СЕЙЧАС:
const demoStatus = mockDemo.getStatus(user.id);

// ✅ ДОЛЖНО БЫТЬ:
const { user } = useUser();
const demoStatus = user?.demoStatus;
```

---

### 5. mockTemplateRequisites - 2 ФАЙЛА ✅ OK

**Файлы:**
- `src/app/doc/[id]/requisites/page.tsx`
- `src/app/admin/templates/[code]/requisites/page.tsx`

**Статус:** ✅ **ОСТАВИТЬ КАК ЕСТЬ**

**Почему:**
- Настройки админа для реквизитов
- Специально хранятся в localStorage
- Нет API для этого функционала
- Работает корректно

---

### 6. mockAccess - 2 ФАЙЛА ✅ OK

**Файлы:**
- `src/app/admin/access/page.tsx`
- `src/app/admin/access/[userId]/page.tsx`

**Статус:** ✅ **ОСТАВИТЬ КАК ЕСТЬ**

**Почему:**
- Функционал доступов пользователей
- Не реализован в БД
- Только localStorage
- В ТЗ не критично

---

## 🐛 ОТЛАДОЧНЫЙ КОД

### 1. console.log - 18 МЕСТ 🟡

**Критичность:** Желательно убрать перед production

#### Админская страница (4 шт):

**`src/app/admin/templates/page.tsx:24-40`**
```typescript
console.log('Admin page - current user:', user); // Отладка
console.log('No user found, redirecting to login'); // Отладка
console.log('User role:', user.role, '- Not admin, redirecting to /templates'); // Отладка
console.log('Admin access granted'); // Отладка
```

**Решение:** ❌ **УДАЛИТЬ**

---

#### mockData логи (11 шт):

**`src/lib/store/mockData.ts:77-117`**
```typescript
console.log('=== LOGIN DEBUG ===');
console.log('Original phone:', phone);
console.log('Normalized phone:', normalizedPhone);
console.log('Digits only:', digitsOnly);
console.log('Last 10 digits:', last10Digits);
console.log('Is admin check:', isAdmin);
console.log('Created user with role:', user.role);
console.log('Found existing user with role:', user.role);
console.log('Final user saved:', user);
console.log('=== END LOGIN DEBUG ===');
```

**Решение:** ❌ **УДАЛИТЬ** (отладочные логи авторизации)

---

#### Сервисы (3 шт):

**`src/lib/services/auth4app.ts:50,96`**
```typescript
console.log('Auth4App: Инициализация авторизации для', phone);
console.log('Auth4App: Подтверждение кода', authId, code);
```

**`src/lib/services/openai.ts:89-90`**
```typescript
console.log('OpenAI: Генерация текста для', templateName);
console.log('Prompt:', userPrompt);
```

**Решение:** 🟡 **МОЖНО ОСТАВИТЬ** (полезно для отладки интеграций)

---

### 2. console.warn - 4 МЕСТА ✅ OK

**Критичность:** OK, информативны

#### Mock режимы:

**`src/app/api/auth/init/route.ts:23`**
```typescript
console.warn('Auth4App не настроен, используется mock-режим');
```

**`src/app/api/auth/confirm/route.ts:24`**
```typescript
console.warn('Auth4App не настроен, используется mock-режим');
```

**`src/app/api/ai/chat/route.ts:28`**
```typescript
console.warn('OpenAI не настроен, используется mock-режим');
```

**`src/lib/rate-limit.ts:81,93`**
```typescript
console.warn('[Rate Limit] Upstash не настроен, пропускаем проверку');
```

**Решение:** ✅ **ОСТАВИТЬ** (полезны для понимания режима работы)

---

### 3. console.error - 32 МЕСТА ✅ OK

**Критичность:** OK, нужны для отладки

#### Основные категории:

1. **Frontend ошибки (6 шт):**
   - Download errors
   - AI chat errors
   - File processing errors
   - Database sync errors

2. **API Routes (25 шт):**
   - Auth errors (init, confirm, logout)
   - Documents CRUD errors
   - Organizations CRUD errors
   - Users errors
   - Template configs errors
   - Files parsing errors
   - DOCX/PDF generation errors

3. **Сервисы (5 шт):**
   - Auth4App errors
   - OpenAI errors
   - JWT errors
   - Rate limit errors

**Решение:** ✅ **ОСТАВИТЬ ВСЕ**

**Почему:**
- Критичны для отладки production
- Sentry автоматически перехватывает
- Помогают в логах Netlify
- Best practice для error handling

---

## 📝 TODO КОММЕНТАРИИ - 3 МЕСТА ✅ OK

**Критичность:** OK, не критично

### 1. Auth4App TODO (2 шт):

**`src/lib/services/auth4app.ts:34,80`**
```typescript
// TODO: Заменить на реальный API endpoint Auth4App
```

**Статус:** ✅ OK - напоминание для будущей интеграции

---

### 2. OpenAI TODO (1 шт):

**`src/lib/services/openai.ts:66`**
```typescript
// TODO: Раскомментировать когда будет API ключ
```

**Статус:** ✅ OK - напоминание для интеграции

---

### 3. Фейковый номер (1 шт):

**`src/lib/services/auth4app.ts:100`**
```typescript
phone: '+79999999999', // TODO: вернуть реальный номер
```

**Статус:** ✅ OK - mock-режим работает корректно

---

## 📊 ПРИОРИТЕТЫ ОЧИСТКИ

### 🔴 КРИТИЧНО:
- ❌ НЕТ критичных проблем

### 🟡 ЖЕЛАТЕЛЬНО (улучшает качество):

**1. Убрать отладочные console.log (15 шт):**
- ❌ `src/app/admin/templates/page.tsx` - 4 логов
- ❌ `src/lib/store/mockData.ts` - 11 логов

**2. Заменить mockAuth на useUser (5 основных страниц):**
- `src/app/templates/page.tsx`
- `src/app/org/create/page.tsx`
- `src/app/org/[id]/edit/page.tsx`
- `src/app/org/[id]/view/page.tsx` (+ mockOrganizations)
- `src/app/doc/[id]/body/page.tsx` (+ mockDocuments)

**3. Заменить mockDemo на user.demoStatus:**
- `src/app/templates/page.tsx`

### ✅ ОСТАВИТЬ КАК ЕСТЬ:

**1. console.warn (4 шт)** - информируют о mock-режиме

**2. console.error (32 шт)** - критичны для отладки

**3. console.log в сервисах (3 шт)** - полезны для отладки интеграций

**4. mockTemplateRequisites (2 файла)** - localStorage специально

**5. mockAccess (2 файла)** - функционал только в localStorage

**6. TODO комментарии (3 шт)** - напоминания для будущего

**7. Админские страницы с mockAuth (8 файлов)** - низкий приоритет

---

## 🎯 РЕКОМЕНДУЕМЫЙ ПЛАН ДЕЙСТВИЙ

### Вариант A: Минимальная очистка (30 минут) 🟢

**Что сделать:**
1. Удалить 4 console.log из `admin/templates/page.tsx`
2. Удалить 11 console.log из `lib/store/mockData.ts`
3. Оставить всё остальное

**Риск:** Низкий
**Время:** 30 минут
**Результат:** Чистый код, без лишних логов

---

### Вариант B: Средняя очистка (2-3 часа) 🟡

**Что сделать:**
1. Вариант A (очистка логов)
2. Заменить mockAuth → useUser в 5 основных страницах
3. Заменить mockDemo → user.demoStatus
4. Заменить mockOrganizations → useOrganizations
5. Заменить mockDocuments → useDocuments

**Риск:** Средний
**Время:** 2-3 часа
**Результат:** Полная консистентность данных

---

### Вариант C: Полная очистка (5-6 часов) 🔴

**Что сделать:**
1. Вариант B (всё выше)
2. Заменить mockAuth во всех админских страницах (8 файлов)
3. Удалить все console.log (включая сервисы)

**Риск:** Высокий
**Время:** 5-6 часов
**Результат:** Идеальный production-код

---

## 💡 ФИНАЛЬНАЯ РЕКОМЕНДАЦИЯ

### ✅ Вариант B: Средняя очистка (РЕКОМЕНДУЮ)

**Почему:**
1. **Решает реальную проблему** - очистка localStorage → редирект на логин
2. **Улучшает консистентность** - все данные через API
3. **Разумное время** - 2-3 часа работы
4. **Средний риск** - можно протестировать
5. **Оставляет console.error** - они нужны

**Что останется после Варианта B:**
- ✅ console.error (32) - нужны для отладки
- ✅ console.warn (4) - информативны
- ✅ console.log в сервисах (3) - полезны
- ✅ mockAuth в админке (8 файлов) - низкий приоритет
- ✅ mockTemplateRequisites (2) - localStorage специально
- ✅ mockAccess (2) - функционал только там
- ✅ TODO комментарии (3) - напоминания

---

## 📋 ЧЕКЛИСТ ВЫПОЛНЕНИЯ (Вариант B)

### 1. Удалить console.log (30 мин):
- [ ] `src/app/admin/templates/page.tsx` - 4 логов
- [ ] `src/lib/store/mockData.ts` - 11 логов

### 2. Обновить templates/page.tsx (30 мин):
- [ ] Заменить mockAuth → useUser
- [ ] Заменить mockDemo → user.demoStatus

### 3. Обновить org/create/page.tsx (15 мин):
- [ ] Заменить mockAuth → useUser

### 4. Обновить org/[id]/edit/page.tsx (15 мин):
- [ ] Заменить mockAuth → useUser

### 5. Обновить org/[id]/view/page.tsx (30 мин):
- [ ] Заменить mockAuth → useUser
- [ ] Заменить mockOrganizations → useOrganizations

### 6. Обновить doc/[id]/body/page.tsx (30 мин):
- [ ] Заменить mockAuth → useUser
- [ ] Заменить mockDocuments → useDocuments

### 7. Тестирование (30 мин):
- [ ] Проверить авторизацию
- [ ] Проверить создание организации
- [ ] Проверить создание документа
- [ ] Проверить очистку кеша
- [ ] Запустить линтер

**ИТОГО: ~3 часа**

---

## 🚀 ПОСЛЕ ОЧИСТКИ

### Что будет улучшено:
- ✅ Нет дублирования данных (localStorage vs PostgreSQL)
- ✅ После очистки кеша данные не теряются
- ✅ Консистентность данных на всех устройствах
- ✅ Чистый код без отладочных логов
- ✅ Полная интеграция с API

### Что останется:
- ✅ console.error для отладки production
- ✅ console.warn для информирования
- ✅ Админские страницы с mockAuth (не критично)
- ✅ mockTemplateRequisites (localStorage специально)

---

**Рекомендация:** Вариант B - средняя очистка за 2-3 часа

**Готовы начать?**

---

*Полный аудит v2*
*20 октября 2025*
