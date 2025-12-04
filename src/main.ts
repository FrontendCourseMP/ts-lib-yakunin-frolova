import ValiGuard from './ValiGuard.js';

const form = document.querySelector('form');
if (!(form instanceof HTMLFormElement)) {
  throw new Error('Форма не найдена или не является HTMLFormElement');
}


const validator = new ValiGuard(form);

// Пример: добавляем правила для нескольких полей
validator.addField('email', {
  required: true,
  type: 'string',
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  messages: {
    required: 'Введите email',
    pattern: 'Email в неверном формате',
  },
});

validator.addField('age', {
  required: false,
  type: 'number',
  min: 18,
  max: 120,
  messages: {
    number: 'Возраст должен быть числом',
    min: 'Возраст не может быть меньше 18',
    max: 'Возраст не может быть больше 120',
  },
});

validator.addField('interests', {
  // группа чекбоксов name="interests"
  minItems: 1,
  messages: {
    minItems: 'Выберите хотя бы один интерес',
  },
});

validator.addField('name', {
  required: true,
  minLength: 2,
  messages: {
    required: 'Введите имя',
    minLength: 'Имя должно быть не короче 2 символов',
  },
});

form.addEventListener('submit', (event) => {
  const result = validator.validate();

  if (!result.isValid) {
    event.preventDefault();
    console.log('Ошибки валидации', result.errors);
  }
});