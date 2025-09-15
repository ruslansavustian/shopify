# Запуск для тестировщика

## Быстрый старт (1 команда):

```bash
# 1. Скопируйте .env.example в .env
cp .env.example .env

# 2. Заполните в .env ваши Shopify credentials
# SHOPIFY_API_KEY=ваш_ключ
# SHOPIFY_API_SECRET=ваш_секрет

# 3. Запустите все одной командой
docker-compose up
```

## Что происходит:

- ✅ PostgreSQL автоматически устанавливается и настраивается
- ✅ База данных создается автоматически
- ✅ Миграции применяются автоматически
- ✅ Приложение запускается на http://localhost:3000

## Остановка:

```bash
docker-compose down
```

## Требования:

- Docker
- Docker Compose
- Shopify App credentials

## Troubleshooting:

- Если порт 5432 занят: измените в docker-compose.yml на другой
- Если порт 3000 занят: измените в docker-compose.yml на другой
