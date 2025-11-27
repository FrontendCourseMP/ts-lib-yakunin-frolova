export const warn = (msg) => {
  if (!window.ValiGuardSuppressWarnings) {
    console.warn(`[ValiGuard] ${  msg}`);
  }
};

export const getErrorContainer = (field) => {
  // 1. data-error-container
  const selector = field.dataset.errorContainer;
  if (selector) {
    return field.closest(selector) || document.querySelector(selector);
  }

  // 2. следующий элемент с нужным классом
  const next = field.nextElementSibling;
  if (next && (next.classList.contains('error-message') || next.classList.contains('vg-error'))) {
    return next;
  }

  // 3. создаём свой
  const el = document.createElement('small');
  el.className = 'vg-error';
  el.style.cssText = 'color: red; display: block; margin-top: 4px; font-size: 0.9em;';
  field.after(el);
  return el;
};

export const addClass = (el, cls) => el.classList.add(cls);
export const removeClass = (el, cls) => el.classList.remove(cls);
export const hasClass = (el, cls) => el.classList.contains(cls);