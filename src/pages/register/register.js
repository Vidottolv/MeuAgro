import {
  signUp,
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

export function renderRegisterPage() {
  const app =
    document.querySelector('#app');

  app.innerHTML = `
    <main class="auth-layout">
      <section class="auth-shell">
        ${authBrand({
          title: 'Crie sua conta',
          description:
            'Comece organizando sua propriedade e mantenha o histórico de cada ciclo produtivo.',
        })}

        <div class="auth-card">
          <div class="auth-card__header">
            <p class="card__eyebrow">
              Primeiro acesso
            </p>

            <h2>Cadastro</h2>

            <p>
              São necessários apenas alguns dados para começar.
            </p>
          </div>

          <div
            id="register-feedback"
            class="form-message"
            hidden
          ></div>

          <form
            id="register-form"
            novalidate
          >
            <div class="field">
              <label for="register-name">
                Nome
              </label>

              <input
                id="register-name"
                name="fullName"
                type="text"
                autocomplete="name"
                placeholder="Seu nome"
                minlength="2"
                maxlength="120"
                required
              />
            </div>

            <div class="field">
              <label for="register-email">
                E-mail
              </label>

              <input
                id="register-email"
                name="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                placeholder="voce@exemplo.com"
                required
              />
            </div>

            <div class="field">
              <label for="register-password">
                Senha
              </label>

              <input
                id="register-password"
                name="password"
                type="password"
                autocomplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                minlength="8"
                required
              />

              <small class="field__hint">
                Utilize pelo menos 8 caracteres.
              </small>
            </div>

            <div class="field">
              <label for="register-password-confirm">
                Confirmar senha
              </label>

              <input
                id="register-password-confirm"
                name="passwordConfirm"
                type="password"
                autocomplete="new-password"
                placeholder="Repita sua senha"
                minlength="8"
                required
              />
            </div>

            <button
              id="register-submit"
              class="button button--primary button--full"
              type="submit"
            >
              Criar minha conta
            </button>
          </form>

          <p class="auth-alternative">
            Já possui conta?

            <a
              href="/login"
              class="link link--strong"
              data-link
            >
              Entrar
            </a>
          </p>
        </div>
      </section>
    </main>
  `;

  const form =
    document.querySelector(
      '#register-form',
    );

  const feedback =
    document.querySelector(
      '#register-feedback',
    );

  const submitButton =
    document.querySelector(
      '#register-submit',
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

    const fullName =
      String(
        formData.get('fullName') || '',
      ).trim();

    const email =
      String(
        formData.get('email') || '',
      ).trim();

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

    if (
      fullName.length < 2 ||
      !email ||
      !password ||
      !passwordConfirm
    ) {
      setFormMessage(
        feedback,
        'Preencha todos os campos obrigatórios.',
      );

      return;
    }

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
      'Criando conta…',
    );

    try {
      const data =
        await signUp({
          fullName,
          email,
          password,
        });

      if (data.session) {
        navigate(
          '/dashboard',
          {
            replace: true,
          },
        );

        return;
      }

      form.reset();

      setFormMessage(
        feedback,
        'Conta criada. Enviamos um e-mail para confirmação. Depois de confirmar, volte ao Meu Agro para entrar.',
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
