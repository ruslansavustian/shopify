# Быстрый старт: Баннеры скидок

## Что у вас есть

✅ **Админ-панель** - создание и управление воронками  
✅ **Theme Extension** - баннеры для отображения на сайте  
✅ **Discount Function** - автоматическое применение скидок

## Что нужно сделать

### 1. Установка Theme Extension

```bash
# В корне проекта
shopify app deploy
```

### 2. Добавление баннера в тему

#### Вариант A: Через админку темы

1. Откройте админку Shopify
2. Перейдите в Online Store → Themes
3. Нажмите "Customize" на активной теме
4. Откройте страницу продукта
5. Добавьте блок "Funnel Discount Banner"

#### Вариант B: Через код темы

Добавьте в `templates/product.liquid`:

```liquid
{% comment %} После заголовка продукта {% endcomment %}
{% render 'funnel-discount-banner', product: product %}
```

### 3. Создание воронки

1. Откройте приложение в админке Shopify
2. Нажмите "Create New Funnel"
3. Заполните данные:
   - **Name**: "Summer Sale"
   - **Banner Text**: "Special Summer Discount!"
   - **Products**: Выберите товары
   - **Quantity Tiers**:
     - 2+ items = 10% off
     - 5+ items = 20% off

### 4. Проверка работы

1. Откройте страницу товара из воронки
2. Должен появиться баннер с текстом скидки
3. Добавьте товар в корзину
4. Скидка должна примениться автоматически

## Стили баннеров

### Базовый баннер

```liquid
{% render 'funnel-discount-banner', product: product %}
```

### Компактный баннер

```liquid
{% render 'funnel-discount-banner', product: product, style: 'compact' %}
```

### Встроенный баннер

```liquid
{% render 'funnel-discount-banner', product: product, style: 'inline' %}
```

## Где размещать баннеры

### 1. Страница продукта

```liquid
<div class="product-header">
  <h1>{{ product.title }}</h1>
  {% render 'funnel-discount-banner', product: product %}
  <div class="price">{{ product.price | money }}</div>
</div>
```

### 2. Корзина

```liquid
{% for item in cart.items %}
  <div class="cart-item">
    <h3>{{ item.title }}</h3>
    {% render 'funnel-discount-banner', product: item.product, style: 'compact' %}
  </div>
{% endfor %}
```

### 3. Список товаров

```liquid
{% for product in collection.products %}
  <div class="product-card">
    <h3>{{ product.title }}</h3>
    {% render 'funnel-discount-banner', product: product, style: 'inline' %}
  </div>
{% endfor %}
```

## Настройка внешнего вида

### CSS переменные

```css
:root {
  --funnel-banner-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --funnel-banner-text: white;
  --funnel-banner-radius: 8px;
}
```

### Кастомные стили

```css
.funnel-discount-banner {
  background: var(--funnel-banner-bg) !important;
  color: var(--funnel-banner-text) !important;
  border-radius: var(--funnel-banner-radius) !important;
}
```

## Решение проблем

### Баннер не появляется

1. Проверьте, что товар добавлен в воронку
2. Убедитесь, что Theme Extension установлен
3. Проверьте консоль браузера на ошибки

### Скидки не применяются

1. Проверьте настройки Discount Function
2. Убедитесь, что воронка активна
3. Проверьте количество товаров в корзине

### Стили не применяются

1. Проверьте CSS специфичность
2. Убедитесь, что стили загружаются после баннера
3. Используйте `!important` при необходимости

## Дополнительные возможности

### Продвинутый баннер

```liquid
{% comment %} Вместо базового блока {% endcomment %}
{% section 'advanced-discount-banner' %}
```

### JavaScript интеграция

```javascript
// Обновление баннеров при изменении корзины
document.addEventListener("cart:updated", function () {
  // Перезагружаем баннеры
  location.reload();
});
```

## Поддержка

- 📖 [Полная документация](extensions/theme-extension/README.md)
- 🔧 [Примеры интеграции](extensions/theme-extension/examples/integration-examples.liquid)
- 🏗️ [Архитектура проекта](ARCHITECTURE_DIAGRAM.md)
