# 🚀 Funnel Discounts App - Інструкція для розробника

## 📋 Огляд проекту

Це Shopify додаток для створення воронок знижок з аналітикою. Додаток дозволяє:

- Створювати воронки знижок
- Відстежувати ефективність воронок
- Збирати аналітику по заказах та знижках
- Відображати статистику в адмін-панелі

## 🛠 Технологічний стек

- **Frontend**: Remix + React + TypeScript
- **Backend**: Node.js + Prisma ORM
- **База даних**: PostgreSQL (Railway)
- **UI**: Shopify Polaris
- **Deployment**: Локальна разрабка
- **Контейнеризація**: Не використовується (Railway PostgreSQL)
- **Туннелі**: Ngrok для локальної розробки

## 🚀 Швидкий старт

### 1. Встановлення залежностей

```bash
npm install
```

### 2. Налаштування бази даних

**Варіант A: Railway PostgreSQL (рекомендовано)**

```bash
# 1. Створіть PostgreSQL на Railway
# 2. Скопіюйте DATABASE_URL з Railway
# 3. Додайте в .env файл
```

**Варіант B: Локальний SQLite (якщо потрібно)**

```bash
# Використовувати SQLite замість PostgreSQL
# В .env встановіть: DATABASE_URL=file:./dev.db
```

### 3. Налаштування змінних середовища

```bash
# Скопіюйте приклад файлу
cp env.example .env

# Відредагуйте файл з вашими значеннями
nano .env
```

### 4. Запуск додатку

```bash
shopify app dev --use-localhost
```

**Готово!** 🎉 Додаток запуститься автоматично з усіма необхідними налаштуваннями.

### Запуск на конкретному порту

```bash
# Через параметр CLI (рекомендовано)
shopify app dev --use-localhost --localhost-port=3000

# Через переменную окружения (може не працювати з Shopify CLI)
PORT=3000 shopify app dev --use-localhost

# Використання npm скриптів
npm run dev        # порт 3000
npm run dev:port   # порт 8080
```

### Додаткові кроки (якщо потрібно)

#### Запуск бази даних (Docker)

```bash
# Запустити PostgreSQL в Docker
docker-compose up -d postgres
```

#### Налаштування бази даних

```bash
# Для PostgreSQL (продакшн/розробка)
npm run db:postgres

# Запуск міграцій
npx prisma migrate dev

# Генерація Prisma клієнта
npx prisma generate
```

## 🔧 Режими розробки

### 1. Localhost розробка (основний)

```bash
# За замовчуванням (Remix на випадковому порту)
shopify app dev --use-localhost

# Настроїти порт прокси (не впливає на ngrok)
shopify app dev --use-localhost --localhost-port=3000

# Використання npm скриптів
npm run dev        # Remix на випадковому порту
npm run dev:port   # Remix на випадковому порту
```

- Запускає додаток на localhost
- Потребує ручного налаштування вебхуків
- Найпростіший спосіб для розробки
- **Для ngrok використовуйте порт Remix з логу!**

### 2. Стандартна розробка (з туннелем)

```bash
npm run dev
```

- Використовує вбудований туннель Shopify
- Автоматично налаштовує вебхуки
- Для тестування зовнішніх інтеграцій

### 3. Localhost + Ngrok (для вебхуків)

```bash
# Термінал 1: Запуск додатку
shopify app dev --use-localhost

# Термінал 2: Запуск ngrok (замініть PORT на реальний порт)
ngrok http PORT
```

## 🔗 Налаштування вебхуків

### Для localhost розробки (основний випадок)

1. **Запустіть додаток**:

   ```bash
   shopify app dev --use-localhost
   ```

2. **Запустіть ngrok** (в окремому терміналі):

   ```bash
   # Використовуйте порт Remix (обов'язково!)
   # З логу: "Local: http://localhost:34595/"
   ngrok http 34595

   # Прокси порт НЕ працює з ngrok!
   # З логу: "Proxy server started on port 3000" - НЕ використовуйте
   ```

3. **Оновіть вебхук в Shopify Admin**:
   - Перейдіть в: `ruslan-dev-store.myshopify.com/admin/settings/notifications`
   - Знайдіть вебхук `orders/paid` та оновіть URL на: `YOUR_NGROK_URL/webhooks/orders/paid`

### Для стандартної розробки

```bash
npm run dev
```

## 📊 Структура проекту

```
app/
├── components/          # React компоненти
│   ├── AnalyticsDisplay.tsx
│   ├── CreateFunnelPage.tsx
│   ├── DeleteFunnelModal.tsx
│   └── FunnelTable.tsx
├── lib/                 # Серверна логіка
│   ├── analytics.server.ts
│   └── graphql.ts
├── routes/              # Remix маршрути
│   ├── app._index.tsx
│   ├── app.analytics.tsx
│   ├── app.create-funnel.tsx
│   ├── app.edit-funnel.$id.tsx
│   └── webhooks.orders.paid.ts
├── styles/              # CSS стилі
└── types.ts            # TypeScript типи

extensions/
├── discount-function/   # Shopify Function для знижок
└── theme-extension/     # Тема-розширення

prisma/
├── schema.prisma        # Схема бази даних
└── migrations/          # Міграції БД
```

## 🗄 База даних

### Основні таблиці:

- `Session` - сесії користувачів Shopify
- `OrderAnalytics` - аналітика заказів зі знижками
- `FunnelPerformance` - продуктивність воронок знижок
- `ShopAnalytics` - загальна аналітика магазину

### Структура таблиць:

- **OrderAnalytics**: orderId, orderName, shopDomain, customerEmail, discountAmount, totalAmount, lineItemsCount, funnelId, funnelName
- **FunnelPerformance**: funnelId, funnelName, shopDomain, discountsIssued, totalDiscountAmount, ordersAffected, conversionRate
- **ShopAnalytics**: shopDomain, totalDiscountsIssued, totalDiscountAmount, totalOrders, totalSales
- **Session**: shop, accessToken, userId, email, scope (для авторизації Shopify)

### Міграції:

```bash
# Створити нову міграцію
npx prisma migrate dev --name your_migration_name

# Застосувати міграції
npx prisma migrate deploy

# Скинути базу даних
npx prisma migrate reset
```

## 🔄 Цикл розробки

### 1. Розробка функціоналу

```bash
# Запустити в режимі розробки
npm run dev

# Або для тестування вебхуків
npm run dev:ngrok
```

### 2. Тестування

- Створіть тестовий заказ в dev store
- Перевірте роботу вебхуків
- Переконайтеся, що аналітика зберігається
- Протестуйте UI компоненти

### 3. Деплой

```bash
# Збірка для продакшну
npm run build

# Деплой на Railway
npm run deploy
```

## 🐛 Налагодження

### Вебхуки не працюють?

1. Перевірте, чи доступний URL додатку
2. Переконайтеся, що вебхуки налаштовані в Shopify Admin
3. Перевірте логи доставки вебхуків в Shopify Admin
4. Переконайтеся, що додаток запущений та доступний

### Проблеми з базою даних?

1. Перевірте підключення до БД
2. Запустіть міграції: `npx prisma migrate dev`
3. Перегенеруйте клієнт: `npx prisma generate`

### Ngrok URL змінився?

1. Запустіть `npm run dev:ngrok` знову
2. Оновіть URL вебхуків в Shopify Admin з новим ngrok URL

## 📝 Основні команди

```bash
# Розробка
npm run dev                        # Remix на випадковому порту
npm run dev:localhost              # За замовчуванням
npm run dev:port                   # Remix на випадковому порту
shopify app dev                    # З туннелем (автоматичні вебхуки)

# База даних
npx prisma studio                  # Відкрити Prisma Studio
npx prisma migrate dev             # Запустити міграції

# Збірка
npm run build                      # Збірка проекту
```

## 🔧 Налаштування середовища

### Важливо про NODE_ENV:

- **Development**: `NODE_ENV=development` - для локальної розробки
- **Production**: `NODE_ENV=production` - для продакшн деплою
- Це впливає на встановлення залежностей (`npm ci --omit=dev`)

### Підключення до бази:

```bash
# Через Prisma Studio
npx prisma studio

# Пряме підключення до Railway PostgreSQL
PGPASSWORD=your_password psql -h switchback.proxy.rlwy.net -U postgres -p 43480 -d railway
```

## 🔐 Змінні середовища

### 1. Створіть файл `.env`

```bash
# Скопіюйте приклад файлу
cp env.example .env

# Відредагуйте файл з вашими значеннями
nano .env
```

### 2. Налаштуйте змінні

```env
# База даних (Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/funnel_dev"

# Shopify
SHOPIFY_API_KEY="your_api_key"
SHOPIFY_API_SECRET="your_api_secret"
SCOPES="write_products,read_products,write_discounts,read_discounts,write_orders,read_orders,write_themes,read_themes"

# Додаток
SHOPIFY_APP_URL="https://your-app.railway.app"

# Environment (важливо для Docker)
NODE_ENV="development"
```

### 3. Отримайте значення з Shopify Partners

- `SHOPIFY_API_KEY` та `SHOPIFY_API_SECRET` - з [partners.shopify.com](https://partners.shopify.com)
- `SHOPIFY_APP_URL` - URL для локальної розробки (наприклад, `https://localhost:3000`)

## 📚 Додаткові ресурси

- [Shopify App Development](https://shopify.dev/docs/apps)
- [Remix Documentation](https://remix.run/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Shopify Polaris](https://polaris.shopify.com/)

## 🤝 Підтримка

При виникненні проблем:

1. Перевірте логи в терміналі
2. Перегляньте цю документацію
3. Перевірте налаштування вебхуків в Shopify Admin
4. Переконайтеся, що всі залежності встановлені

---

**Примітка**: Цей додаток розроблений для Shopify Partners та потребує налаштування в Shopify Partners Dashboard.
