import {icon} from './icons.js';
import { tradeUnreadCount } from '../services/tradeNotificationService.js';
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
    <div class="mobile-app ${activeNav === 'commerce' ? 'commercial-app' : ''}">
      <div class="app-topbar-wrap">
        <header class="app-topbar">
          <div class="app-topbar__identity">
            <p class="app-topbar__eyebrow">
              ${eyebrow}
            </p>

            <h1 class="app-topbar__title">
              ${title}
            </h1>
            <button type="button" class="button commerce-mode-button" data-app-route="${activeNav === 'commerce' ? '/dashboard' : '/consultor'}">${icon(activeNav === 'commerce' ? 'sprout' : 'briefcase')}<span>${activeNav === 'commerce' ? 'Ir para produtor' : 'Ir para consultor'}</span></button>
          </div>

          <div class="app-topbar__actions"><a href="/notificacoes/compras" class="trade-bell" aria-label="Avisos de compras${tradeUnreadCount() ? ', '+tradeUnreadCount()+' não lidos' : ''}" title="Avisos de compras" data-link>${icon('bell')}<span data-trade-unread aria-hidden="true">${tradeUnreadCount()>99?'99+':tradeUnreadCount()||''}</span></a>
          <a
            href="/more/profile"
            class="button button--secondary user-avatar"
            aria-label="Abrir meu perfil"
            data-link
          >
            ${initials}
          </a>
          </div>
        </header>
      </div>

      <main class="app-content">
        ${content}
      </main>

      ${activeNav === 'commerce' ? `<div class="bottom-nav-wrap"><nav class="commerce-nav" aria-label="Navegação comercial">${[['/consultor','briefcase','Meu espaço'],['/consultor/negociacoes','clipboard','Negociações'],['/consultor/resultados','chart','Resultados']].map(([href,name,label])=>`<a href="${href}" data-link ${location.pathname===href||(href==='/consultor'&&location.pathname==='/consultor/empresa')?'aria-current="page"':''}>${icon(name)}<span>${label}</span></a>`).join('')}</nav></div>` : bottomNavigation(activeNav)}
    </div>
  `;
}

