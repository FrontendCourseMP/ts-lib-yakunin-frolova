// **
//  * Базовый валидатор форм ValiGuard.
//  *
//  * Пример использования:
//  *   const validator = new ValiGuard(formElement);
//  *   validator.addField('email', { required: true, type: 'string' });
//  *   const result = validator.validate();
//  */
export default class ValiGuard {
  /**
   * @param {HTMLFormElement} form
   * @param {{ suppressWarnings?: boolean }} [options]
   */
  constructor(form, options = {}) {
    if (!(form instanceof HTMLFormElement)) {
      throw new Error('ValiGuard: form должен быть HTMLFormElement');
    }

    this.form = /** @type {HTMLFormElement} */ (form);
    this.options = {
      suppressWarnings: false,
      ...options,
    };

    /**
     * Карта настроек полей: name -> { elements, label, errorEl, rules }
     * @type {Map<string, {
     *   elements: HTMLElement[],
     *   label: HTMLLabelElement | null,
     *   errorEl: HTMLElement | null,
     *   rules?: any
     * }>}
     */
    this.fields = new Map();

    this._scanForm();
  }

  /**
   * Находит все поля формы, связанные label и контейнеры ошибок.
   * Поля группируются по атрибуту name (особенно важно для чекбоксов).
   * @private
   */
  _scanForm() {
    const inputs = Array.from(
      this.form.querySelectorAll('input, textarea, select')
    );

    for (const input of inputs) {
      if (!(input instanceof HTMLElement)) continue;

      const name = input.getAttribute('name');
      if (!name) {
        if (!this.options.suppressWarnings) {
          console.warn('ValiGuard: поле без name будет пропущено', input);
        }
        continue;
      }

      // Ищем label: сначала по for=, потом родительский <label>
      /** @type {HTMLLabelElement | null} */
      let label = null;
      const id = input.getAttribute('id');
      if (id) {
        label =
          this.form.querySelector(`label[for="${CSS.escape(id)}"]`) ||
          null;
      }
      if (!label) {
        const closestLabel = input.closest('label');
        if (closestLabel instanceof HTMLLabelElement) {
          label = closestLabel;
        }
      }

      // Ищем/создаём контейнер для ошибки
      /** @type {HTMLElement | null} */
      let errorEl = null;

      // 1. data-атрибут
      errorEl =
        this.form.querySelector(
          `[data-valiguard-error-for="${CSS.escape(name)}"]`
        ) || null;

      // 2. Следующий элемент после label или самого поля
      if (!errorEl) {
        const base = label || input;
        const next = base.nextElementSibling;
        if (next instanceof HTMLElement) {
          errorEl = next;
        }
      }

      // 3. Если не нашли — создаём <div> после поля
      if (!errorEl) {
        if (!this.options.suppressWarnings) {
          console.warn(
            'ValiGuard: не найден контейнер ошибки, создаю автоматически для поля:',
            input
          );
        }
        const div = document.createElement('div');
        div.className = 'valiguard-error';
        div.setAttribute('aria-live', 'polite');
        input.insertAdjacentElement('afterend', div);
        errorEl = div;
      }

      const existing = this.fields.get(name);
      if (existing) {
        existing.elements.push(input);
      } else {
        this.fields.set(name, {
          elements: [input],
          label,
          errorEl,
        });
      }
    }
  }

  /**
   * Добавляет правила валидации для поля.
   * @param {string} name
   * @param {any} rules
   */
  addField(name, rules) {
    const field = this.fields.get(name);
    if (!field) {
      if (!this.options.suppressWarnings) {
        console.warn(
          `ValiGuard: попытка добавить правила для несуществующего поля "${name}"`
        );
      }
      return;
    }

    // Простая проверка конфликтов с HTML-атрибутами (required)
    const hasRequiredAttr = field.elements.some((el) =>
      el.hasAttribute('required')
    );
    if (
      hasRequiredAttr &&
      rules &&
      Object.prototype.hasOwnProperty.call(rules, 'required') &&
      rules.required === false &&
      !this.options.suppressWarnings
    ) {
      console.warn(
        `ValiGuard: конфликт правил required для поля "${name}" между HTML-атрибутами и JS-правилами`
      );
    }

    field.rules = rules;
  }

  /**
   * Валидирует все зарегистрированные поля.
   * @returns {{ isValid: boolean, errors: Record<string, string | null> }}
   */
  validate() {
    /** @type {Record<string, string | null>} */
    const errors = {};
    let isValid = true;

    for (const [name, field] of this.fields.entries()) {
      const message = this._validateField(name, field);
      errors[name] = message;

      if (field.errorEl) {
        field.errorEl.textContent = message || '';
      }

      if (message) {
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  /**
   * Валидирует одно поле.
   * @private
   * @param {string} name
   * @param {{ elements: HTMLElement[], label: HTMLLabelElement | null, errorEl: HTMLElement | null, rules?: any }} field
   * @returns {string | null} сообщение об ошибке или null
   */
  _validateField(name, field) {
    const rules = field.rules || {};

    // Объединяем значения: для одиночных полей берём одно значение, для чекбоксов — массив.
    const first = /** @type {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} */ (
      field.elements[0]
    );
    const type = first.type;

    let value = first.value;

    // Группа чекбоксов
    if (type === 'checkbox') {
      const checked = field.elements.filter(
        (el) => /** @type {HTMLInputElement} */ (el).checked
      );
      value = checked.map((el) => /** @type {HTMLInputElement} */ (el).value);
    }

    // 1. required: уважаем и правило, и HTML-атрибут
    const requiredByAttr = field.elements.some((el) =>
      el.hasAttribute('required')
    );
    const requiredByRule = !!rules.required;
    const isRequired = requiredByAttr || requiredByRule;

    if (isRequired) {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return (
            rules?.messages?.required ||
            `Поле "${name}" обязательно для заполнения`
          );
        }
      } else if (!value || value.toString().trim() === '') {
        return (
          rules?.messages?.required ||
          `Поле "${name}" обязательно для заполнения`
        );
      }
    }

    // 2. Строки
    if (!Array.isArray(value)) {
      const str = value.toString();

      if (typeof rules.minLength === 'number' && str.length < rules.minLength) {
        return (
          rules?.messages?.minLength ||
          `Минимальная длина для "${name}" — ${rules.minLength} символов`
        );
      }

      if (typeof rules.maxLength === 'number' && str.length > rules.maxLength) {
        return (
          rules?.messages?.maxLength ||
          `Максимальная длина для "${name}" — ${rules.maxLength} символов`
        );
      }

      if (rules.pattern instanceof RegExp && !rules.pattern.test(str)) {
        return (
          rules?.messages?.pattern ||
          `Значение поля "${name}" имеет неверный формат`
        );
      }

      if (type === 'number' || rules.type === 'number') {
        const num = Number(str);
        if (Number.isNaN(num)) {
          return (
            rules?.messages?.number || `Поле "${name}" должно быть числом`
          );
        }

        const minAttr = first.getAttribute('min');
        const maxAttr = first.getAttribute('max');

        const min = rules.min ?? (minAttr != null ? Number(minAttr) : null);
        const max = rules.max ?? (maxAttr != null ? Number(maxAttr) : null);

        if (min != null && num < min) {
          return (
            rules?.messages?.min ||
            `Значение поля "${name}" не может быть меньше ${min}`
          );
        }
        if (max != null && num > max) {
          return (
            rules?.messages?.max ||
            `Значение поля "${name}" не может быть больше ${max}`
          );
        }
      }
    } else {
      // 3. Массивы (чекбоксы)
      if (
        typeof rules.minItems === 'number' &&
        value.length < rules.minItems
      ) {
        return (
          rules?.messages?.minItems ||
          `Нужно выбрать минимум ${rules.minItems} значений в поле "${name}"`
        );
      }
      if (
        typeof rules.maxItems === 'number' &&
        value.length > rules.maxItems
      ) {
        return (
          rules?.messages?.maxItems ||
          `Можно выбрать максимум ${rules.maxItems} значений в поле "${name}"`
        );
      }
    }

    // 4. Кастомный валидатор
    if (typeof rules.validator === 'function') {
      const result = rules.validator(value, { name, field });
      if (result === false) {
        return rules?.messages?.custom || `Поле "${name}" заполнено неверно`;
      }
      if (typeof result === 'string') {
        return result;
      }
    }

    return null;
  }
}



