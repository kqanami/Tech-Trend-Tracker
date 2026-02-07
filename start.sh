#!/bin/bash
# Tech Trend Tracker - Quick Start Script

set -e

echo "🚀 Tech Trend Tracker - Запуск..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен! Пожалуйста, запустите Docker Desktop."
    exit 1
fi

echo -e "${BLUE}📦 Шаг 1: Сборка и запуск контейнеров...${NC}"
docker-compose down -v 2>/dev/null || true
docker-compose up --build -d

echo ""
echo -e "${BLUE}⏳ Шаг 2: Ожидание запуска базы данных...${NC}"
sleep 10

echo ""
echo -e "${BLUE}🗄️  Шаг 3: Инициализация базы данных...${NC}"
docker-compose exec -T app python scripts/init_db.py

echo ""
echo -e "${BLUE}🌱 Шаг 4: Заполнение тестовыми данными...${NC}"
docker-compose exec -T app python scripts/seed_data.py

echo ""
echo -e "${GREEN}✅ Готово! Сервисы запущены:${NC}"
echo ""
echo -e "${YELLOW}🌐 Доступные сервисы:${NC}"
echo "   • API:           http://localhost:8000"
echo "   • Swagger UI:    http://localhost:8000/docs"
echo "   • pgAdmin:       http://localhost:5050"
echo ""
echo -e "${YELLOW}📧 pgAdmin логин:${NC}"
echo "   Email:    admin@admin.com"
echo "   Password: admin"
echo ""
echo -e "${YELLOW}📝 Полезные команды:${NC}"
echo "   docker-compose logs -f app     # Логи приложения"
echo "   docker-compose logs -f db      # Логи базы данных"
echo "   docker-compose down            # Остановить сервисы"
echo ""
