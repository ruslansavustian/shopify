# Funnel Discounts App

Shopify приложение для создания системы скидок на основе воронок продаж.

## Основные функции

### Customer Side

- Динамический баннер на странице товара
- Автоматическое применение скидок

### Admin Side

- Dashboard со списком воронок
- Создание и удаление воронок
- Настройка товаров и скидок
- Аналитика продаж

## Технологии

- Shopify Remix Template
- Shopify Theme Extension
- Shopify Discount Function
- Shopify Metafields
- Shopify Polaris UI

## Установка

1. Установите зависимости:

```bash
npm install
```

2. Войдите в Shopify CLI:

```bash
shopify auth login
```

3. Запустите приложение:

```bash
npm run dev
```

## Использование

### Админ-панель

1. Создайте воронку через админ панель
2. Выберите товары для воронки
3. Настройте уровни скидок
4. Добавьте текст для баннера

### Интеграция в тему

1. Установите Theme Extension в ваш магазин
2. Добавьте блок "Funnel Discount Banner" в секцию продукта
3. Или используйте сниппет `funnel-discount-banner` в любом месте темы

### Доступные компоненты

- **discount_banner.liquid** - базовый блок баннера
- **advanced_discount_banner.liquid** - продвинутый блок с прогресс-баром
- **funnel-discount-banner.liquid** - универсальный сниппет

### Стили баннеров

- `default` - полноразмерный баннер
- `compact` - компактный баннер
- `inline` - встроенный баннер

### Примеры использования

```liquid
{% comment %} Базовый баннер {% endcomment %}
{% render 'funnel-discount-banner', product: product %}

{% comment %} Компактный баннер {% endcomment %}
{% render 'funnel-discount-banner', product: product, style: 'compact' %}

{% comment %} Встроенный баннер {% endcomment %}
{% render 'funnel-discount-banner', product: product, style: 'inline' %}
```

## Автоматические функции

- Баннер автоматически появится на страницах товаров из воронок
- Скидки будут применяться автоматически в корзине
- Отслеживание прогресса до следующего уровня скидки
