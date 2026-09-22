import {
  escapeHtml,
} from '../js/html.js';

export function showPhotoViewer({
  src,
  alt = 'Imagem da evolução',
}) {
  const root =
    document.querySelector(
      '#modal-root',
    );

  if (
    !root ||
    !src
  ) {
    return;
  }

  root.innerHTML = `
    <div
      class="photo-viewer"
      role="presentation"
    >
      <div
        class="photo-viewer__dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Visualização da foto"
      >
        <button
          id="close-photo-viewer"
          class="photo-viewer__close"
          type="button"
          aria-label="Fechar imagem"
        >
          ×
        </button>

        <img
          src="${escapeHtml(src)}"
          alt="${escapeHtml(alt)}"
        />
      </div>
    </div>
  `;

  const backdrop =
    root.querySelector(
      '.photo-viewer',
    );

  const close =
    root.querySelector(
      '#close-photo-viewer',
    );

  const finish =
    () => {
      document.removeEventListener(
        'keydown',
        onKeyDown,
      );

      root.innerHTML = '';
    };

  const onKeyDown =
    (event) => {
      if (
        event.key ===
        'Escape'
      ) {
        finish();
      }
    };

  close?.addEventListener(
    'click',
    finish,
    {
      once: true,
    },
  );

  backdrop?.addEventListener(
    'click',
    (event) => {
      if (
        event.target ===
        backdrop
      ) {
        finish();
      }
    },
  );

  document.addEventListener(
    'keydown',
    onKeyDown,
  );
}
