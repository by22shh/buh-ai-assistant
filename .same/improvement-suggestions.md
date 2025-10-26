# 💡 ПРЕДЛОЖЕНИЯ ПО УЛУЧШЕНИЮ ПРОЕКТА

**Дата:** 19 октября 2025
**Текущая версия:** v20
**Статус:** Production-ready (99% соответствие ТЗ)

---

## 🎯 ТОП-10 УЛУЧШЕНИЙ

### 1. 📎 Парсинг загруженных файлов (.docx, .pdf)

**Текущая проблема:**
- Сейчас поддерживаются только .txt и .md
- Пользователь видит: "В демо-версии поддерживаются только текстовые файлы"

**Решение:**
Создать API route для парсинга файлов на сервере:

```typescript
// src/app/api/files/parse/route.ts
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return Response.json({ text: result.value });
  }

  if (file.name.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return Response.json({ text: data.text });
  }

  return Response.json({ error: 'Unsupported format' }, { status: 400 });
}
```

**Обновить клиент:**
```typescript
// В handleFileUpload
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/files/parse', {
  method: 'POST',
  body: formData
});

const { text } = await response.json();
```

**Преимущества:**
- ✅ Полная поддержка всех форматов из ТЗ
- ✅ Парсинг на сервере (безопасно)
- ✅ Работает для любых размеров файлов

**Сложность:** 🟡 Средняя (1-2 часа)
**Приоритет:** 🔴 Высокий

---

### 2. 👁️ Предпросмотр документа перед скачиванием

**Текущая проблема:**
- Пользователь не видит документ до скачивания
- Нужно скачивать, открывать, проверять, исправлять

**Решение:**
Добавить модальное окно с preview:

```typescript
// Компонент DocumentPreview
import { Dialog } from '@/components/ui/dialog';

function DocumentPreview({ bodyText, requisites }) {
  return (
    <Dialog>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Предпросмотр документа</DialogTitle>
        </DialogHeader>

        <div className="prose max-w-none">
          {/* Рендер документа с форматированием */}
          <div className="whitespace-pre-wrap">
            {bodyText}
          </div>

          {/* Реквизиты */}
          <div className="mt-8 border-t pt-4">
            <h3>Реквизиты</h3>
            {/* ... */}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleDownloadDOCX}>Скачать DOCX</Button>
          <Button onClick={handleDownloadPDF}>Скачать PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Где добавить:**
- Кнопка "Предпросмотр" в архиве документов
- Автоматически после завершения чата с ИИ

**Преимущества:**
- ✅ Пользователь видит результат сразу
- ✅ Меньше скачиваний "впустую"
- ✅ Можно вернуться и отредактировать

**Сложность:** 🟢 Низкая (1 час)
**Приоритет:** 🟡 Средний

---

### 3. ✏️ Редактирование сгенерированного текста в чате

**Текущая проблема:**
- ИИ сгенерировал текст → нельзя отредактировать
- Нужно начинать новый диалог: "Измени пункт 2"

**Решение:**
Добавить кнопку "Редактировать" к сообщению ИИ:

```typescript
// В компоненте сообщения ИИ
{message.role === 'assistant' && (
  <div className="flex gap-2 mt-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => setEditingMessageId(message.id)}
    >
      <Edit className="w-3 h-3 mr-1" />
      Редактировать
    </Button>

    <Button
      size="sm"
      variant="outline"
      onClick={() => handleRegenerateFrom(message.id)}
    >
      <RefreshCw className="w-3 h-3 mr-1" />
      Регенерировать
    </Button>
  </div>
)}

{editingMessageId === message.id && (
  <Textarea
    value={editedText}
    onChange={(e) => setEditedText(e.target.value)}
    className="mt-2"
  />
)}
```

**Функции:**
- Редактирование текста вручную
- Регенерация с тем же промптом
- Откат к предыдущей версии

**Преимущества:**
- ✅ Гибкость для пользователя
- ✅ Меньше запросов к OpenAI
- ✅ Быстрее финальный результат

**Сложность:** 🟡 Средняя (2 часа)
**Приоритет:** 🟡 Средний

---

### 4. 📱 Адаптивность для мобильных устройств

**Текущая проблема:**
- Базовая адаптивность через Tailwind
- Не тестировалось на реальных устройствах
- Таблицы могут сломаться на маленьких экранах

**Что проверить:**
```bash
# Тестовые разрешения
- 320px (iPhone SE)
- 375px (iPhone 12/13)
- 768px (iPad)
- 1024px (iPad Pro)
```

**Что доработать:**

1. **Таблица в архиве** → карточки на мобильных
2. **Форма реквизитов** → 1 колонка вместо 2
3. **Навигация** → бургер-меню
4. **Чат с ИИ** → адаптация под клавиатуру

```typescript
// Пример: адаптивная таблица
<div className="block md:hidden">
  {/* Карточки для мобильных */}
  {documents.map(doc => (
    <Card key={doc.id} className="mb-4">
      <CardContent>
        <h3>{doc.title}</h3>
        <p className="text-sm text-muted-foreground">
          {template.nameRu}
        </p>
        {/* ... */}
      </CardContent>
    </Card>
  ))}
</div>

<div className="hidden md:block">
  {/* Таблица для десктопа */}
  <Table>...</Table>
</div>
```

**Преимущества:**
- ✅ Работает на всех устройствах
- ✅ Лучший UX для мобильных пользователей
- ✅ Больше конверсия в демо

**Сложность:** 🟡 Средняя (3-4 часа)
**Приоритет:** 🔴 Высокий

---

### 5. 🔍 Поиск и фильтры в архиве документов

**Текущая проблема:**
- В архиве нет поиска
- Нельзя фильтровать по шаблону/организации
- Сложно найти нужный документ

**Решение:**
Добавить строку поиска и фильтры:

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [filterTemplate, setFilterTemplate] = useState<string | null>(null);
const [filterOrg, setFilterOrg] = useState<string | null>(null);
const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

const filteredDocuments = documents
  .filter(doc => {
    // Поиск
    if (searchQuery && !doc.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Фильтр по шаблону
    if (filterTemplate && doc.templateCode !== filterTemplate) {
      return false;
    }

    // Фильтр по организации
    if (filterOrg && doc.organizationId !== filterOrg) {
      return false;
    }

    return true;
  })
  .sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return (a.title || '').localeCompare(b.title || '');
  });
```

**UI:**
```typescript
<div className="flex gap-4 mb-4">
  <Input
    placeholder="Поиск по названию..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />

  <Select value={filterTemplate} onValueChange={setFilterTemplate}>
    <SelectTrigger>
      <SelectValue placeholder="Все шаблоны" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={null}>Все шаблоны</SelectItem>
      {templates.map(t => (
        <SelectItem key={t.code} value={t.code}>
          {t.nameRu}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Select value={sortBy} onValueChange={setSortBy}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="date">По дате</SelectItem>
      <SelectItem value="name">По названию</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Преимущества:**
- ✅ Быстрый поиск нужного документа
- ✅ Удобная фильтрация
- ✅ Сортировка

**Сложность:** 🟢 Низкая (1-2 часа)
**Приоритет:** 🟡 Средний

---

### 6. 📜 История изменений документа (версионирование)

**Концепция:**
Сохранять каждую версию текста при регенерации:

```typescript
interface DocumentVersion {
  versionId: string;
  bodyText: string;
  createdAt: Date;
  createdBy: string; // 'user' | 'ai'
  prompt?: string; // если AI генерировал
}

// В mockData
const documentVersions: Record<string, DocumentVersion[]> = {};

function saveVersion(docId: string, bodyText: string, source: 'user' | 'ai', prompt?: string) {
  if (!documentVersions[docId]) {
    documentVersions[docId] = [];
  }

  documentVersions[docId].push({
    versionId: `v${documentVersions[docId].length + 1}`,
    bodyText,
    createdAt: new Date(),
    createdBy: source,
    prompt
  });
}
```

**UI для просмотра истории:**
```typescript
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>История изменений</DialogTitle>
    </DialogHeader>

    <div className="space-y-2">
      {versions.map((version, i) => (
        <Card key={version.versionId} className="p-3">
          <div className="flex justify-between items-center">
            <div>
              <Badge>{version.versionId}</Badge>
              <span className="ml-2 text-sm">
                {version.createdAt.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => previewVersion(version)}>
                Просмотр
              </Button>
              <Button size="sm" onClick={() => restoreVersion(version)}>
                Восстановить
              </Button>
            </div>
          </div>

          {version.prompt && (
            <p className="text-xs text-muted-foreground mt-2">
              Промпт: {version.prompt}
            </p>
          )}
        </Card>
      ))}
    </div>
  </DialogContent>
</Dialog>
```

**Преимущества:**
- ✅ Можно откатиться к предыдущей версии
- ✅ История всех изменений
- ✅ Сравнение версий

**Сложность:** 🟡 Средняя (2-3 часа)
**Приоритет:** 🟢 Низкий

---

### 7. 🌓 Темная тема

**Решение:**
Библиотека `next-themes` уже установлена!

```typescript
// app/layout.tsx
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Кнопка переключения:**
```typescript
// components/ThemeToggle.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Переключить тему</span>
    </Button>
  );
}
```

**Настройка цветов в tailwind.config.ts:**
```typescript
module.exports = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... остальные цвета
      }
    }
  }
}
```

**CSS переменные:**
```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```

**Преимущества:**
- ✅ Снижает нагрузку на глаза
- ✅ Современный UX
- ✅ Экономия батареи на OLED

**Сложность:** 🟢 Низкая (1 час)
**Приоритет:** 🟡 Средний

---

### 8. 📊 Экспорт/импорт организаций

**Зачем:**
- Пользователь хочет перенести данные из Excel
- Бухгалтер имеет список из 50 организаций

**Экспорт в CSV:**
```typescript
function exportOrganizationsToCSV(organizations: Organization[]) {
  const headers = ['Название', 'ИНН', 'КПП', 'ОГРН', 'Адрес', 'Телефон', 'Email'];

  const rows = organizations.map(org => [
    org.name_full,
    org.inn,
    org.kpp || '',
    org.ogrn || '',
    org.legal_address || '',
    org.phone || '',
    org.email || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `organizations_${Date.now()}.csv`;
  link.click();
}
```

**Импорт из CSV:**
```typescript
function importOrganizationsFromCSV(file: File) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const text = e.target?.result as string;
    const lines = text.split('\n');
    const headers = lines[0].split(',');

    const organizations = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, ''));

      return {
        name_full: values[0],
        inn: values[1],
        kpp: values[2],
        ogrn: values[3],
        legal_address: values[4],
        phone: values[5],
        email: values[6]
      };
    });

    // Валидация и сохранение
    organizations.forEach(org => {
      if (validateINN(org.inn)) {
        mockOrganizations.create(org);
      }
    });
  };

  reader.readAsText(file);
}
```

**UI:**
```typescript
<div className="flex gap-2">
  <Button onClick={handleExport}>
    <Download className="w-4 h-4 mr-2" />
    Экспортировать в CSV
  </Button>

  <Button onClick={() => fileInputRef.current?.click()}>
    <Upload className="w-4 h-4 mr-2" />
    Импортировать из CSV
  </Button>

  <input
    ref={fileInputRef}
    type="file"
    accept=".csv"
    className="hidden"
    onChange={handleImport}
  />
</div>
```

**Преимущества:**
- ✅ Массовая загрузка организаций
- ✅ Резервное копирование данных
- ✅ Обмен данными между пользователями

**Сложность:** 🟢 Низкая (2 часа)
**Приоритет:** 🟢 Низкий

---

### 9. 🔄 Интеграция реальной Auth4App авторизации

**Текущее состояние:**
- API routes готовы
- Но страница `/auth/login` использует mock

**Что нужно:**
Обновить страницу логина для работы с реальным API:

```typescript
// src/app/auth/login/page.tsx
const [step, setStep] = useState<'phone' | 'code'>('phone');
const [authId, setAuthId] = useState('');

const handleSendCode = async () => {
  setLoading(true);

  const response = await fetch('/api/auth/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });

  const data = await response.json();

  if (data.success) {
    setAuthId(data.auth_id);
    setStep('code');

    if (data.isMock) {
      toast.info('Демо-режим: введите любой код');
    } else {
      toast.success('Код отправлен на ваш номер');
    }
  } else {
    toast.error(data.error);
  }

  setLoading(false);
};

const handleConfirmCode = async () => {
  setLoading(true);

  const response = await fetch('/api/auth/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_id: authId, code })
  });

  const data = await response.json();

  if (data.success) {
    // Создаём пользователя в localStorage
    const user = mockAuth.login(data.phone);

    toast.success('Добро пожаловать!');
    router.push('/templates');
  } else {
    toast.error(data.error || 'Неверный код');
  }

  setLoading(false);
};
```

**UI с двумя шагами:**
```typescript
{step === 'phone' && (
  <>
    <Input
      placeholder="+7 900 000-00-00"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
    />
    <Button onClick={handleSendCode} disabled={loading}>
      {loading ? 'Отправка...' : 'Получить код'}
    </Button>
  </>
)}

{step === 'code' && (
  <>
    <p className="text-sm text-muted-foreground">
      Код отправлен на {phone}
    </p>
    <Input
      placeholder="Введите код"
      value={code}
      onChange={(e) => setCode(e.target.value)}
      maxLength={4}
    />
    <Button onClick={handleConfirmCode} disabled={loading}>
      {loading ? 'Проверка...' : 'Войти'}
    </Button>
    <Button variant="ghost" onClick={() => setStep('phone')}>
      Изменить номер
    </Button>
  </>
)}
```

**Преимущества:**
- ✅ Готов к production с реальным Auth4App
- ✅ Fallback в mock работает
- ✅ Индикаторы для пользователя

**Сложность:** 🟢 Низкая (1 час)
**Приоритет:** 🔴 Высокий (если планируется production)

---

### 10. ⚡ Улучшенная валидация форм с react-hook-form

**Текущая проблема:**
- Валидация вручную через useState
- Много повторяющегося кода
- Нет красивых сообщений об ошибках

**Решение:**
Использовать `react-hook-form` + `zod`:

```bash
bun add react-hook-form @hookform/resolvers zod
```

**Пример для формы организации:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const organizationSchema = z.object({
  name_full: z.string()
    .min(1, 'Обязательное поле')
    .min(5, 'Минимум 5 символов'),

  inn: z.string()
    .regex(/^\d{10}$|^\d{12}$/, 'ИНН должен быть 10 или 12 цифр')
    .refine((val) => validateINN(val), 'Неверная контрольная сумма'),

  kpp: z.string()
    .regex(/^\d{9}$/, 'КПП должен быть 9 цифр')
    .optional()
    .or(z.literal('')),

  ogrn: z.string()
    .regex(/^\d{13}$|^\d{15}$/, 'ОГРН должен быть 13 или 15 цифр')
    .refine((val) => validateOGRN(val), 'Неверная контрольная сумма')
    .optional()
    .or(z.literal('')),

  email: z.string()
    .email('Неверный формат email')
    .optional()
    .or(z.literal('')),
});

type OrganizationForm = z.infer<typeof organizationSchema>;

export default function CreateOrganizationPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema)
  });

  const onSubmit = async (data: OrganizationForm) => {
    const org = mockOrganizations.create(data);
    toast.success('Организация создана');
    router.push('/org');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label>Полное наименование *</Label>
        <Input {...register('name_full')} />
        {errors.name_full && (
          <p className="text-sm text-red-500 mt-1">
            {errors.name_full.message}
          </p>
        )}
      </div>

      <div>
        <Label>ИНН *</Label>
        <Input {...register('inn')} />
        {errors.inn && (
          <p className="text-sm text-red-500 mt-1">
            {errors.inn.message}
          </p>
        )}
      </div>

      {/* ... остальные поля */}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Создание...' : 'Создать'}
      </Button>
    </form>
  );
}
```

**Преимущества:**
- ✅ Декларативная валидация
- ✅ Меньше кода
- ✅ Типобезопасность
- ✅ Красивые сообщения об ошибках
- ✅ Валидация в реальном времени

**Сложность:** 🟡 Средняя (3-4 часа для всех форм)
**Приоритет:** 🟡 Средний

---

## 📊 СВОДНАЯ ТАБЛИЦА

| № | Улучшение | Приоритет | Сложность | Время | Ценность |
|---|-----------|-----------|-----------|-------|----------|
| 1 | Парсинг .docx/.pdf | 🔴 Высокий | 🟡 Средняя | 1-2ч | ⭐⭐⭐⭐⭐ |
| 2 | Предпросмотр документа | 🟡 Средний | 🟢 Низкая | 1ч | ⭐⭐⭐⭐ |
| 3 | Редактирование в чате | 🟡 Средний | 🟡 Средняя | 2ч | ⭐⭐⭐⭐ |
| 4 | Адаптивность | 🔴 Высокий | 🟡 Средняя | 3-4ч | ⭐⭐⭐⭐⭐ |
| 5 | Поиск в архиве | 🟡 Средний | 🟢 Низкая | 1-2ч | ⭐⭐⭐ |
| 6 | Версионирование | 🟢 Низкий | 🟡 Средняя | 2-3ч | ⭐⭐⭐ |
| 7 | Темная тема | 🟡 Средний | 🟢 Низкая | 1ч | ⭐⭐⭐ |
| 8 | Экспорт/импорт | 🟢 Низкий | 🟢 Низкая | 2ч | ⭐⭐ |
| 9 | Auth4App интеграция | 🔴 Высокий* | 🟢 Низкая | 1ч | ⭐⭐⭐⭐⭐ |
| 10 | react-hook-form | 🟡 Средний | 🟡 Средняя | 3-4ч | ⭐⭐⭐ |

*только если планируется production

---

## 🎯 РЕКОМЕНДУЕМЫЙ ПЛАН

### Этап 1: Критичные улучшения (1 день)
1. ✅ Парсинг .docx/.pdf файлов
2. ✅ Адаптивность для мобильных
3. ✅ Auth4App интеграция (если production)

### Этап 2: UX улучшения (1 день)
4. ✅ Предпросмотр документа
5. ✅ Поиск в архиве
6. ✅ Темная тема
7. ✅ Редактирование в чате

### Этап 3: Дополнительно (по желанию)
8. ✅ Версионирование документов
9. ✅ react-hook-form валидация
10. ✅ Экспорт/импорт организаций

---

## ❓ ЧТО ВЫБРАТЬ?

Зависит от целей:

**Для демонстрации клиентам:**
- Предпросмотр документа
- Адаптивность
- Темная тема

**Для production запуска:**
- Парсинг файлов
- Auth4App интеграция
- Поиск в архиве

**Для UX:**
- Редактирование в чате
- Версионирование
- react-hook-form

---

**Что бы вы хотели реализовать?** 🤔
