# Исправление проблемы с Railway

## Проблема

Приложение не запускается на Railway с ошибкой "connection refused".

## Решение

### 1. Переменные окружения в Railway

Убедитесь, что в Railway Dashboard -> Variables установлены все переменные:

```
SHOPIFY_API_KEY=dc0b0520ad9dbf1b00ab7727ee807509
SHOPIFY_API_SECRET=25b5f3548f38b154e1dad60a2eb18f75
SCOPES="read_discounts,read_orders,read_products,read_themes,write_discounts,write_orders,write_products,write_themes"
SHOPIFY_APP_URL="https://shopify-production-289b.up.railway.app"
NODE_ENV="production"
HOST="0.0.0.0"
PORT="3000"
```

### 2. База данных

Railway автоматически создаст переменную `DATABASE_URL` для PostgreSQL. Убедитесь, что:

- В Railway Dashboard добавлена база данных PostgreSQL
- Переменная `DATABASE_URL` автоматически установлена

### 3. Развертывание

1. Зафиксируйте изменения:

```bash
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

2. Railway автоматически пересоберет и развернет приложение

### 4. Проверка

После развертывания проверьте:

- Логи в Railway Dashboard
- Приложение должно быть доступно по адресу: https://shopify-production-289b.up.railway.app/app

### 5. Если проблема остается

1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что база данных PostgreSQL создана и доступна
4. Попробуйте перезапустить сервис в Railway Dashboard

## Изменения в коде

- Обновлен `railway.json` с правильным healthcheck путем (`/health`)
- Обновлен `package.json` для правильной обработки порта
- Обновлен `Dockerfile` для правильной обработки порта
- Создан простой healthcheck endpoint в `app/routes/health.tsx`
- Увеличен timeout для healthcheck до 300 секунд
- Добавлены переменные окружения в `railway.json`
