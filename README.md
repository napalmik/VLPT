## Локальное веб-приложение учёта учебной нагрузки

Проект для учёта учебной нагрузки преподавателей, управления расписанием и генерации отчётов.

### Стек
- Backend: Node.js + Express.js (TypeScript)
- Frontend: React + TypeScript + Vite + Tailwind CSS
- База данных: MySQL (в Docker)
- Контейнеризация: Docker + Docker Compose

### Структура
- `backend/` — API-сервер (аутентификация, расписание, отчёты)
- `frontend/` — SPA-клиент (личный кабинет, календарь, отчёты)

### Быстрый старт (план)
1. Установить Node.js (LTS) и Docker Desktop.
2. Собрать зависимости во frontend и backend.
3. Запустить `docker-compose up -d`.
4. Запустить backend и frontend в режиме разработки.








