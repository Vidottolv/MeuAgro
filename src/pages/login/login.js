import { enhancePasswordInputs } from '../../components/passwordInput.js';
import { signIn } from '../../services/authService.js';
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
import {
  showToast,
} from '../../components/toast.js';
import {
  navigate,
} from '../../js/router.js';

export function renderLoginPage() {
  const app =
    document.querySelector('#app');

  app.innerHTML = `
    <main class="auth-layout">
      <section class="auth-shell">
        ${authBrand({
          title: 'Bem-vindo ao Meu Agro',
          description:
            'Entre para acompanhar sua produção, estoque e próximas colheitas.',
        })}

        <div class="auth-card">
          <div class="auth-card__header">
            <p class="card__eyebrow">
              Acessar conta
            </p>

            <h2>Entrar</h2>

            <p>
              Informe seu e-mail e senha.
            </p>
          </div>

          <div
            id="login-feedback"
            class="form-message"
            hidden
          ></div>

          <form
            id="login-form"
            novalidate
          >
            <div class="field">
              <label for="login-email">
                E-mail
              </label>

              <input
                id="login-email"
                name="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                placeholder="voce@exemplo.com"
                required
              />
            </div>

            <div class="field">
              <div class="field__label-row">
                <label for="login-password">
                  Senha
                </label>

                <a
                  href="/forgot-password"
                  class="link"
                  data-link
                >
                  Esqueci minha senha
                </a>
              </div>

              <input
                id="login-password"
                name="password"
                type="password"
                autocomplete="current-password"
                placeholder="Sua senha"
                required
              />
            </div>

            <button
              id="login-submit"
              class="button button--primary button--full"
              type="submit"
            >
              Entrar
            </button>
          </form>

          <p class="auth-alternative">
            Ainda não possui conta?

            <a
              href="/register"
              class="link link--strong"
              data-link
            >
              Criar conta
            </a>
          </p>
        </div>
      </section>
    </main>
  `;

  const params =
    new URLSearchParams(
      window.location.search,
    );

  const feedback =
    document.querySelector(
      '#login-feedback',
    );

  if (
    params.get('confirmed') === '1'
  ) {
    setFormMessage(
      feedback,
      'E-mail confirmado. Agora você já pode entrar.',
      'success',
    );
  }

  const nativeError =
    params.get(
      'nativeError',
    );

  if (nativeError) {
    setFormMessage(
      feedback,
      nativeError,
    );
  }

  if (
    params.get('passwordUpdated') ===
    '1'
  ) {
    setFormMessage(
      feedback,
      'Senha alterada com sucesso. Entre novamente.',
      'success',
    );
  }

  const cleanupPasswords = enhancePasswordInputs(app);

  const form =
    document.querySelector(
      '#login-form',
    );

  const submitButton =
    document.querySelector(
      '#login-submit',
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

    const password =
      String(
        formData.get('password') || '',
      );

    if (!email || !password) {
      setFormMessage(
        feedback,
        'Informe o e-mail e a senha.',
      );

      return;
    }

    setButtonLoading(
      submitButton,
      true,
      'Entrando…',
    );

    try {
      await signIn({
        email,
        password,
      });

      showToast(
        'Login realizado com sucesso.',
        {
          type: 'success',
        },
      );

      const redirect =
        params.get('redirect');

      navigate(
        redirect &&
        redirect.startsWith('/')
          ? redirect
          : '/dashboard',
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
