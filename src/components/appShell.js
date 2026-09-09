import { bottomNavigation } from './bottomNavigation.js';

function initialsFromSession(session) {
  const name =
    session?.user?.user_metadata?.full_name?.trim();

  if (name) {
    const parts =
      name.split(/\s+/).filter(Boolean);

    return (
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : parts[0].slice(0, 2)
    ).toUpperCase();
  }

  const email =
    session?.user?.email || 'MA';

  return email.slice(0, 2).toUpperCase();
}

export function appShell({
  session,
  title,
  eyebrow = 'Meu Agro',
  activeNav,
  content,
}) {
  const initials =
    initialsFromSession(session);

  return `
    <div class="mobile-app">
      <div class="app-topbar-wrap">
        <header class="app-topbar">
          <div class="app-topbar__identity">
            <p class="app-topbar__eyebrow">
              ${eyebrow}
            </p>

            <h1 class="app-topbar__title">
              ${title}
            </h1>
          </div>

          <a
            href="/more/profile"
            class="user-avatar"
            aria-label="Abrir meu perfil"
            data-link
          >
            ${initials}
          </a>
        </header>
      </div>

      <main class="app-content">
        ${content}
      </main>

      ${bottomNavigation(activeNav)}
    </div>
  `;
}
