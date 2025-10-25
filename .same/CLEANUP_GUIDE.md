# 🧹 ПОШАГОВАЯ ИНСТРУКЦИЯ: ОЧИСТКА КОДА

**Время:** 2-3 часа
**Сложность:** Средняя
**Результат:** 100% production-ready код

---

## 📋 ПОДГОТОВКА

### Что понадобится:
- [ ] Открыт проект в редакторе
- [ ] Dev server запущен (`bun run dev`)
- [ ] Браузер открыт на http://localhost:3000
- [ ] 2-3 часа свободного времени

### Бэкап (опционально):
```bash
# Создать ветку для очистки
git checkout -b cleanup/remove-mocks

# Или просто commit текущее состояние
git add .
git commit -m "feat: before cleanup - save state"
```

---

## ШАГ 1: УДАЛЕНИЕ CONSOLE.LOG (30 минут)

### 1.1 Очистка admin/templates/page.tsx

**Файл:** `src/app/admin/templates/page.tsx`

**Найти и удалить 4 строки:**
```typescript
// Строка 24:
console.log('Admin page - current user:', user); // Отладка

// Строка 27:
console.log('No user found, redirecting to login'); // Отладка

// Строка 34:
console.log('User role:', user.role, '- Not admin, redirecting to /templates'); // Отладка

// Строка 40:
console.log('Admin access granted'); // Отладка
```

**Результат:** Файл без отладочных логов

---

### 1.2 Очистка lib/store/mockData.ts

**Файл:** `src/lib/store/mockData.ts`

**Найти функцию `login()` (около строки 77) и удалить весь блок логов:**
```typescript
// Удалить весь этот блок (строки 77-117):
console.log('=== LOGIN DEBUG ===');
console.log('Original phone:', phone);
console.log('Normalized phone:', normalizedPhone);
console.log('Digits only:', digitsOnly);
// ... и все остальные console.log
console.log('=== END LOGIN DEBUG ===');
```

**Результат:** Чистая функция login без отладки

---

### 1.3 Проверка

```bash
# Запустить линтер
bun run lint

# Проверить что нет ошибок
# Сохранить изменения
git add .
git commit -m "chore: remove debug console.log statements"
```

**Чеклист:**
- [ ] Удалено 4 console.log из admin/templates/page.tsx
- [ ] Удалено 11 console.log из lib/store/mockData.ts
- [ ] Линтер без ошибок
- [ ] Commit создан

---

## ШАГ 2: TEMPLATES/PAGE.TSX (30 минут)

### 2.1 Заменить mockAuth на useUser

**Файл:** `src/app/templates/page.tsx`

**Найти импорт:**
```typescript
// ❌ УДАЛИТЬ:
import { mockAuth, mockDemo } from "@/lib/store/mockData";
```

**Добавить вместо него:**
```typescript
// ✅ ДОБАВИТЬ:
import { useUser } from "@/hooks/useUser";
```

---

### 2.2 Обновить логику авторизации

**Найти:**
```typescript
// ❌ УДАЛИТЬ:
useEffect(() => {
  const user = mockAuth.getCurrentUser();
  if (!user) {
    router.push("/auth/login");
  }
}, [router]);

const user = mockAuth.getCurrentUser();
if (!user) return null;
```

**Заменить на:**
```typescript
// ✅ ДОБАВИТЬ:
const { user, isLoading } = useUser();

useEffect(() => {
  if (!isLoading && !user) {
    router.push("/auth/login");
  }
}, [user, isLoading, router]);

// Loading state
if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );
}

if (!user) return null;
```

---

### 2.3 Заменить mockDemo на user.demoStatus

**Найти:**
```typescript
// ❌ УДАЛИТЬ:
const demoStatus = mockDemo.getStatus(user.id);
```

**Заменить на:**
```typescript
// ✅ ДОБАВИТЬ:
const demoStatus = user.demoStatus;
```

---

### 2.4 Тестирование

```bash
# Перезагрузить страницу в браузере
# Открыть /templates
# Проверить:
- [ ] Страница загружается с loading spinner
- [ ] Демо-статус отображается корректно
- [ ] Можно выбрать шаблон
- [ ] Redirect на логин если не авторизован (очистить cookies)
```

**Commit:**
```bash
git add src/app/templates/page.tsx
git commit -m "refactor(templates): replace mockAuth with useUser hook"
```

---

## ШАГ 3: ORG/CREATE/PAGE.TSX (15 минут)

### 3.1 Обновить импорты

**Файл:** `src/app/org/create/page.tsx`

```typescript
// ❌ УДАЛИТЬ:
import { mockAuth } from "@/lib/store/mockData";

// ✅ ДОБАВИТЬ:
import { useUser } from "@/hooks/useUser";
```

---

### 3.2 Обновить логику

**Найти:**
```typescript
// ❌ УДАЛИТЬ:
useEffect(() => {
  const user = mockAuth.getCurrentUser();
  if (!user) {
    router.push("/auth/login");
  }
}, [router]);

const user = mockAuth.getCurrentUser();
if (!user) return null;
```

**Заменить на:**
```typescript
// ✅ ДОБАВИТЬ:
const { user, isLoading } = useUser();

useEffect(() => {
  if (!isLoading && !user) {
    router.push("/auth/login");
  }
}, [user, isLoading, router]);

if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}

if (!user) return null;
```

---

### 3.3 Тестирование

```bash
# Открыть /org/create
# Проверить:
- [ ] Форма загружается
- [ ] Можно создать организацию
- [ ] Данные сохраняются в БД (проверить в Prisma Studio)
```

**Commit:**
```bash
git add src/app/org/create/page.tsx
git commit -m "refactor(org/create): replace mockAuth with useUser hook"
```

---

## ШАГ 4: ORG/[ID]/EDIT/PAGE.TSX (15 минут)

### Аналогично шагу 3

**Файл:** `src/app/org/[id]/edit/page.tsx`

**Что сделать:**
1. Заменить импорт `mockAuth` → `useUser`
2. Обновить логику авторизации (скопировать из шага 3)
3. Добавить loading state
4. Тестировать редактирование организации

**Commit:**
```bash
git add src/app/org/[id]/edit/page.tsx
git commit -m "refactor(org/edit): replace mockAuth with useUser hook"
```

---

## ШАГ 5: ORG/[ID]/VIEW/PAGE.TSX (30 минут)

### 5.1 Обновить импорты

**Файл:** `src/app/org/[id]/view/page.tsx`

```typescript
// ❌ УДАЛИТЬ:
import { mockAuth, mockOrganizations } from "@/lib/store/mockData";

// ✅ ДОБАВИТЬ:
import { useUser } from "@/hooks/useUser";
import { useOrganizations } from "@/hooks/useOrganizations";
```

---

### 5.2 Обновить логику авторизации

**Аналогично шагам 3-4** - заменить mockAuth на useUser

---

### 5.3 Заменить mockOrganizations

**Найти:**
```typescript
// ❌ УДАЛИТЬ:
const organization = mockOrganizations.getById(orgId);
```

**Заменить на:**
```typescript
// ✅ ДОБАВИТЬ:
const { getById, isLoading: orgsLoading } = useOrganizations();
const organization = getById(orgId);
```

**Обновить loading state:**
```typescript
if (isLoading || orgsLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}
```

---

### 5.4 Тестирование

```bash
# Открыть /org/[id]/view
# Проверить:
- [ ] Организация отображается
- [ ] Все поля заполнены
- [ ] Данные из PostgreSQL
```

**Commit:**
```bash
git add src/app/org/[id]/view/page.tsx
git commit -m "refactor(org/view): replace mockAuth and mockOrganizations with API hooks"
```

---

## ШАГ 6: DOC/[ID]/BODY/PAGE.TSX (30 минут)

### 6.1 Обновить импорты

**Файл:** `src/app/doc/[id]/body/page.tsx`

```typescript
// ❌ УДАЛИТЬ:
import { mockAuth, mockDocuments } from "@/lib/store/mockData";

// ✅ ДОБАВИТЬ:
import { useUser } from "@/hooks/useUser";
import { useDocuments } from "@/hooks/useDocuments";
```

---

### 6.2 Обновить логику авторизации

**Аналогично предыдущим шагам**

---

### 6.3 Заменить mockDocuments.update()

**Найти:**
```typescript
// ❌ УДАЛИТЬ:
mockDocuments.update(docId, {
  bodyText: text,
  hasBodyChat: true
});
```

**Заменить на:**
```typescript
// ✅ ДОБАВИТЬ:
const { updateDocument } = useDocuments();

// В функции handleSaveText:
await updateDocument(docId, {
  bodyText: text,
  hasBodyChat: true
});
```

---

### 6.4 Добавить loading state при сохранении

```typescript
const [saving, setSaving] = useState(false);

const handleSaveText = async () => {
  setSaving(true);
  try {
    await updateDocument(docId, {
      bodyText: text,
      hasBodyChat: true
    });
    toast.success("Текст сохранён");
  } catch (error) {
    // Ошибка обработана в hook
  } finally {
    setSaving(false);
  }
};
```

**Обновить кнопку:**
```typescript
<Button onClick={handleSaveText} disabled={saving}>
  {saving ? "Сохранение..." : "Продолжить к реквизитам"}
</Button>
```

---

### 6.5 Тестирование

```bash
# Открыть /doc/[id]/body
# Проверить:
- [ ] ИИ-генерация работает
- [ ] Текст сохраняется в БД
- [ ] Loading state при сохранении
- [ ] Toast уведомление
```

**Commit:**
```bash
git add src/app/doc/[id]/body/page.tsx
git commit -m "refactor(doc/body): replace mockAuth and mockDocuments with API hooks"
```

---

## ШАГ 7: ФИНАЛЬНОЕ ТЕСТИРОВАНИЕ (30 минут)

### 7.1 Полный user flow

```bash
# 1. Авторизация
- [ ] Открыть /auth/login
- [ ] Войти (+7 920 222-22-22, код 1234)
- [ ] Redirect на /templates

# 2. Создание организации
- [ ] Открыть /org/create
- [ ] Заполнить форму
- [ ] Сохранить
- [ ] Проверить в Prisma Studio - запись создана

# 3. Создание документа
- [ ] Выбрать шаблон
- [ ] Опционально сгенерировать текст
- [ ] Заполнить реквизиты (подтянуть из организации)
- [ ] Собрать и скачать
- [ ] Проверить в Prisma Studio - документ создан

# 4. Просмотр организации
- [ ] Открыть /org/[id]/view
- [ ] Все поля отображаются

# 5. Редактирование организации
- [ ] Открыть /org/[id]/edit
- [ ] Изменить email
- [ ] Сохранить
- [ ] Проверить в Prisma Studio - изменения сохранены

# 6. Критичный тест: Очистка localStorage
- [ ] Открыть DevTools → Application → Local Storage
- [ ] Очистить весь localStorage
- [ ] Перезагрузить страницу
- [ ] ✅ ДОЛЖНО: Данные остались (из PostgreSQL через JWT)
- [ ] ❌ НЕ ДОЛЖНО: Редирект на логин
```

---

### 7.2 Линтер и TypeScript

```bash
# Запустить линтер
bun run lint

# Проверить типы TypeScript
bunx tsc --noEmit

# Убедиться что нет ошибок
```

---

### 7.3 Финальный commit

```bash
git add .
git commit -m "refactor: complete cleanup - remove all mockAuth/mockData from core pages

- Replaced mockAuth with useUser hook (5 pages)
- Replaced mockOrganizations with useOrganizations hook
- Replaced mockDocuments with useDocuments hook
- Replaced mockDemo with user.demoStatus
- Removed 15 debug console.log statements
- Added loading states everywhere
- Improved data consistency
- Fixed localStorage clear issue

BREAKING CHANGE: Data now fully in PostgreSQL, no localStorage dependency"
```

---

## ШАГ 8: MERGE И ДЕПЛОЙ

### 8.1 Merge в main

```bash
# Переключиться на main
git checkout main

# Смержить очистку
git merge cleanup/remove-mocks

# Пушнуть
git push origin main
```

---

### 8.2 Деплой на Netlify

См. [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

```bash
# Netlify автоматически задеплоит после push
# Или вручную:
netlify deploy --prod
```

---

## ✅ ЧЕКЛИСТ ЗАВЕРШЕНИЯ

### Код:
- [ ] Удалено 15 console.log отладочных
- [ ] Заменён mockAuth в 5 страницах
- [ ] Заменён mockOrganizations
- [ ] Заменён mockDocuments
- [ ] Заменён mockDemo
- [ ] Добавлены loading states везде
- [ ] Линтер без ошибок
- [ ] TypeScript без ошибок

### Тестирование:
- [ ] Авторизация работает
- [ ] Создание организации работает
- [ ] Создание документа работает
- [ ] Редактирование работает
- [ ] После очистки localStorage данные НЕ теряются
- [ ] Демо-лимит работает
- [ ] Все функции протестированы

### Git:
- [ ] Все изменения закоммичены
- [ ] Смержено в main
- [ ] Запушено в remote

### Деплой:
- [ ] Netlify успешно задеплоил
- [ ] Production сайт работает
- [ ] Данные в PostgreSQL
- [ ] Нет ошибок в логах

---

## 🎉 ГОТОВО!

**Результат:** 100% production-ready код ✅

**Что улучшилось:**
- ✅ Нет дублирования данных (localStorage vs PostgreSQL)
- ✅ После очистки кеша данные сохраняются
- ✅ Консистентность на всех устройствах
- ✅ Чистый код без отладочных логов
- ✅ Полная интеграция с API

**Время:** ~2.5 часа

**Следующий шаг:** Celebrate! 🎊

---

*Пошаговая инструкция очистки*
*20 октября 2025*
