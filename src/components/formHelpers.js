export function setButtonLoading(
  button,
  loading,
  loadingText = 'Aguarde…',
) {
  if (!button) return;

  if (loading) {
    button.dataset.originalText =
      button.textContent;

    button.textContent = loadingText;
    button.disabled = true;
    button.setAttribute(
      'aria-busy',
      'true',
    );
  } else {
    button.textContent =
      button.dataset.originalText ||
      button.textContent;

    button.disabled = false;
    button.removeAttribute(
      'aria-busy',
    );
  }
}

export function setFormMessage(
  element,
  message,
  type = 'error',
) {
  if (!element) return;

  if (!message) {
    element.hidden = true;
    element.textContent = '';
    element.className = 'form-message';
    return;
  }

  element.hidden = false;
  element.textContent = message;
  element.className =
    `form-message form-message--${type}`;
}

export function validatePassword(
  password,
) {
  if (password.length < 8) {
    return 'A senha deve possuir pelo menos 8 caracteres.';
  }

  return null;
}
