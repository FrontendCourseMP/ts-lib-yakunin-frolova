/**
 * Базовый валидатор форм ValiGuard.
 */
export default class ValiGuard {
  constructor(form, options = {}) {
    if (!(form instanceof HTMLFormElement)) {
      throw new Error('ValiGuard: form должен быть HTMLFormElement');
    }

    this.form = form;
    this.options = {
      suppressWarnings: false,
      ...options,
    };

    this.fields = new Map();
    this._scanForm();
  }

  /**
   * Находит поля формы и связанные элементы.
   */
  _scanForm() {
    const inputs = Array.from(
      this.form.querySelectorAll('input, textarea, select')
    );

    for (const input of inputs) {
      const name = input.getAttribute('name');
      if (!name) continue;

      let label = null;
      const id = input.getAttribute('id');

      if (id) {
        label = this.form.querySelector(`label[for="${CSS.escape(id)}"]`);
      }
      if (!label) {
        const wrap = input.closest('label');
        if (wrap instanceof HTMLLabelElement) label = wrap;
      }

      let errorEl =
        this.form.querySelector(
          `[data-valiguard-error-for="${CSS.escape(name)}"]`
        ) || null;

      if (!errorEl) {
        const base = label || input;
        const next = base.nextElementSibling;
        if (next instanceof HTMLElement) errorEl = next;
      }

      if (!errorEl) {
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
          rules: null,
        });
      }
    }
  }

  /**
   * Добавляет правила + включает live валидацию.
   */
  addField(name, rules) {
    const field = this.fields.get(name);
    if (!field) return;

    field.rules = rules;

    field.elements.forEach((el) => {
      el.addEventListener('input', () => this._liveValidateField(name));
      el.addEventListener('change', () => this._liveValidateField(name));
      el.addEventListener('blur', () => this._liveValidateField(name));
    });
  }

  /**
   * Живая валидация при вводе.
   */
  _liveValidateField(name) {
    const field = this.fields.get(name);
    if (!field) return;

    const msg = this._validateField(name, field);

    if (field.errorEl) {
      field.errorEl.textContent = msg || '';
      field.errorEl.style.display = msg ? 'block' : 'none';
    }

    // === Добавлено: подсветка ===
    field.elements.forEach((el) => {
      el.classList.remove('valiguard-error-field', 'valiguard-success-field');

      if (msg) {
        el.classList.add('valiguard-error-field');
      } else if (el.value.trim() !== '') {
        // success показываем только если поле не пустое
        el.classList.add('valiguard-success-field');
      }
    });
  }

  /**
   * Полная проверка формы.
   */
  validate() {
    const errors = {};
    let isValid = true;

    for (const [name, field] of this.fields.entries()) {
      const msg = this._validateField(name, field);

      if (field.errorEl) {
        field.errorEl.textContent = msg || '';
        field.errorEl.style.display = msg ? 'block' : 'none';
      }

      // === Подсветка при submit ===
      field.elements.forEach((el) => {
        el.classList.remove('valiguard-error-field', 'valiguard-success-field');
        if (msg) {
          el.classList.add('valiguard-error-field');
        } else if (el.value.trim() !== '') {
          el.classList.add('valiguard-success-field');
        }
      });

      errors[name] = msg;
      if (msg) isValid = false;
    }

    return { isValid, errors };
  }

  /**
   * Проверка конкретного поля.
   */
  _validateField(name, field) {
    const rules = field.rules || {};

    const first = field.elements[0];
    const type = first.type;

    let value = first.value;

    // Чекбоксы → массив значений
    if (type === 'checkbox') {
      value = field.elements
        .filter((el) => el.checked)
        .map((el) => el.value);
    }

    // required
    const isRequired =
      field.elements.some((el) => el.hasAttribute('required')) ||
      !!rules.required;

    if (isRequired) {
      if (Array.isArray(value)) {
        if (!value.length)
          return rules?.messages?.required || 'Это поле обязательно';
      } else if (!value.trim()) {
        return rules?.messages?.required || 'Это поле обязательно';
      }
    }

    // строки
    if (!Array.isArray(value)) {
      const str = value.toString();

      if (rules.minLength && str.length < rules.minLength) {
        return (
          rules?.messages?.minLength ||
          `Минимум ${rules.minLength} символов`
        );
      }

      if (rules.maxLength && str.length > rules.maxLength) {
        return (
          rules?.messages?.maxLength ||
          `Максимум ${rules.maxLength} символов`
        );
      }

      if (rules.pattern instanceof RegExp && !rules.pattern.test(str)) {
        return rules?.messages?.pattern || 'Неверный формат';
      }

      if (type === 'number' || rules.type === 'number') {
        const num = Number(str);
        if (Number.isNaN(num)) {
          return rules?.messages?.number || 'Введите число';
        }

        const min = rules.min ?? Number(first.getAttribute('min'));
        const max = rules.max ?? Number(first.getAttribute('max'));

        if (!Number.isNaN(min) && num < min)
          return rules?.messages?.min || `Не меньше ${min}`;
        if (!Number.isNaN(max) && num > max)
          return rules?.messages?.max || `Не больше ${max}`;
      }
    }

    // массивы (чекбоксы)
    if (Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        return (
          rules?.messages?.minItems ||
          `Выберите минимум ${rules.minItems}`
        );
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        return (
          rules?.messages?.maxItems ||
          `Можно выбрать максимум ${rules.maxItems}`
        );
      }
    }

    // кастомный валидатор
    if (typeof rules.validator === 'function') {
      const result = rules.validator(value);
      if (result === false)
        return rules?.messages?.custom || 'Заполнено неверно';
      if (typeof result === 'string') return result;
    }

    return null;
  }
}


