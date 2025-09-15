# Настройка Railway для Shopify приложения

## 1. Развертывание на Railway

### Шаг 1: Подключение к Railway
```bash
# Установите Railway CLI если еще не установлен
npm install -g @railway/cli

# Войдите в аккаунт Railway
railway login

# Создайте новый проект
railway init

# Или подключитесь к существующему проекту
railway link
```

### Шаг 2: Настройка базы данных
```bash
# Добавьте PostgreSQL в ваш Railway проект
railway add postgresql

# Получите URL базы данных
railway variables
```

### Шаг 3: Настройка переменных окружения
Добавьте следующие переменные в Railway Dashboard:

```env
# Database (Railway автоматически создаст DATABASE_URL)
# DATABASE_URL="postgresql://postgres:password@host:port/database"

# Shopify App Configuration
SHOPIFY_API_KEY=dc0b0520ad9dbf1b00ab7727ee807509
SHOPIFY_API_SECRET=25b5f3548f38b154e1dad60a2eb18f75
SCOPES="read_discounts,read_orders,read_products,read_themes,write_discounts,write_orders,write_products,write_themes"
SHOPIFY_APP_URL="https://your-railway-app.railway.app"

# Production
NODE_ENV="production"
HOST="0.0.0.0"
PORT="3000"
```

### Шаг 4: Развертывание
```bash
# Разверните приложение
railway up

# Или через Git
git push railway main
```

## 2. Обновление конфигурации Shopify

### Шаг 1: Получите URL вашего Railway приложения
После развертывания Railway предоставит URL вида: `https://your-app-name.railway.app`

### Шаг 2: Обновите конфигурацию приложения
Замените `your-railway-app.railway.app` в файле `shopify.app.production.toml` на ваш реальный URL.

### Шаг 3: Обновите настройки в Shopify Partner Dashboard
1. Перейдите в [Shopify Partner Dashboard](https://partners.shopify.com)
2. Выберите ваше приложение
3. Обновите следующие URL:
   - **App URL**: `https://your-railway-app.railway.app`
   - **Allowed redirection URLs**:
     - `https://your-railway-app.railway.app/auth/callback`
     - `https://your-railway-app.railway.app/auth/shopify/callback`
     - `https://your-railway-app.railway.app/api/auth/callback`

### Шаг 4: Обновите webhooks (если используются)
В Shopify Partner Dashboard обновите URL webhooks на ваш Railway URL.

## 3. Проверка работы

### Локальное тестирование с продакшн конфигурацией
```bash
# Используйте продакшн конфигурацию
shopify app dev --config=shopify.app.production.toml
```

### Проверка в браузере
1. Откройте ваш Railway URL
2. Убедитесь, что приложение загружается
3. Проверьте аутентификацию с Shopify

## 4. Полезные команды Railway

```bash
# Просмотр логов
railway logs

# Просмотр переменных окружения
railway variables

# Подключение к базе данных
railway connect postgresql

# Перезапуск сервиса
railway redeploy
```

## 5. Troubleshooting

### Проблема: Приложение не запускается
- Проверьте логи: `railway logs`
- Убедитесь, что все переменные окружения настроены
- Проверьте, что DATABASE_URL корректный

### Проблема: Ошибки базы данных
- Убедитесь, что PostgreSQL добавлен в проект
- Проверьте миграции: `railway run npx prisma migrate deploy`

### Проблема: Shopify не может подключиться
- Проверьте, что URL в Shopify Partner Dashboard обновлен
- Убедитесь, что HTTPS работает (Railway предоставляет SSL автоматически)
