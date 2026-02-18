# VLPT Docs

Краткая документация по запуску и работе проекта.

## Структура

- `frontend/` — React + Vite + Tailwind
- `backend/` — Node.js + Express + MySQL
- `database/` — SQL-схема
- `docker-compose.yml` — запуск в контейнерах

## Быстрый запуск (Docker, рекомендовано)

Из корня проекта:

```bash
docker compose up -d
```

После запуска:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- Health-check: `http://localhost:4000/api/health`

Остановить:

```bash
docker compose down
```

Логи:

```bash
docker compose logs -f backend frontend db
```

## Локальный запуск (без Docker)

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Backend по умолчанию: `http://localhost:4000`.

### 2) Frontend

В новом терминале:

```bash
cd frontend
npm install
npm run dev
```

Frontend по умолчанию: `http://localhost:3000`.

## База данных

Подключение берется из переменных окружения backend:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

При старте backend вызывается инициализация схемы (`initDb()`).

## Частые команды Git

Проверка статуса:

```bash
git status
```

Обновить удаленный репозиторий:

```bash
git push origin main
```

