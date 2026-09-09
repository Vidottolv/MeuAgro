import {
  appShell,
} from '../../components/appShell.js';
import {
  icon,
} from '../../components/icons.js';
import {
  getCurrentProfile,
  signOut,
} from '../../services/authService.js';
import {
  getAuthErrorMessage,
} from '../../services/authErrorService.js';
import {
  showToast,
} from '../../components/toast.js';
import {
  navigate,
} from '../../js/router.js';

function displayName(
  session,
  profile,
) {
  return (
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'Usuário'
  );
}

function initials(name) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!parts.length) {
    return 'MA';
  }

  return (
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : parts[0].slice(0, 2)
  ).toUpperCase();
}

export async function renderProfilePage({
  session,
}) {
  const app =
    document.querySelector('#app');

  let profile = null;

  try {
    profile =
      await getCurrentProfile();
  } catch (error) {
    console.error(
      'Erro ao carregar perfil:',
      error,
    );
  }

  const name =
    displayName(
      session,
      profile,
    );

  app.innerHTML =
    appShell({
      session,
      title: 'Perfil',
      eyebrow: 'Minha conta',
      activeNav: 'more',
      content: `
        <section class="profile-summary">
          <div class="profile-summary__avatar">
            ${initials(name)}
          </div>

          <div class="profile-summary__content">
            <strong>${name}</strong>
            <span>${session?.user?.email || '-'}</span>
          </div>
        </section>

        <section class="more-list">
          <p class="more-list__label">
            Conta
          </p>

          <div class="more-item">
            <span class="more-item__icon">
              ${icon('user')}
            </span>

            <span class="more-item__content">
              <strong>Perfil do banco</strong>
              <span>
                ${
                  profile
                    ? 'Sincronizado com public.profiles'
                    : 'Perfil não encontrado'
                }
              </span>
            </span>
          </div>

          <button
            id="logout-button"
            class="more-item"
            type="button"
            style="
              width: 100%;
              text-align: left;
              background: transparent;
            "
          >
            <span class="more-item__icon">
              ${icon('logout')}
            </span>

            <span class="more-item__content">
              <strong>Sair da conta</strong>
              <span>
                Encerrar a sessão neste dispositivo
              </span>
            </span>

            <span class="more-item__arrow">
              ${icon('chevronRight')}
            </span>
          </button>
        </section>
      `,
    });

  const logoutButton =
    document.querySelector(
      '#logout-button',
    );

  const handleLogout = async () => {
    logoutButton.disabled = true;

    try {
      await signOut();

      navigate(
        '/login',
        {
          replace: true,
        },
      );
    } catch (error) {
      showToast(
        getAuthErrorMessage(error),
        {
          type: 'error',
        },
      );

      logoutButton.disabled = false;
    }
  };

  logoutButton.addEventListener(
    'click',
    handleLogout,
  );

  return () => {
    logoutButton.removeEventListener(
      'click',
      handleLogout,
    );
  };
}
