# 🚀 Quick Start Guide - Tech Trend Tracker: Cosmic Edition

Добро пожаловать в обновленный Tech Trend Tracker! Теперь всё управление и визуализация происходят через современный космический веб-интерфейс.

## 🛠 Требования

- **Docker Desktop** (запущен)
- **Node.js 18+** (для разработки фронтенда)

---

## ⚡️ Быстрый запуск (Docker + Dev Mode)

Это рекомендуемый способ для первого запуска:

### 1. Запуск Backend инфраструктуры
```bash
# В корне проекта
docker compose up -d
```
Это запустит: PostgreSQL, Redis, FastAPI Backend, Celery Workers и Monitoring (Flower).

### 2. Запуск Frontend интерфейса
```bash
cd frontend
npm install
npm run dev
```

### 3. Открыть в браузере
- **Космический интерфейс**: [http://localhost:5173](http://localhost:5173) (или 3000)
- **API Документация**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Мониторинг задач (Flower)**: [http://localhost:5555](http://localhost:5555)

---

## 📊 Первый сбор данных

После запуска интерфейса вы увидите пустые графики. Чтобы наполнить систему данными:

1. Перейдите в раздел **Admin** через верхнее меню.
2. Нажмите кнопку **"Trigger All Scrapers"**.
3. Дождитесь завершения (статус можно проверить в логах или через Flower).
4. Перейдите на **Dashboard**, чтобы увидеть результат анализа.

---

## 🧪 Проверка компонентов

| Сервис | Команда проверки | Ожидаемый результат |
|--------|------------------|---------------------|
| Backend API | `curl http://localhost:8000/api/v1/health` | `{"status":"ok"}` |
| Database | `docker compose ps db` | Status: Up |
| Redis | `docker compose ps redis` | Status: Up |
| Celery | `docker compose logs celery_worker` | "ready" в логах |

---

## 🏗 Разработка (Tips)

### Работа с Frontend
- Все изменения в `frontend/src` подхватываются автоматически (HMR).
- Для сборки production версии: `npm run build`.

### Логи Backend
Если что-то не работает, проверьте логи:
```bash
docker compose logs -f app
```

### Полный сброс данных
```bash
docker compose down -v
docker compose up -d --build
```

---

## ✅ Готово к полету! 🌌
Теперь у вас есть мощный инструмент для отслеживания технологий с автоматическим ML-анализом настроений и трендов.
