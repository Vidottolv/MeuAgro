import {
  requestPasswordReset,
} from '../../services/authService.js';
import {
  getAuthErrorMessage,
} from '../../services/authErrorService.js';
import {
  authBrand,
} from '../../components/authBrand.js';
import {
  setButtonLoading,
  setFormMessage,
} from '../../components/formHelpers.js';

export function renderForgotPasswordPage() {
  const app =
    document.querySelector('#app');

  app.innerHTML = `
    <main class="auth-layout">
      <section class="auth-shell">
        ${authBrand({
          title: 'Recupere seu acesso',
          description:
            'Informe o e-mail cadastrado e enviaremos as instruções de recuperação.',
        })}

        <div class="auth-card">
          <div class="auth-card__header">
            <p class="card__eyebrow">
              Recuperação
            </p>

            <h2>
              Esqueci minha senha
            </h2>

            <p>
              O link de recuperação será enviado por e-mail.
            </p>
          </div>

          <div
            id="forgot-feedback"
            class="form-message"
            hidden
          ></div>

          <form
            id="forgot-form"
            novalidate
          >
            <div class="field">
              <label for="forgot-email">
                E-mail
              </label>

              <input
                id="forgot-email"
                name="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                placeholder="voce@exemplo.com"
                required
              />
            </div>

            <button
              id="forgot-submit"
              class="button button--primary button--full"
              type="submit"
            >
              Enviar recuperação
            </button>
          </form>

          <p class="auth-alternative">
            <a
              href="/login"
              class="link link--strong"
              data-link
            >
              Voltar para o login
            </a>
          </p>
        </div>
      </section>
    </main>
  `;

  const form =
    document.querySelector(
      '#forgot-form',
    );

  const feedback =
    document.querySelector(
      '#forgot-feedback',
    );

  const submitButton =
    document.querySelector(
      '#forgot-submit',
    );

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setFormMessage(
      feedback,
      '',
    );

    const formData =
      new FormData(form);

    const email =
      String(
        formData.get('email') || '',
      ).trim();

    if (!email) {
      setFormMessage(
        feedback,
        'Informe seu e-mail.',
      );

      return;
    }

    setButtonLoading(
      submitButton,
      true,
      'Enviando…',
    );

    try {
      await requestPasswordReset(
        email,
      );

      form.reset();

      setFormMessage(
        feedback,
        'Se existir uma conta com esse e-mail, enviaremos as instruções para redefinir a senha.',
        'success',
      );
    } catch (error) {
      setFormMessage(
        feedback,
        getAuthErrorMessage(error),
      );
    } finally {
      setButtonLoading(
        submitButton,
        false,
      );
    }
  };

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  return () => {
    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
