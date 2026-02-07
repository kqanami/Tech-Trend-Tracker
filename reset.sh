#!/bin/bash
# Tech Trend Tracker - Full Reset Script

echo "🔄 Полный сброс Tech Trend Tracker..."
echo "⚠️  Это удалит все данные!"
read -p "Продолжить? (y/N): " confirm

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    docker-compose down -v
    echo "✅ Все данные удалены. Запустите ./start.sh для пересоздания."
else
    echo "❌ Отменено"
fi
