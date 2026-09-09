import {
  escapeHtml,
} from '../js/html.js';

export function showAreaTypeModal() {
  return new Promise(
    (resolve) => {
      const root =
        document.querySelector(
          '#modal-root',
        );

      if (!root) {
        resolve(null);
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
            aria-labelledby="area-type-modal-title"
          >
            <h2
              id="area-type-modal-title"
            >
              Novo tipo de área
            </h2>

            <p>
              Crie um tipo personalizado para usar nas suas propriedades.
            </p>

            <form
              id="area-type-form"
              class="modal-form"
              novalidate
            >
              <div class="field">
                <label
                  for="area-type-name"
                >
                  Nome *
                </label>

                <input
                  id="area-type-name"
                  name="name"
                  type="text"
                  minlength="2"
                  maxlength="80"
                  placeholder="Ex.: Viveiro"
                  required
                />
              </div>

              <div class="field">
                <label
                  for="area-type-description"
                >
                  Descrição
                </label>

                <textarea
                  id="area-type-description"
                  name="description"
                  maxlength="300"
                  placeholder="Ex.: Área destinada à produção de mudas."
                ></textarea>
              </div>

              <div
                id="area-type-feedback"
                class="form-message"
                hidden
              ></div>

              <div class="modal-actions">
                <button
                  id="area-type-cancel"
                  class="button button--secondary"
                  type="button"
                >
                  Cancelar
                </button>

                <button
                  class="button button--primary"
                  type="submit"
                >
                  Criar tipo
                </button>
              </div>
            </form>
          </section>
        </div>
      `;

      const backdrop =
        root.querySelector(
          '.modal-backdrop',
        );

      const form =
        root.querySelector(
          '#area-type-form',
        );

      const cancel =
        root.querySelector(
          '#area-type-cancel',
        );

      const nameInput =
        root.querySelector(
          '#area-type-name',
        );

      let finished = false;

      const finish =
        (value) => {
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

      const onKeyDown =
        (event) => {
          if (
            event.key ===
            'Escape'
          ) {
            finish(null);
          }
        };

      const handleSubmit =
        (event) => {
          event.preventDefault();

          const formData =
            new FormData(form);

          const name =
            String(
              formData.get(
                'name',
              ) || '',
            ).trim();

          const description =
            String(
              formData.get(
                'description',
              ) || '',
            ).trim();

          if (
            name.length < 2
          ) {
            const feedback =
              root.querySelector(
                '#area-type-feedback',
              );

            feedback.hidden =
              false;

            feedback.className =
              'form-message form-message--error';

            feedback.textContent =
              'Informe um nome com pelo menos 2 caracteres.';

            return;
          }

          finish({
            name:
              escapeHtml(name)
                ? name
                : name,
            description,
          });
        };

      cancel.addEventListener(
        'click',
        () => finish(null),
        {
          once: true,
        },
      );

      backdrop.addEventListener(
        'click',
        (event) => {
          if (
            event.target ===
            backdrop
          ) {
            finish(null);
          }
        },
      );

      form.addEventListener(
        'submit',
        handleSubmit,
      );

      document.addEventListener(
        'keydown',
        onKeyDown,
      );

      nameInput.focus();
    },
  );
}
