# Архитектура Funnel Discounts App

## Общая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHOPIFY STORE                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Admin Panel   │    │  Theme Extension│    │   Cart      │ │
│  │   (Remix App)   │    │   (Liquid)      │    │             │ │
│  │                 │    │                 │    │             │ │
│  │ • Create Funnels│    │ • Show Banner   │    │ • Apply     │ │
│  │ • Manage Products│   │ • Product Page  │    │   Discounts │ │
│  │ • View Analytics│    │ • Dynamic Info  │    │ • Calculate │ │
│  └─────────────────┘    └─────────────────┘    │   Totals    │ │
│           │                       │             └─────────────┘ │
│           │                       │                     │       │
│           ▼                       ▼                     ▼       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                SHOPIFY METAFIELDS                          │ │
│  │  • funnel_discounts.funnels (JSON)                        │ │
│  │  • funnel_discounts.analytics (JSON)                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│           │                       │                     │       │
│           ▼                       ▼                     ▼       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              SHOPIFY DISCOUNT FUNCTION                     │ │
│  │  • Reads funnel data from metafields                      │ │
│  │  • Calculates discounts based on cart contents            │ │
│  │  • Applies percentage discounts to qualifying items       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Компоненты системы

### 1. Admin Panel (Remix App)

**Файл**: `app/routes/app._index.tsx`

**Функции**:

- Создание и управление воронками
- Выбор товаров для воронок
- Настройка уровней скидок
- Просмотр аналитики

**Технологии**:

- Remix (React framework)
- Polaris UI (Shopify design system)
- GraphQL API для работы с Shopify

### 2. Theme Extension

**Файл**: `extensions/theme-extension/blocks/discount_banner.liquid`

**Функции**:

- Отображение баннера на странице товара
- Динамическая информация о скидках
- Адаптивный дизайн

**Технологии**:

- Liquid templating
- CSS для стилизации
- Shopify metafields для данных

### 3. Discount Function

**Файл**: `extensions/discount-function/src/cart_lines_discounts_generate_run.ts`

**Функции**:

- Чтение данных воронок из metafields
- Расчет скидок на основе количества товаров
- Применение скидок к товарам в корзине

**Технологии**:

- TypeScript
- Shopify Discount Functions API
- GraphQL для получения данных

### 4. Analytics Dashboard

**Файл**: `app/routes/app.analytics.tsx`

**Функции**:

- Отображение статистики по воронкам
- Анализ эффективности скидок
- Просмотр недавних заказов

## Поток данных

### 1. Создание воронки

```
Admin Panel → GraphQL Mutation → Shopify Metafields
```

### 2. Отображение баннера

```
Product Page → Theme Extension → Metafields → Banner Display
```

### 3. Применение скидок

```
Cart Update → Discount Function → Metafields → Discount Calculation → Cart Update
```

### 4. Аналитика

```
Analytics Page → GraphQL Query → Metafields → Statistics Display
```

## Структура данных

### Funnel Object

```typescript
interface Funnel {
  id: string;
  name: string;
  products: string[]; // Product IDs
  banner_text: string;
  discount_settings: {
    quantity_tiers: Array<{
      min_quantity: number;
      discount_percentage: number;
    }>;
    max_discount: number;
  };
  created_at: string;
  updated_at: string;
}
```

### Metafields

- **Namespace**: `funnel_discounts`
- **Key**: `funnels`
- **Type**: `json`
- **Value**: Array of Funnel objects

## API Endpoints

### GraphQL Queries

- `getFunnels` - получение списка воронок
- `getProducts` - получение товаров для выбора
- `getOrders` - получение заказов для аналитики

### GraphQL Mutations

- `updateFunnelsMetafield` - сохранение воронок
- `metafieldsSet` - обновление metafields

## Безопасность

- Аутентификация через Shopify App Bridge
- Проверка разрешений (scopes)
- Валидация данных на сервере
- Безопасное хранение в Shopify Metafields

## Масштабируемость

- Использование Shopify инфраструктуры
- Кэширование через Shopify CDN
- Автоматическое масштабирование
- Оптимизация GraphQL запросов
