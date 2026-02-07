# 🚀 Tech Trend Tracker - Cosmic Edition v2.0

**Полностью улучшенный движок анализа технологических трендов с современным фронтендом и ML-возможностями**

Система автоматизированного сбора, обработки, ML-анализа технологических новостей из TechCrunch и GitHub Trending с красивым космическим интерфейсом.

## ✨ Новые Возможности v2.0

### 🎨 Frontend (Космическая Тема 🌌)
- **Современный React UI** с Vite + TypeScript
- **Космическая цветовая палитра** (deep space, nebula, stars)
- **Glassmorphism эффекты** и плавные анимации
- **Интерактивные графики** (Bar, Pie, Radar charts)
- **Responsive дизайн** для всех устройств
- **Real-time обновления** через WebSocket

### 🤖 ML & Analytics
- **Sentiment анализ** статей с TextBlob
- **Автоматическая категоризация** с ML
- **Prediction трендов** на основе исторических данных
- **Извлечение ключевых слов** из контента

### ⚡ Performance & Scalability
- **Redis кэширование** для быстрых API responses
- **Celery фоновые задачи** для автоматического сбора данных
- **Rate limiting** для защиты от злоупотреблений
- **Nginx reverse proxy** для production

### 📊 Enhanced Dashboard
- **Красивые stat cards** с анимациями
- **Интерактивные графики** популярных источников и языков
- **Real-time trending** технологий
- **Sentiment визуализация** статей

## 🏗️ Архитектура

```
tech-trend-tracker/
├── app/                    # Backend (FastAPI)
│   ├── api/                # REST API endpoints
│   ├── core/               # Конфигурация
│   ├── db/                 # Database (PostgreSQL)
│   ├── models/             # SQLAlchemy модели
│   ├── services/           # Scrapers, ML, Celery
│   ├── middleware/         # Cache, Rate limiting
│   └── utils/              # Утилиты
├── frontend/               # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/          # Dashboard, Articles, Repos, Trends
│   │   ├── components/     # Layout, UI компоненты
│   │   ├── api/            # API client
│   │   └── index.css       # Космические стили
│   └── package.json
├── nginx/                  # Nginx конфигурация
├── docker-compose.yml      # Docker services
└── requirements.txt        # Python dependencies
```

## 🚀 Быстрый старт

### Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows/Mac)
- Node.js 18+ (для разработки frontend)

### Запуск (Backend + Frontend)

```bash
# 1. Запустить все сервисы
docker-compose up -d

# 2. Установить frontend dependencies (первый раз)
cd frontend
npm install

# 3. Запустить frontend dev server
npm run dev

# 4. Открыть в браузере
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
# Flower (Celery): http://localhost:5555
```

### Доступ к сервисам

| Сервис | URL | Описание |
|--------|-----|----------|
| Frontend | http://localhost:3000 | React UI (Космическая тема) |
| API | http://localhost:8000 | FastAPI Backend |
| Swagger | http://localhost:8000/docs | Интерактивная документация |
| Flower | http://localhost:5555 | Celery monitoring |
| pgAdmin | http://localhost:5050 | Управление БД |
| Redis | localhost:6379 | Кэш и Celery broker |

## 📚 API Endpoints

### Статьи
```bash
GET /api/v1/articles          # Все статьи с пагинацией
GET /api/v1/articles/{id}     # Статья по ID
GET /api/v1/articles/sources/list     # Список источников
GET /api/v1/articles/categories/list  # Список категорий

# Параметры: page, page_size, source, category, tag, search
```

### Репозитории
```bash
GET /api/v1/repos             # Все репозитории
GET /api/v1/repos/{id}        # Репозиторий по ID
GET /api/v1/repos/languages/list  # Языки программирования

# Параметры: page, page_size, language, min_stars, search
```

### Тренды
```bash
GET /api/v1/trends            # Все тренды
GET /api/v1/trends/{id}       # Тренд по ID
GET /api/v1/trends/categories/list  # Категории трендов

# Параметры: page, page_size, category, min_score, search
```

### Dashboard & Scraping
```bash
GET /api/v1/dashboard/stats   # Статистика
POST /api/v1/scrape           # Запустить scraping
GET /api/v1/health            # Health check
```

## 🛠️ Новые Команды

### Backend
```bash
# Запуск всех сервисов
docker-compose up -d

# Посмотреть логи
docker-compose logs -f app
docker-compose logs -f celery_worker

# Выполнить команду в контейнере
docker-compose exec app python scripts/seed_data.py

# Остановка
docker-compose down

# Полный сброс (удалить все данные)
docker-compose down -v
```

### Frontend
```bash
cd frontend

# Разработка
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

## 🎨 Frontend Фичи

### Dashboard
- Статистические карточки с анимациями
- Bar chart популярных источников
- Pie chart языков программирования
- Trending технологии в реальном времени

### Articles Page
- Поиск и фильтрация по источнику/категории
- Sentiment analysis визуализация
- Красивые карточки с изображениями
- Теги и метаданные

### Repositories Page
- Поиск и фильтр по языку
- Stars, forks, trending score
- Topics и описания
- Growthстатистика (stars today)

### Trends Page
- Radar chart для сравнения топ трендов
- Ranking с визуализацией scores
- Популярность и growth метрики
- Детальная статистика (articles + repos)

## 🤖 ML & Background Tasks

### Celery Периодические Задачи
- **Каждые 6 часов**: Сбор новостей TechCrunch
- **Каждые 6 часов**: Сбор GitHub trending
- **Каждый час**: Расчет трендов
- **Ежедневно (3 AM)**: Очистка старых данных (>90 дней)

### ML Анализ
- **Sentiment Analysis**: Автоматический анализ настроения статей (-1 до 1)
- **Категоризация**: ML-классификация по категориям (AI/ML, Web Dev, DevOps, и т.д.)
- **Keyword Extraction**: Извлечение ключевых слов для тегов
- **Trend Prediction**: Прогнозирование trending score

## 🗄️ Модели данных

### Article
- `sentiment_score` (NEW) - ML sentiment анализ
- Автоматическая категоризация с ML
- Enhanced tags с ML keywords

### GitHubRepo
- `trending_score` - Рассчитанный score популярности
- `stars_today`, `stars_week` - Growth метрики

### Trend
- `popularity_score`, `growth_score`, `overall_score`
- ML-powered category assignment
- Автоматический расчет каждый час

## 🎨 Космическая Тема

Цветовая палитра:
- **Cosmic**: Deep purple/blue градиенты (#667eea → #764ba2)
- **Nebula**: Pink/purple градиенты (#f093fb → #f5576c)
- **Space**: Dark backgrounds (#0f0f1e, #1a1a2e)

Эффекты:
- Glassmorphism карточки
- Плавные анимации (float, pulse, shimmer)
- Gradient text и кнопки
- Cosmic shadows и glows

## 📝 Для разработки

### Backend
```bash
# Без Docker
pip install -r requirements.txt
python -m app.main

# Тесты
pytest

# Форматирование
black app/
isort app/
```

### Frontend
```bash
cd frontend

# TypeScript проверка
npm run type-check

# Build для production
npm run build

# Анализ bundle size
npm run build -- --analyze
```

## 🌟 Новые Зависимости

### Backend
- `redis` - Кэширование
- `celery` - Фоновые задачи
- `textblob` - ML sentiment analysis
- `scikit-learn` - ML классификация
- `slowapi` - Rate limiting

### Frontend
- `react` + `typescript` - UI framework
- `recharts` - Графики
- `@tanstack/react-query` - Data fetching
- `tailwindcss` - Styling
- `lucide-react` - Icons

## 🚀 Production Deployment

1. Обновить `SECRET_KEY` в `.env`
2. Настроить `GITHUB_TOKEN` для большего rate limit
3. Изменить `DEBUG=False`
4. Build frontend: `cd frontend && npm run build`
5. Запустить с Nginx: `docker-compose up -d`
6. Frontend доступен через Nginx на порту 80

## 📞 Поддержка

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Flower (Celery): http://localhost:5555

**Новая версия с космическим дизайном и мощными ML-возможностями! 🌌✨**
