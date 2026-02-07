# 📖 Полный гайд по запуску Tech Trend Tracker на Docker Desktop

## Что такое Docker Desktop?

Docker Desktop — это приложение, которое позволяет запускать контейнеры (изолированные окружения) на твоём компьютере. Проще говоря, это как виртуальная машина, но легче и быстрее.

---

## Шаг 0: Установка Docker Desktop

### Windows

1. Перейди на https://www.docker.com/products/docker-desktop
2. Нажми "Download for Windows"
3. Запусти скачанный `.exe` файл
4. Следуй инструкциям установщика
5. **ВАЖНО**: При установке может предложить использовать WSL 2 — соглашайся!
6. Перезагрузи компьютер если попросит

### Mac

1. Перейди на https://www.docker.com/products/docker-desktop
2. Нажми "Download for Mac" (выбери Intel или Apple Silicon)
3. Открой скачанный `.dmg` файл
4. Перетащи Docker в Applications
5. Запусти Docker Desktop из Applications

### Проверка установки

Открой терминал (Windows: PowerShell или CMD, Mac: Terminal) и введи:

```bash
docker --version
```

Должно показать что-то вроде:
```
Docker version 24.0.0, build ...
```

Также проверь:
```bash
docker-compose --version
```

---

## Шаг 1: Подготовка проекта

### 1.1 Создай папку для проекта

**Windows (PowerShell):**
```powershell
# Создать папку на рабочем столе
mkdir C:\Users\%USERNAME%\Desktop\tech-trend-tracker
cd C:\Users\%USERNAME%\Desktop\tech-trend-tracker
```

**Mac/Linux:**
```bash
# Создать папку на рабочем столе
mkdir ~/Desktop/tech-trend-tracker
cd ~/Desktop/tech-trend-tracker
```

### 1.2 Распакуй проект

Скопируй все файлы из архива `tech-trend-tracker.tar.gz` в эту папку.

**Windows:**
- Используй 7-Zip или WinRAR для распаковки `.tar.gz`
- Или через PowerShell:
```powershell
tar -xzf tech-trend-tracker.tar.gz
```

**Mac/Linux:**
```bash
tar -xzf tech-trend-tracker.tar.gz
```

### 1.3 Проверь структуру

В папке должны быть такие файлы:
```
tech-trend-tracker/
├── app/                 # ← Исходный код
├── scripts/             # ← Скрипты
├── tests/               # ← Тесты
├── docker-compose.yml   # ← Конфигурация Docker
├── Dockerfile           # ← Инструкция сборки
├── start.sh             # ← Скрипт запуска
├── stop.sh              # ← Скрипт остановки
├── requirements.txt     # ← Python зависимости
└── README.md            # ← Документация
```

---

## Шаг 2: Запуск Docker Desktop

1. Найди Docker Desktop в меню Пуск (Windows) или Applications (Mac)
2. Запусти его
3. Дождись пока внизу окна появится зелёная надпись "Docker Desktop is running"

**Важно**: Docker Desktop должен быть запущен перед выполнением следующих шагов!

---

## Шаг 3: Запуск проекта

### 3.1 Открой терминал в папке проекта

**Windows:**
- Открой PowerShell
- Перейди в папку:
```powershell
cd C:\Users\%USERNAME%\Desktop\tech-trend-tracker
```

**Mac:**
- Открой Terminal
- Перейди в папку:
```bash
cd ~/Desktop/tech-trend-tracker
```

### 3.2 Запусти проект

**Вариант 1: Через скрипт (проще)**
```bash
./start.sh
```

**Вариант 2: Вручную**
```bash
# 1. Собрать и запустить контейнеры
docker-compose up --build -d

# 2. Подождать 10 секунд (база данных запускается)
sleep 10

# 3. Создать таблицы в базе
docker-compose exec app python scripts/init_db.py

# 4. Заполнить тестовыми данными
docker-compose exec app python scripts/seed_data.py
```

### 3.3 Что происходит при запуске

```
🚀 Tech Trend Tracker - Запуск...

📦 Шаг 1: Сборка и запуск контейнеров...
[+] Building 15.2s (15/15) FINISHED
[+] Running 3/3
 ⠿ Container tech_trend_db      Started
 ⠿ Container tech_trend_app     Started
 ⠿ Container tech_trend_pgadmin Started

⏳ Шаг 2: Ожидание запуска базы данных...

🗄️  Шаг 3: Инициализация базы данных...
Initializing database...
Database initialized successfully!

🌱 Шаг 4: Заполнение тестовыми данными...
Seeded 8 tags
Seeded 5 articles
Seeded 5 repositories
Seeded 5 trends

✅ Готово! Сервисы запущены:

🌐 Доступные сервисы:
   • API:           http://localhost:8000
   • Swagger UI:    http://localhost:8000/docs
   • pgAdmin:       http://localhost:5050
```

---

## Шаг 4: Проверка работы

### 4.1 Открой браузер

Перейди по адресам:

1. **http://localhost:8000** — должно показать информацию о API
2. **http://localhost:8000/docs** — Swagger UI (интерактивная документация)
3. **http://localhost:5050** — pgAdmin (управление базой данных)

### 4.2 Проверь API через Swagger

1. Открой http://localhost:8000/docs
2. Нажми на любой endpoint, например `GET /api/v1/articles`
3. Нажми кнопку "Try it out"
4. Нажми "Execute"
5. Должен вернуться JSON со списком статей

### 4.3 Проверь через терминал

```bash
# Проверка здоровья системы
curl http://localhost:8000/health

# Получить статьи
curl http://localhost:8000/api/v1/articles

# Получить репозитории
curl http://localhost:8000/api/v1/repos

# Получить тренды
curl http://localhost:8000/api/v1/trends

# Dashboard статистика
curl http://localhost:8000/api/v1/dashboard/stats
```

---

## Шаг 5: Работа с pgAdmin

pgAdmin — это веб-интерфейс для управления PostgreSQL.

### 5.1 Открой pgAdmin

Перейди на http://localhost:5050

### 5.2 Войди

- Email: `admin@admin.com`
- Password: `admin`

### 5.3 Подключись к базе данных

1. Нажми "Add New Server"
2. На вкладке General:
   - Name: `Tech Trend DB`
3. На вкладке Connection:
   - Host: `db` (имя контейнера)
   - Port: `5432`
   - Database: `techtrend`
   - Username: `techuser`
   - Password: `techpass`
4. Нажми Save

Теперь можешь смотреть таблицы и данные!

---

## Полезные команды

### Просмотр логов

```bash
# Логи приложения
docker-compose logs -f app

# Логи базы данных
docker-compose logs -f db

# Логи pgAdmin
docker-compose logs -f pgadmin

# Все логи
docker-compose logs -f
```

### Остановка

```bash
# Остановить сервисы (данные сохранятся)
./stop.sh
# или
docker-compose down

# Остановить и удалить данные
./reset.sh
# или
docker-compose down -v
```

### Перезапуск

```bash
# Перезапустить приложение
docker-compose restart app

# Перезапустить всё
docker-compose restart
```

### Выполнить команду внутри контейнера

```bash
# Запустить скрипт
docker-compose exec app python scripts/seed_data.py

# Открыть shell в контейнере
docker-compose exec app bash

# Выполнить SQL запрос
docker-compose exec db psql -U techuser -d techtrend -c "SELECT * FROM articles;"
```

---

## Решение проблем

### Проблема: "Docker не запущен"

**Решение:**
1. Запусти Docker Desktop
2. Дождись пока появится зелёная надпись
3. Попробуй снова

### Проблема: "Порт 8000 уже занят"

**Ошибка:**
```
Error starting userland proxy: listen tcp 0.0.0.0:8000: bind: address already in use
```

**Решение 1:** Найди и останови процесс
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac
lsof -i :8000
kill -9 <PID>
```

**Решение 2:** Измени порт в `docker-compose.yml`
```yaml
ports:
  - "8001:8000"  # Теперь API будет на http://localhost:8001
```

### Проблема: "База данных не подключается"

**Решение:**
```bash
# Проверь статус контейнеров
docker-compose ps

# Перезапусти базу
docker-compose restart db

# Подожди 10 секунд и инициализируй снова
sleep 10
docker-compose exec app python scripts/init_db.py
```

### Проблема: "Cannot connect to the Docker daemon"

**Решение:**
1. Запусти Docker Desktop
2. На Windows: убедись что включен WSL 2
3. Перезагрузи компьютер

### Проблема: "Permission denied" на Mac/Linux

**Решение:**
```bash
chmod +x start.sh stop.sh reset.sh
```

---

## Что делает каждый сервис

### 1. PostgreSQL (db)
- **Порт:** 5432
- **Назначение:** Хранит все данные
- **База:** techtrend
- **Пользователь:** techuser / techpass

### 2. FastAPI App (app)
- **Порт:** 8000
- **Назначение:** REST API
- **Фреймворк:** FastAPI (Python)
- **Автоперезагрузка:** при изменении кода

### 3. pgAdmin
- **Порт:** 5050
- **Назначение:** Веб-интерфейс для управления БД
- **Логин:** admin@admin.com / admin

---

## API Примеры

### Получить статьи с пагинацией
```bash
curl "http://localhost:8000/api/v1/articles?page=1&page_size=10"
```

### Фильтр по категории
```bash
curl "http://localhost:8000/api/v1/articles?category=artificial-intelligence"
```

### Поиск репозиториев
```bash
curl "http://localhost:8000/api/v1/repos?search=machine+learning&language=python"
```

### Запустить сбор данных
```bash
curl -X POST "http://localhost:8000/api/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{"source": "all", "limit": 20}'
```

---

## Для показа преподу

1. **Открой Swagger:** http://localhost:8000/docs
2. **Покажи ER-диаграмму:** `docs/er_diagram.png`
3. **Продемонстрируй:**
   - `GET /api/v1/articles` — список статей
   - `GET /api/v1/repos` — репозитории
   - `GET /api/v1/trends` — тренды
   - `GET /api/v1/dashboard/stats` — статистика
   - `POST /api/v1/scrape` — запуск сбора данных

---

## Готово! 🎉

Если всё работает — поздравляю! Твой Tech Trend Tracker запущен и готов к использованию.

Если есть проблемы — проверь логи и обратись к разделу "Решение проблем".
