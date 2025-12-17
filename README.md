# ValiGuard

**ValiGuard** — это современный JavaScript-фреймворк для валидации HTML-форм, разработанный для обеспечения надежной проверки пользовательского ввода на стороне клиента. Фреймворк предоставляет простой и интуитивно понятный API для настройки правил валидации и автоматического отображения сообщений об ошибках.

## Содержание

- [Установка](#установка)
- [Быстрый старт](#быстрый-старт)
- [Основные возможности](#основные-возможности)
- [API Reference](#api-reference)
- [Примеры использования](#примеры-использования)
- [Конфигурация](#конфигурация)
- [Поддержка типов](#поддержка-типов)

## Установка

ValiGuard может быть использован как ES-модуль. Убедитесь, что ваш проект поддерживает ES-модули.

```javascript
import ValiGuard from './ValiGuard.js';
```

## Быстрый старт

Минимальный пример использования ValiGuard:

```html
<form id="myForm">
  <input type="text" name="email" />
  <div data-valiguard-error-for="email"></div>
  <button type="submit">Отправить</button>
</form>
```

```javascript
import ValiGuard from './ValiGuard.js';

const form = document.querySelector('#myForm');
const validator = new ValiGuard(form);

validator.addField('email', {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  messages: {
    required: 'Введите email',
    pattern: 'Email в неверном формате',
  },
});

form.addEventListener('submit', (event) => {
  const result = validator.validate();
  if (!result.isValid) {
    event.preventDefault();
  }
});
```

## Основные возможности

- ✅ **Автоматическое сканирование формы** — ValiGuard автоматически находит все поля формы по атрибуту `name`
- ✅ **Гибкая система правил** — поддержка обязательных полей, длины строк, числовых диапазонов, регулярных выражений
- ✅ **Работа с группами чекбоксов** — автоматическая обработка множественных значений
- ✅ **Интеграция с HTML-атрибутами** — поддержка нативных HTML-атрибутов (`required`, `min`, `max`)
- ✅ **Кастомные валидаторы** — возможность создания собственных функций валидации
- ✅ **Автоматическое отображение ошибок** — встроенная система поиска и создания контейнеров для сообщений об ошибках
- ✅ **Кастомизируемые сообщения** — полный контроль над текстом сообщений об ошибках
- ✅ **TypeScript поддержка** — включены типы для улучшения опыта разработки

## API Reference

### Конструктор

#### `new ValiGuard(form, options?)`

Создает новый экземпляр валидатора для указанной формы.

**Параметры:**

- `form` (HTMLFormElement) — обязательный. HTML-элемент формы, которую необходимо валидировать
- `options` (Object, опционально) — объект конфигурации:
  - `suppressWarnings` (boolean, по умолчанию `false`) — отключает предупреждения в консоли

**Возвращает:** экземпляр ValiGuard

**Выбрасывает:** `Error`, если переданный элемент не является `HTMLFormElement`

**Пример:**

```javascript
const form = document.querySelector('form');
const validator = new ValiGuard(form, { suppressWarnings: true });
```

### Методы

#### `addField(name, rules)`

Добавляет правила валидации для поля формы с указанным именем.

**Параметры:**

- `name` (string) — имя поля (значение атрибута `name`)
- `rules` (Object) — объект с правилами валидации (см. [Правила валидации](#правила-валидации))

**Возвращает:** `void`

**Примечание:** Если поле с указанным именем не найдено в форме, метод выведет предупреждение в консоль (если `suppressWarnings` не установлен в `true`).

**Пример:**

```javascript
validator.addField('email', {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
});
```

#### `validate()`

Выполняет валидацию всех зарегистрированных полей формы.

**Параметры:** отсутствуют

**Возвращает:** объект с результатами валидации:
- `isValid` (boolean) — `true`, если все поля валидны, иначе `false`
- `errors` (Record<string, string | null>) — объект, где ключи — имена полей, значения — сообщения об ошибках или `null`, если поле валидно

**Пример:**

```javascript
const result = validator.validate();
if (result.isValid) {
  console.log('Форма валидна!');
} else {
  console.log('Ошибки:', result.errors);
}
```

### Правила валидации

Объект `rules` может содержать следующие свойства:

#### Общие правила

- `required` (boolean) — поле обязательно для заполнения. Также учитывается HTML-атрибут `required`
- `type` (string) — тип данных: `'string'`, `'number'`, `'array'`

#### Правила для строковых полей

- `minLength` (number) — минимальная длина строки
- `maxLength` (number) — максимальная длина строки
- `pattern` (RegExp) — регулярное выражение для проверки формата

#### Правила для числовых полей

- `min` (number) — минимальное значение. Также учитывается HTML-атрибут `min`
- `max` (number) — максимальное значение. Также учитывается HTML-атрибут `max`

#### Правила для массивов (группы чекбоксов)

- `minItems` (number) — минимальное количество выбранных элементов
- `maxItems` (number) — максимальное количество выбранных элементов

#### Кастомная валидация

- `validator` (function) — пользовательская функция валидации:
  ```javascript
  validator: (value, context) => {
    // value — значение поля
    // context — { name: string, field: object }
    // Возвращает: true (валидно), false (невалидно), string (сообщение об ошибке)
    return value.length > 5 ? true : 'Значение слишком короткое';
  }
  ```

#### Кастомные сообщения об ошибках

- `messages` (Object) — объект с пользовательскими сообщениями:
  ```javascript
  messages: {
    required: 'Поле обязательно для заполнения',
    minLength: 'Минимальная длина — 3 символа',
    maxLength: 'Максимальная длина — 50 символов',
    pattern: 'Неверный формат',
    number: 'Должно быть числом',
    min: 'Значение слишком мало',
    max: 'Значение слишком велико',
    minItems: 'Выберите минимум 1 элемент',
    maxItems: 'Выберите максимум 5 элементов',
    custom: 'Кастомное сообщение об ошибке',
  }
  ```

## Примеры использования

### Пример 1: Валидация формы регистрации

```html
<form id="registrationForm">
  <div>
    <label for="username">Имя пользователя</label>
    <input type="text" id="username" name="username" />
    <div data-valiguard-error-for="username"></div>
  </div>

  <div>
    <label for="email">Email</label>
    <input type="email" id="email" name="email" />
    <div data-valiguard-error-for="email"></div>
  </div>

  <div>
    <label for="age">Возраст</label>
    <input type="number" id="age" name="age" min="18" max="120" />
    <div data-valiguard-error-for="age"></div>
  </div>

  <button type="submit">Зарегистрироваться</button>
</form>
```

```javascript
const form = document.querySelector('#registrationForm');
const validator = new ValiGuard(form);

validator.addField('username', {
  required: true,
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/,
  messages: {
    required: 'Введите имя пользователя',
    minLength: 'Имя должно быть не короче 3 символов',
    maxLength: 'Имя должно быть не длиннее 20 символов',
    pattern: 'Используйте только буквы, цифры и подчеркивание',
  },
});

validator.addField('email', {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  messages: {
    required: 'Введите email',
    pattern: 'Email в неверном формате',
  },
});

validator.addField('age', {
  required: true,
  type: 'number',
  min: 18,
  max: 120,
  messages: {
    required: 'Введите возраст',
    number: 'Возраст должен быть числом',
    min: 'Возраст не может быть меньше 18',
    max: 'Возраст не может быть больше 120',
  },
});

form.addEventListener('submit', (event) => {
  const result = validator.validate();
  if (!result.isValid) {
    event.preventDefault();
    console.log('Ошибки валидации:', result.errors);
  }
});
```

### Пример 2: Валидация группы чекбоксов

```html
<form id="surveyForm">
  <fieldset>
    <legend>Выберите ваши интересы</legend>
    <label>
      <input type="checkbox" name="interests" value="programming" />
      Программирование
    </label>
    <label>
      <input type="checkbox" name="interests" value="design" />
      Дизайн
    </label>
    <label>
      <input type="checkbox" name="interests" value="music" />
      Музыка
    </label>
    <div data-valiguard-error-for="interests"></div>
  </fieldset>

  <button type="submit">Отправить</button>
</form>
```

```javascript
const form = document.querySelector('#surveyForm');
const validator = new ValiGuard(form);

validator.addField('interests', {
  minItems: 1,
  maxItems: 3,
  messages: {
    minItems: 'Выберите хотя бы один интерес',
    maxItems: 'Можно выбрать не более 3 интересов',
  },
});

form.addEventListener('submit', (event) => {
  const result = validator.validate();
  if (!result.isValid) {
    event.preventDefault();
  }
});
```

### Пример 3: Кастомная валидация

```javascript
validator.addField('password', {
  required: true,
  minLength: 8,
  validator: (value) => {
    if (!/[A-Z]/.test(value)) {
      return 'Пароль должен содержать хотя бы одну заглавную букву';
    }
    if (!/[0-9]/.test(value)) {
      return 'Пароль должен содержать хотя бы одну цифру';
    }
    return true;
  },
});
```

### Пример 4: Живая валидация (real-time validation)

```javascript
const form = document.querySelector('form');
const validator = new ValiGuard(form);

// Настройка правил
validator.addField('email', {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
});

// Валидация при изменении полей
const inputs = form.querySelectorAll('input, select, textarea');
inputs.forEach((input) => {
  input.addEventListener('input', () => {
    validator.validate();
  });
  input.addEventListener('change', () => {
    validator.validate();
  });
});
```

## Конфигурация

### Поиск контейнеров для ошибок

ValiGuard автоматически ищет контейнеры для отображения сообщений об ошибках в следующем порядке:

1. **Data-атрибут** — элемент с атрибутом `data-valiguard-error-for="имя_поля"`:
   ```html
   <input name="email" />
   <div data-valiguard-error-for="email"></div>
   ```

2. **Следующий элемент** — следующий элемент после `label` или самого поля:
   ```html
   <label>
     <input name="email" />
   </label>
   <div class="error"></div>
   ```

3. **Автоматическое создание** — если контейнер не найден, ValiGuard создаст `<div class="valiguard-error">` после поля автоматически.

### HTML-атрибуты

ValiGuard интегрируется с нативными HTML-атрибутами:

- `required` — поле становится обязательным
- `min` / `max` — для числовых полей устанавливают границы значений
- `name` — обязателен для всех полей, которые должны быть валидированы

**Важно:** Поля без атрибута `name` будут пропущены при сканировании формы.

## Поддержка типов

ValiGuard включает TypeScript определения типов. При использовании в TypeScript-проекте доступны следующие интерфейсы:

```typescript
interface ValiGuardOptions {
  suppressWarnings?: boolean;
}

interface ValiGuardRules {
  required?: boolean;
  type?: 'string' | 'number' | 'array' | string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  minItems?: number;
  maxItems?: number;
  validator?: (value: unknown, ctx: { name: string; field: unknown }) => boolean | string;
  messages?: ValiGuardMessages;
}

interface ValiGuardResult {
  isValid: boolean;
  errors: Record<string, string | null>;
}
```

## Заключение

ValiGuard предоставляет мощный и гибкий инструментарий для валидации HTML-форм с минимальными усилиями. Фреймворк разработан с учетом современных стандартов веб-разработки и обеспечивает удобный API для создания надежных форм с валидацией.

Для получения дополнительной информации и примеров использования обратитесь к исходному коду проекта.

---

**Авторы:** Фролова Ксения, Якунин (Kseniyafro, Edlnorog)
