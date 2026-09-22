const eye = '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
// Keep the original input, validation, value and autofill metadata.
export function enhancePasswordInputs(root) {
  const cleanups = [];
  for (const input of root.querySelectorAll('input[type="password"]')) {
    if (input.parentElement.classList.contains('password-input')) continue;
    const wrapper = document.createElement('div');
    wrapper.className = 'password-input';
    input.before(wrapper);
    wrapper.append(input);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'password-input__toggle';
    button.setAttribute('aria-controls', input.id);
    const paint = () => {
      const visible = input.type === 'text';
      const label = (visible ? 'Ocultar' : 'Mostrar') + ' senha';
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(visible));
      button.title = label;
      button.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + eye + (visible ? '' : '<path d="m3 3 18 18"/>') + '</svg>';
    };
    const toggle = () => {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.type = input.type === 'password' ? 'text' : 'password';
      paint();
      input.focus({ preventScroll: true });
      if (start !== null) input.setSelectionRange(start, end);
    };
    button.addEventListener('click', toggle);
    wrapper.append(button);
    paint();
    cleanups.push(() => { input.type = 'password'; button.removeEventListener('click', toggle); });
  }
  return () => cleanups.forEach(cleanup => cleanup());
}
