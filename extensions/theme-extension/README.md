# Funnel Discounts Theme Extension

Это расширение для темы Shopify, которое отображает динамические баннеры скидок на основе воронок продаж.

## Компоненты

### 1. Блоки (Blocks)

#### `discount_banner.liquid`

Основной блок для отображения баннера скидок. Может быть добавлен в любую секцию темы.

**Использование:**

- Добавьте блок "Funnel Discount Banner" в секцию продукта
- Баннер автоматически появится для товаров, включенных в воронки

#### `advanced_discount_banner.liquid`

Продвинутый блок с дополнительными функциями:

- Отслеживание прогресса до следующего уровня скидки
- Прогресс-бар
- Анимации
- Отображение всех уровней скидок

**Использование:**

- Добавьте блок "Advanced Funnel Discount Banner" в секцию продукта
- Настройте параметры в админке темы

### 2. Сниппеты (Snippets)

#### `funnel-discount-banner.liquid`

Универсальный сниппет для отображения баннера в любом месте темы.

**Использование:**

```liquid
{% comment %} Базовый баннер {% endcomment %}
{% render 'funnel-discount-banner', product: product %}

{% comment %} Компактный баннер {% endcomment %}
{% render 'funnel-discount-banner', product: product, style: 'compact' %}

{% comment %} Встроенный баннер {% endcomment %}
{% render 'funnel-discount-banner', product: product, style: 'inline' %}
```

## Стили баннеров

### 1. Default (По умолчанию)

- Полноразмерный баннер с градиентом
- Иконка и текст
- Тень и скругленные углы

### 2. Compact (Компактный)

- Меньший размер
- Минималистичный дизайн
- Подходит для ограниченного пространства

### 3. Inline (Встроенный)

- Очень маленький размер
- Встраивается в текст
- Подходит для заголовков или описаний

## Настройки

### Параметры блока

- **Banner Text** - текст баннера (переопределяется настройками воронки)
- **Banner Color** - цвет фона баннера
- **Show Animation** - показывать анимации
- **Show Progress** - показывать прогресс-бар (только для advanced)
- **Show Tiers** - показывать уровни скидок (только для advanced)

## Логика работы

1. Баннер проверяет, включен ли товар в какую-либо воронку
2. Если товар в воронке, баннер получает данные о скидках
3. Проверяется текущее количество товаров в корзине
4. Определяется текущий и следующий уровень скидки
5. Отображается соответствующая информация

## Интеграция с темой

### В product.liquid

```liquid
{% comment %} В секции продукта {% endcomment %}
{% section 'product' %}

{% comment %} Или используйте сниппет {% endcomment %}
{% render 'funnel-discount-banner', product: product %}
```

### В cart.liquid

```liquid
{% comment %} В корзине для отслеживания прогресса {% endcomment %}
{% for item in cart.items %}
  {% render 'funnel-discount-banner', product: item.product, style: 'compact' %}
{% endfor %}
```

### В collection.liquid

```liquid
{% comment %} В списке товаров {% endcomment %}
{% for product in collection.products %}
  <div class="product-item">
    <!-- Товар -->
    {% render 'funnel-discount-banner', product: product, style: 'inline' %}
  </div>
{% endfor %}
```

## Кастомизация

### CSS переменные

```css
:root {
  --funnel-banner-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --funnel-banner-text: white;
  --funnel-banner-radius: 8px;
  --funnel-banner-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
```

### Переопределение стилей

```css
.funnel-discount-banner {
  background: var(--funnel-banner-bg) !important;
  color: var(--funnel-banner-text) !important;
  border-radius: var(--funnel-banner-radius) !important;
  box-shadow: var(--funnel-banner-shadow) !important;
}
```

## Требования

- Shopify Plus или Shopify Advanced
- Приложение Funnel Discounts установлено и настроено
- Товары добавлены в воронки через админ-панель

## Поддержка

При возникновении проблем проверьте:

1. Установлено ли приложение Funnel Discounts
2. Настроены ли воронки в админ-панели
3. Добавлены ли товары в воронки
4. Корректно ли работает метаполе `funnel_discounts.funnels`
