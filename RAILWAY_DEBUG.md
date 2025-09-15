# Отладка проблемы с Railway

## Проблема

Все запросы возвращают 502 ошибку - приложение не запускается.

## Решение

### 1. Тестирование с простым сервером

Сначала проверим, что Railway может запустить простое Node.js приложение:

1. Зафиксируйте изменения:

```bash
git add .
git commit -m "Add simple server for Railway testing"
git push origin main
```

2. Railway запустит простой сервер из `server.js`
3. Проверьте healthcheck: `https://shopify-production-289b.up.railway.app/health`

### 2. Если простой сервер работает

Вернитесь к Remix приложению:

1. Измените `railway.json`:

```json
"startCommand": "npm run start"
```

2. Убедитесь, что все переменные окружения установлены в Railway Dashboard:
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `SCOPES`
   - `SHOPIFY_APP_URL`
   - `NODE_ENV=production`
   - `HOST=0.0.0.0`
   - `PORT=3000`
   - `DATABASE_URL` (автоматически создается Railway)

### 3. Если простой сервер не работает

Проблема в конфигурации Railway:

- Проверьте логи в Railway Dashboard
- Убедитесь, что порт правильно настроен
- Проверьте, что все переменные окружения установлены

### 4. Очистка

После тестирования удалите `server.js`:

```bash
rm server.js
```
