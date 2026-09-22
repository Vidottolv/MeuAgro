const DEFAULT_DURATION = 3500;

export function showToast(
  message,
  {
    type = 'default',
    duration = DEFAULT_DURATION,
  } = {},
) {
  const container =
    document.querySelector(
      '#toast-container',
    );

  if (!container) return;

  const toast =
    document.createElement('div');

  toast.className =
    `toast${
      type === 'error'
        ? ' toast--error'
        : type === 'success'
          ? ' toast--success'
          : ''
    }`;

  toast.setAttribute(
    'role',
    'status',
  );

  toast.textContent = message;

  container.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, duration);
}
