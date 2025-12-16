import { beforeEach, describe, expect, it, vi } from 'vitest';
import ValiGuard from '../ValiGuard.js';

const createForm = (body = '') => {
  document.body.innerHTML = `<form>${body}</form>`;
  const form = document.querySelector('form');
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('Test helper: form not found');
  }
  return form;
};

const getField = (validator: ValiGuard, name: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (validator as any).fields.get(name);

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();

  if (!globalThis.CSS) {
    // @ts-expect-error - provide minimal CSS object for tests
    globalThis.CSS = { escape: (value: string) => `${value}` };
  } else if (!globalThis.CSS.escape) {
    globalThis.CSS.escape = (value: string) => `${value}`;
  }
});

describe('ValiGuard constructor and scanning', () => {
  it('throws when the provided root is not a form element', () => {
    expect(() => new ValiGuard(document.createElement('div') as unknown as HTMLFormElement)).toThrow(
      'ValiGuard: form должен быть HTMLFormElement'
    );
  });

  it('skips inputs without name and warns by default', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const form = createForm(`
      <input id="no-name" />
      <input name="email" />
      <div data-valiguard-error-for="email"></div>
    `);

    const validator = new ValiGuard(form);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('поле без name будет пропущено');
    expect(getField(validator, 'email')).toBeDefined();
    expect(getField(validator, 'no-name')).toBeUndefined();
  });

  it('creates an error container when none is provided', () => {
    const form = createForm(`<input name="username" />`);

    const validator = new ValiGuard(form);
    const field = getField(validator, 'username');

    expect(field?.errorEl).toBeInstanceOf(HTMLElement);
    expect(field?.errorEl?.className).toContain('valiguard-error');
    expect(field?.elements[0].nextElementSibling).toBe(field?.errorEl);
  });
});

describe('addField warnings', () => {
  it('warns when trying to add rules for a missing field', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const form = createForm(`
      <input name="email" />
      <div data-valiguard-error-for="email"></div>
    `);
    const validator = new ValiGuard(form);

    validator.addField('missing', { required: true });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('попытка добавить правила для несуществующего поля');
    expect(getField(validator, 'missing')).toBeUndefined();
  });

  it('warns about required conflict with HTML attribute', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const form = createForm(`
      <input name="age" required />
      <div data-valiguard-error-for="age"></div>
    `);
    const validator = new ValiGuard(form);

    validator.addField('age', { required: false });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('конфликт правил required для поля "age"');
    expect(getField(validator, 'age')?.rules).toMatchObject({ required: false });
  });
});

describe('validate: happy path and errors', () => {
  it('returns valid result and clears error containers on happy path', () => {
    const form = createForm(`
      <input name="email" />
      <input name="age" type="number" />
      <label><input type="checkbox" name="interests" value="music" checked /></label>
      <div data-valiguard-error-for="email"></div>
      <div data-valiguard-error-for="age"></div>
      <div data-valiguard-error-for="interests"></div>
    `);

    const validator = new ValiGuard(form);
    validator.addField('email', {
      required: true,
      pattern: /^[\w.-]+@[\w.-]+\.\w{2,}$/,
      messages: { pattern: 'Email invalid' },
    });
    validator.addField('age', { type: 'number', min: 18, max: 120 });
    validator.addField('interests', { minItems: 1 });

    const email = form.querySelector('input[name="email"]') as HTMLInputElement;
    const age = form.querySelector('input[name="age"]') as HTMLInputElement;
    email.value = 'user@example.com';
    age.value = '35';

    const result = validator.validate();

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({
      email: null,
      age: null,
      interests: null,
    });
    expect(getField(validator, 'email')?.errorEl?.textContent).toBe('');
    expect(getField(validator, 'age')?.errorEl?.textContent).toBe('');
    expect(getField(validator, 'interests')?.errorEl?.textContent).toBe('');
  });

  it('returns required error for an empty text field', () => {
    const form = createForm(`
      <input name="username" />
      <div data-valiguard-error-for="username"></div>
    `);
    const validator = new ValiGuard(form);
    validator.addField('username', { required: true });

    const result = validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors.username).toContain('обязательно для заполнения');
    expect(getField(validator, 'username')?.errorEl?.textContent).toContain(
      'обязательно для заполнения'
    );
  });

  it('validates number fields using rules and HTML min attribute', () => {
    const form = createForm(`
      <input name="score" type="text" min="5" value="abc" />
      <div data-valiguard-error-for="score"></div>
    `);
    const validator = new ValiGuard(form);
    validator.addField('score', { type: 'number' });

    const firstResult = validator.validate();
    expect(firstResult.isValid).toBe(false);
    expect(firstResult.errors.score).toContain('должно быть числом');

    const scoreInput = form.querySelector('input[name="score"]') as HTMLInputElement;
    scoreInput.value = '3';

    const secondResult = validator.validate();
    expect(secondResult.isValid).toBe(false);
    expect(secondResult.errors.score).toContain('не может быть меньше 5');
  });

  it('validates checkbox groups as arrays and applies custom validator', () => {
    const form = createForm(`
      <label><input type="checkbox" name="skills" value="js" /></label>
      <label><input type="checkbox" name="skills" value="ts" /></label>
      <div data-valiguard-error-for="skills"></div>
    `);
    const validator = new ValiGuard(form);
    validator.addField('skills', {
      validator: (value) => (Array.isArray(value) && value.length > 0 ? true : 'Выберите навык'),
    });

    const firstResult = validator.validate();
    expect(firstResult.isValid).toBe(false);
    expect(firstResult.errors.skills).toBe('Выберите навык');

    const firstCheckbox = form.querySelector('input[value="js"]') as HTMLInputElement;
    firstCheckbox.checked = true;

    const secondResult = validator.validate();
    expect(secondResult.isValid).toBe(true);
    expect(secondResult.errors.skills).toBeNull();
  });
});