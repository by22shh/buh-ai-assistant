# 🚀 СЛЕДУЮЩИЕ ШАГИ РАЗРАБОТКИ

Дата: 19 октября 2025
Текущая версия: **v19**
Статус: **MVP готов к демонстрации (97% соответствие ТЗ)**

---

## ✅ ЧТО УЖЕ РАБОТАЕТ

### Полностью реализовано:
- ✅ Все страницы из ТЗ (пользовательские + админ-панель)
- ✅ Авторизация (mock через localStorage)
- ✅ Каталог шаблонов с фильтрами
- ✅ Управление организациями
- ✅ ИИ-чат для тела документа (mock)
- ✅ Динамические формы реквизитов
- ✅ Архив документов
- ✅ Личный кабинет с демо-доступом
- ✅ Админ-панель (шаблоны, реквизиты, доступы)
- ✅ Валидация реквизитов (ИНН, ОГРН, БИК, счета)
- ✅ Модуль requisitesGuard
- ✅ Лендинг (5 документов, 3 карточки, 5 шагов)

---

## 🔄 ЧТО НУЖНО ДОРАБОТАТЬ ДЛЯ PRODUCTION

### ПРИОРИТЕТ 1: Интеграции с внешними сервисами

#### 1.1. Auth4App (Авторизация)
**Статус:** Заглушки готовы в `src/lib/services/auth4app.ts`

**Что нужно сделать:**
1. Получить API ключ от Auth4App: https://auth4app.com/
2. Добавить в `.env`:
   ```
   NEXT_PUBLIC_AUTH4APP_API_KEY=your_key
   NEXT_PUBLIC_AUTH4APP_PROJECT_ID=your_project_id
   ```
3. Раскомментировать реальные API вызовы в `auth4app.ts`
4. Обновить страницу `/auth/login` для работы с реальным API
5. Реализовать JWT токены для сессий

**Документация:** https://support.auth4app.com/books/rest-api

---

#### 1.2. OpenAI API (ИИ-помощник)
**Статус:** Заглушки готовы в `src/lib/services/openai.ts`

**Что нужно сделать:**
1. Получить API ключ: https://platform.openai.com/api-keys
2. Добавить в `.env`:
   ```
   OPENAI_API_KEY=sk-your_key
   OPENAI_MODEL=gpt-4o-mini
   ```
3. Раскомментировать реальные API вызовы в `openai.ts`
4. Обновить `/doc/[id]/body/page.tsx` для использования реального ИИ
5. Настроить промпты для каждого типа документа

**Документация:** https://platform.openai.com/docs

---

#### 1.3. Backend API (Хранилище данных)
**Статус:** Используется localStorage (mock)

**Что нужно сделать:**
1. Создать backend API (Node.js/Express или Next.js API routes)
2. Подключить базу данных (PostgreSQL / MongoDB)
3. Реализовать эндпоинты:
   - `/api/users` - управление пользователями
   - `/api/organizations` - организации
   - `/api/documents` - документы
   - `/api/templates` - шаблоны (для админа)
   - `/api/access` - управление доступами
4. Заменить все вызовы `mockAuth`, `mockOrganizations`, `mockDocuments` на API запросы

**Схема БД:** См. файл `src/lib/store/mockData.ts` для структуры данных

---

### ПРИОРИТЕТ 2: Генерация документов

#### 2.1. Генерация DOCX файлов
**Библиотека:** [docx](https://www.npmjs.com/package/docx) или [docxtemplater](https://www.npmjs.com/package/docxtemplater)

**Что нужно сделать:**
1. Создать API route: `/api/documents/generate-docx`
2. Принимать: `{ templateCode, bodyText, requisites, organization }`
3. Генерировать .docx файл с правильной структурой
4. Возвращать файл для скачивания
5. Обновить кнопку "Скачать DOCX" в `/docs`

**Пример реализации:**
```typescript
// app/api/documents/generate-docx/route.ts
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function POST(req: Request) {
  const { bodyText, requisites } = await req.json();

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun(bodyText)]
        }),
        // ... добавить реквизиты
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename=document.docx'
    }
  });
}
```

---

#### 2.2. Генерация PDF файлов
**Библиотека:** [jsPDF](https://www.npmjs.com/package/jspdf) или [pdfkit](https://www.npmjs.com/package/pdfkit)

**Что нужно сделать:**
1. Создать API route: `/api/documents/generate-pdf`
2. Аналогично DOCX, но генерировать PDF
3. Поддержка русского языка (шрифты)
4. Обновить кнопку "Скачать PDF" в `/docs`

---

#### 2.3. Парсинг загруженных файлов (.docx, .pdf)
**Текущее состояние:** Только .txt и .md (в браузере)

**Что нужно сделать:**
1. Создать API route: `/api/files/parse`
2. Использовать библиотеки на сервере:
   - [mammoth](https://www.npmjs.com/package/mammoth) для .docx
   - [pdf-parse](https://www.npmjs.com/package/pdf-parse) для .pdf
3. Возвращать извлечённый текст
4. Обновить `handleFileUpload` в `/doc/[id]/body/page.tsx`

**Пример:**
```typescript
// app/api/files/parse/route.ts
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (file.name.endsWith('.docx')) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return Response.json({ text: result.value });
  }

  if (file.name.endsWith('.pdf')) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    return Response.json({ text: data.text });
  }

  return Response.json({ error: 'Unsupported format' }, { status: 400 });
}
```

---

### ПРИОРИТЕТ 3: UI/UX улучшения

#### 3.1. Адаптивность для мобильных
**Текущее состояние:** Базовая адаптивность через Tailwind

**Что нужно проверить:**
- [ ] Лендинг на мобильных (< 640px)
- [ ] Каталог шаблонов (карточки в 1 колонку)
- [ ] Формы создания организации
- [ ] ИИ-чат (мобильная клавиатура)
- [ ] Таблица архива (горизонтальный скролл)
- [ ] Админ-панель

---

#### 3.2. Темная тема
**Библиотека:** `next-themes` (уже установлена)

**Что нужно сделать:**
1. Добавить ThemeProvider в `app/layout.tsx`
2. Создать кнопку переключения темы
3. Настроить цвета в `tailwind.config.js`
4. Протестировать все страницы в темной теме

---

#### 3.3. Улучшенная валидация форм
**Библиотека:** [react-hook-form](https://react-hook-form.com/) + [zod](https://zod.dev/)

**Страницы для улучшения:**
- `/org/create` - создание организации
- `/doc/[id]/requisites` - заполнение реквизитов
- `/admin/templates/create` - создание шаблона

**Пример:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  inn: z.string().regex(/^\d{10}$|^\d{12}$/, 'ИНН должен быть 10 или 12 цифр'),
  // ...
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

---

### ПРИОРИТЕТ 4: Дополнительные фичи

#### 4.1. Поиск и фильтры в архиве документов
**Страница:** `/docs`

**Что добавить:**
- Поиск по названию документа
- Фильтр по шаблону
- Фильтр по организации
- Фильтр по дате создания
- Сортировка

---

#### 4.2. История изменений документа
**Что добавить:**
- Версионирование документов
- История правок в чате с ИИ
- Возможность откатиться к предыдущей версии

---

#### 4.3. Экспорт/импорт организаций
**Что добавить:**
- Экспорт списка организаций в CSV/Excel
- Импорт организаций из CSV/Excel
- Шаблон для импорта

---

## 📋 ЧЕКЛИСТ ПЕРЕД ДЕПЛОЕМ В PRODUCTION

### Безопасность:
- [ ] Все секретные ключи в `.env` (не в коде)
- [ ] JWT токены для сессий
- [ ] Rate limiting для API
- [ ] Валидация всех входных данных
- [ ] CORS настроен правильно
- [ ] HTTPS обязателен

### Производительность:
- [ ] Минификация и сжатие (Gzip/Brotli)
- [ ] CDN для статики
- [ ] Кеширование API запросов
- [ ] Lazy loading компонентов
- [ ] Оптимизация изображений

### Мониторинг:
- [ ] Логирование ошибок (Sentry / LogRocket)
- [ ] Аналитика (Google Analytics / Plausible)
- [ ] Мониторинг uptime
- [ ] Отчёты об ошибках

### Тестирование:
- [ ] Unit тесты (Jest / Vitest)
- [ ] E2E тесты (Playwright / Cypress)
- [ ] Тестирование на реальных устройствах
- [ ] Нагрузочное тестирование

---

## 🎯 РЕКОМЕНДУЕМАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ

### Этап 1 (2-3 недели): Backend и авторизация
1. Настроить базу данных (PostgreSQL)
2. Создать API routes для всех операций
3. Интегрировать Auth4App
4. Заменить mock на реальные данные

### Этап 2 (1-2 недели): ИИ и генерация документов
1. Интегрировать OpenAI API
2. Настроить промпты для каждого шаблона
3. Реализовать генерацию DOCX/PDF
4. Добавить парсинг загруженных файлов

### Этап 3 (1 неделя): UI/UX полировка
1. Адаптивность для мобильных
2. Темная тема
3. Улучшенная валидация форм
4. Анимации и transitions

### Этап 4 (1 неделя): Тестирование и деплой
1. Тестирование всех функций
2. Исправление багов
3. Настройка production окружения
4. Деплой на Netlify/Vercel

---

## 📞 ПОДДЕРЖКА

**Если возникнут вопросы:**
- 📧 Email: support@same.new
- 📚 Документация Same: https://docs.same.new
- 💬 Telegram: @same_support

**Полезные ресурсы:**
- Next.js 15: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- Auth4App: https://support.auth4app.com
- OpenAI API: https://platform.openai.com/docs

---

**Удачи в разработке! 🚀**
