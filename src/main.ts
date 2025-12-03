const form = document.querySelector("form");
if (!form) throw new Error("Форма не найдена");

// Ищем все input в форме
const fields = Array.from(form.querySelectorAll("input, textarea, select"));

// Массив с информацией о каждом поле
const formFields = fields.map(input => {
  // label может быть родителем (как у тебя)
  let label = input.closest("label");

  // Контейнер ошибки — элемент после label/input
  let errorEl = input.closest("label")?.nextElementSibling;

  if (!errorEl || !(errorEl instanceof HTMLElement)) {
    console.warn("Не найден контейнер ошибки для поля:", input);
    errorEl = null;
  }

  return {
    input,
    label,
    errorEl,
  };
});

console.log(formFields);