# 💾 РУКОВОДСТВО ПО РЕЗЕРВНОМУ КОПИРОВАНИЮ

**Версия:** v25
**Дата:** 19 октября 2025

---

## 🎯 СТРАТЕГИЯ BACKUP

### Автоматические бэкапы (Neon)

**Neon PostgreSQL автоматически:**
- ✅ Создаёт snapshot каждые 24 часа
- ✅ Хранит snapshots 7 дней (Free tier)
- ✅ Хранит snapshots 30 дней (Pro tier)
- ✅ Point-in-time recovery (PITR) до 7 дней назад

**Ничего настраивать не нужно!** Работает из коробки.

---

## 📋 MANUAL BACKUPS

### Когда делать вручную:

1. **Перед миграцией БД**
2. **Перед большими изменениями**
3. **Перед production deploy**
4. **Раз в неделю** (для важных данных)

---

## 🔧 КАК СОЗДАТЬ BACKUP

### Вариант 1: Через Neon Dashboard (Рекомендуется)

1. Откройте: https://console.neon.tech/
2. Выберите ваш проект
3. Перейдите в **Backups** или **Branches**
4. Нажмите **Create Branch**
5. Назовите ветку: `backup-2025-10-19` или `before-migration`
6. Готово! Snapshot создан

**Восстановление:**
1. Откройте branch с backup
2. **Restore** → выберите target branch
3. Подтвердите восстановление

---

### Вариант 2: pg_dump (Export в файл)

**Установка pg_dump:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

**Создание backup:**
```bash
# 1. Получите DATABASE_URL из .env
DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/dbname"

# 2. Создайте backup
pg_dump "$DATABASE_URL" > backup-$(date +%Y-%m-%d).sql

# 3. Сожмите (опционально)
gzip backup-$(date +%Y-%m-%d).sql
```

**Восстановление:**
```bash
# 1. Распакуйте (если сжато)
gunzip backup-2025-10-19.sql.gz

# 2. Восстановите
psql "$DATABASE_URL" < backup-2025-10-19.sql
```

---

### Вариант 3: Prisma Migrate (Schema только)

**Backup schema:**
```bash
# Сохранить текущую схему
bunx prisma db pull
# → обновит prisma/schema.prisma

# Закоммитить в Git
git add prisma/schema.prisma
git commit -m "backup: schema before migration"
```

**Восстановление schema:**
```bash
# Откатить schema
git checkout HEAD~1 -- prisma/schema.prisma

# Применить
bunx prisma migrate dev --name rollback
```

---

## 🗓️ РАСПИСАНИЕ BACKUP

### Автоматические (Neon):
- **Ежедневно:** Автоматический snapshot (00:00 UTC)
- **Retention:** 7 дней (Free), 30 дней (Pro)

### Ручные (Рекомендуется):
- **Еженедельно:** Воскресенье вечером
- **Перед миграцией:** Каждый раз
- **Перед deploy:** Каждый production deploy
- **Перед большими изменениями:** По необходимости

---

## 📦 ГДЕ ХРАНИТЬ BACKUPS

### Вариант 1: Git (для schema)
```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "backup: database schema"
git push
```

✅ Бесплатно
✅ Версионирование
❌ Не подходит для данных (слишком большие)

---

### Вариант 2: Cloud Storage

**Google Drive / Dropbox:**
```bash
# Создать backup
pg_dump "$DATABASE_URL" | gzip > backup.sql.gz

# Загрузить вручную в Google Drive
```

**AWS S3:**
```bash
# Установить AWS CLI
bun add -g aws-cli

# Создать backup и загрузить
pg_dump "$DATABASE_URL" | gzip | aws s3 cp - s3://my-backups/db-$(date +%Y-%m-%d).sql.gz
```

**Стоимость:**
- Google Drive: 15 GB бесплатно
- Dropbox: 2 GB бесплатно
- AWS S3: ~$0.023/GB/месяц

---

### Вариант 3: Локально

```bash
# Создать директорию
mkdir -p ~/backups/buh-ai-assistant

# Backup с датой
pg_dump "$DATABASE_URL" | gzip > ~/backups/buh-ai-assistant/backup-$(date +%Y-%m-%d).sql.gz

# Удалять backups старше 30 дней
find ~/backups/buh-ai-assistant -name "*.sql.gz" -mtime +30 -delete
```

✅ Быстро
✅ Бесплатно
❌ Не защищено от потери компьютера

---

## 🔥 DISASTER RECOVERY

### Сценарий 1: Случайное удаление данных

**Если < 7 дней назад:**
1. Neon Dashboard → Branches
2. Create branch from `main` на момент до удаления
3. Проверить данные в новой ветке
4. Restore если всё ОК

**Если > 7 дней назад:**
1. Восстановить из pg_dump backup
2. Проверить данные
3. Применить recent миграции

---

### Сценарий 2: Плохая миграция

**Если миграция сломала данные:**
```bash
# 1. Откатить последнюю миграцию
git revert HEAD

# 2. Восстановить из Neon branch
# Neon Dashboard → Restore before migration

# 3. Применить исправленную миграцию
bunx prisma migrate dev --name fix
```

---

### Сценарий 3: Полная потеря БД

**Редко, но бывает:**

1. **Создать новую БД в Neon**
2. **Восстановить schema:**
   ```bash
   bunx prisma migrate deploy
   ```
3. **Восстановить данные:**
   ```bash
   psql "$NEW_DATABASE_URL" < latest-backup.sql
   ```
4. **Обновить .env:**
   ```env
   DATABASE_URL="новый_url"
   ```

---

## ✅ CHECKLIST

### Перед каждой миграцией:
- [ ] Создать Neon branch с текущим состоянием
- [ ] Сделать pg_dump backup
- [ ] Проверить что backup успешен
- [ ] Сохранить backup в безопасное место
- [ ] Выполнить миграцию
- [ ] Проверить что всё работает
- [ ] Удалить старые backups (>30 дней)

---

### Еженедельно:
- [ ] Проверить что автобэкапы Neon работают
- [ ] Создать pg_dump backup
- [ ] Загрузить в Google Drive / S3
- [ ] Протестировать восстановление (раз в месяц)

---

## 🔧 АВТОМАТИЗАЦИЯ

### GitHub Actions (еженедельный backup):

```yaml
# .github/workflows/backup.yml
name: Weekly Database Backup

on:
  schedule:
    - cron: '0 0 * * 0' # Каждое воскресенье в 00:00

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Install PostgreSQL Client
        run: sudo apt-get install -y postgresql-client

      - name: Create Backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          pg_dump "$DATABASE_URL" | gzip > backup-$(date +%Y-%m-%d).sql.gz

      - name: Upload to Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backup-*.sql.gz
          retention-days: 30
```

---

### Cron job (на сервере):

```bash
# Добавить в crontab
crontab -e

# Backup каждое воскресенье в 03:00
0 3 * * 0 pg_dump "$DATABASE_URL" | gzip > ~/backups/backup-$(date +\%Y-\%m-\%d).sql.gz
```

---

## 💡 BEST PRACTICES

### 1. Тестируйте восстановление
- Раз в месяц пробуйте восстановить backup
- Убедитесь что процесс работает

### 2. Храните в нескольких местах
- Neon branches (7-30 дней)
- Cloud storage (Google Drive / S3)
- Локальная копия

### 3. Документируйте процесс
- Когда сделан backup
- Где хранится
- Как восстановить

### 4. Шифруйте чувствительные данные
```bash
# Backup с шифрованием
pg_dump "$DATABASE_URL" | gzip | gpg -c > backup-encrypted.sql.gz.gpg

# Восстановление
gpg -d backup-encrypted.sql.gz.gpg | gunzip | psql "$DATABASE_URL"
```

---

## 📊 MONITORING

### Проверка backups:

**Neon Dashboard:**
1. Console → Project → Backups
2. Проверить дату последнего snapshot
3. Убедиться что storage не переполнен

**CLI:**
```bash
# Проверить размер БД
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Список таблиц и размеры
psql "$DATABASE_URL" -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname='public';"
```

---

## 🎯 SUMMARY

**Что делать:**
1. ✅ Neon автобэкапы работают → ничего не делать
2. ✅ Перед миграцией → создать Neon branch
3. ✅ Раз в неделю → pg_dump в Google Drive
4. ✅ Раз в месяц → тестировать restore

**Что НЕ делать:**
- ❌ Полагаться только на Neon (могут быть сбои)
- ❌ Хранить backups только локально
- ❌ Не тестировать восстановление
- ❌ Забывать делать backup перед миграцией

---

**Backups = спокойствие! 💾**
