import {
  escapeHtml,
} from '../js/html.js';

export function showConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
}) {
  return new Promise((resolve) => {
    const root =
      document.querySelector(
        '#modal-root',
      );

    if (!root) {
      resolve(false);
      return;
    }

    root.innerHTML = `
      <div
        class="modal-backdrop"
        role="presentation"
      >
        <section
          class="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <h2 id="confirm-modal-title">
            ${escapeHtml(title)}
          </h2>

          <p>
            ${escapeHtml(message)}
          </p>

          <div class="modal-actions">
            <button
              id="confirm-modal-cancel"
              class="button button--secondary"
              type="button"
            >
              ${escapeHtml(cancelLabel)}
            </button>

            <button
              id="confirm-modal-confirm"
              class="
                button
                ${
                  danger
                    ? 'button--danger'
                    : 'button--primary'
                }
              "
              type="button"
            >
              ${escapeHtml(confirmLabel)}
            </button>
          </div>
        </section>
      </div>
    `;

    const backdrop =
      root.querySelector(
        '.modal-backdrop',
      );

    const cancelButton =
      root.querySelector(
        '#confirm-modal-cancel',
      );

    const confirmButton =
      root.querySelector(
        '#confirm-modal-confirm',
      );

    let finished = false;

    const finish = (value) => {
      if (finished) {
        return;
      }

      finished = true;
      document.removeEventListener(
        'keydown',
        onKeyDown,
      );

      root.innerHTML = '';
      resolve(value);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        finish(false);
      }
    };

    cancelButton.addEventListener(
      'click',
      () => finish(false),
      {
        once: true,
      },
    );

    confirmButton.addEventListener(
      'click',
      () => finish(true),
      {
        once: true,
      },
    );

    backdrop.addEventListener(
      'click',
      (event) => {
        if (event.target === backdrop) {
          finish(false);
        }
      },
    );

    document.addEventListener(
      'keydown',
      onKeyDown,
    );

    confirmButton.focus();
  });
}
