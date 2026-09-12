import { enhancePasswordInputs } from '../../components/passwordInput.js';
import {
  getSession,
  updatePassword,
  signOut,
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
  validatePassword,
} from '../../components/formHelpers.js';
import {
  navigate,
} from '../../js/router.js';

export async function renderResetPasswordPage() {
  const app =
    document.querySelector('#app');

  app.innerHTML = `
    <main class="auth-layout">
      <section class="auth-shell">
        ${authBrand({
          title: 'Defina uma nova senha',
          description:
            'Escolha uma nova senha para continuar utilizando sua conta.',
        })}

        <div class="auth-card">
          <div class="auth-card__header">
            <p class="card__eyebrow">
              Segurança
            </p>

            <h2>Nova senha</h2>
          </div>

          <div
            id="reset-feedback"
            class="form-message"
            hidden
          ></div>

          <form
            id="reset-form"
            novalidate
          >
            <div class="field">
              <label for="reset-password">
                Nova senha
              </label>

              <input
                id="reset-password"
                name="password"
                type="password"
                autocomplete="new-password"
                minlength="8"
                placeholder="Mínimo de 8 caracteres"
                required
              />
            </div>

            <div class="field">
              <label for="reset-password-confirm">
                Confirmar nova senha
              </label>

              <input
                id="reset-password-confirm"
                name="passwordConfirm"
                type="password"
                autocomplete="new-password"
                minlength="8"
                placeholder="Repita a nova senha"
                required
              />
            </div>

            <button
              id="reset-submit"
              class="button button--primary button--full"
              type="submit"
            >
              Alterar senha
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

  const cleanupPasswords = enhancePasswordInputs(app);

  const form =
    document.querySelector(
      '#reset-form',
    );

  const feedback =
    document.querySelector(
      '#reset-feedback',
    );

  const submitButton =
    document.querySelector(
      '#reset-submit',
    );

  try {
    const session =
      await getSession();

    if (!session) {
      setFormMessage(
        feedback,
        'Abra esta página pelo link de recuperação enviado ao seu e-mail.',
        'info',
      );

      submitButton.disabled = true;
    }
  } catch (error) {
    setFormMessage(
      feedback,
      getAuthErrorMessage(error),
    );

    submitButton.disabled = true;
  }

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

    const password =
      String(
        formData.get('password') || '',
      );

    const passwordConfirm =
      String(
        formData.get(
          'passwordConfirm',
        ) || '',
      );

    const passwordError =
      validatePassword(password);

    if (passwordError) {
      setFormMessage(
        feedback,
        passwordError,
      );

      return;
    }

    if (
      password !==
      passwordConfirm
    ) {
      setFormMessage(
        feedback,
        'As senhas informadas são diferentes.',
      );

      return;
    }

    setButtonLoading(
      submitButton,
      true,
      'Alterando…',
    );

    try {
      await updatePassword(
        password,
      );

      await signOut();

      navigate(
        '/login?passwordUpdated=1',
        {
          replace: true,
        },
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
    cleanupPasswords();
    form.removeEventListener(
      'submit',
      handleSubmit,
    );
  };
}
