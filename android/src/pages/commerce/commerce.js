import {icon} from '../../components/icons.js';
import { appShell } from '../../components/appShell.js';
import { escapeHtml as esc } from '../../js/html.js';
import { showConfirmModal } from '../../components/confirmModal.js';
import { loadCommerce, commerceCommand, commerceError, sellerAccess } from '../../services/commerceService.js';

const input = (name, label, value = '', type = 'text', extra = '') => `<div class="field"><label for="commerce-${name}">${label}</label><input id="commerce-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
const button = (text, extra = '', secondary = false) => `<button class="button button--${secondary ? 'secondary' : 'primary'}" ${extra}>${text}</button>`;
const date = value => new Date(value).toLocaleDateString('pt-BR');

export async function renderCommercePage({ session }) {
  const app = document.querySelector('#app');
  const userId = session.user.id;
  const companyId = new URLSearchParams(window.location.search).get('id');
  let state, disposed = false, busy = false;
  const shell = content => appShell({ session, title: 'Consultor', eyebrow: 'Meu Agro • Comercial', activeNav: 'commerce', content: `<div class="commerce-page">${content}</div>` });
  app.innerHTML = shell('<p role="status">Carregando seu espaço comercial…</p>');
  const notice = (message, failure = false) => {
    const element = app.querySelector('#commerce-feedback');
    if (element) { element.textContent = message; element.className = `form-message form-message--${failure ? 'error' : 'success'}`; element.hidden = !message; }
  };

  function paint(message = '') {
    if (disposed) return;
    const pageTitle = !companyId ? 'Seu negócio, em um só lugar' : state.sellers.find(s => s.id === companyId)?.kind === 'personal' ? 'Minha atuação própria' : 'Empresa e representantes';
    const heading = `<section class="page-heading commerce-hero"><div><p class="section-eyebrow">Seu espaço comercial</p><h2>${pageTitle}</h2><p>Trabalhe por conta própria e represente empresas com a mesma conta.</p></div></section><div id="commerce-feedback" role="status" aria-live="polite" hidden></div>`;
    let content;
    if (!state.account?.enabled) {
      content = `<section class="commerce-card"><h3>Ative seu perfil de consultor</h3><p>Seu acesso como produtor e seus registros serão mantidos.</p><form data-command="enable">${input('name','Nome profissional', session.user.user_metadata?.full_name || '', 'text', 'required minlength="2" maxlength="120" autocomplete="name"')}${button('Ativar modo consultor','type="submit"')}</form></section>`;
    } else if (companyId) {
      const seller = state.sellers.find(s => s.id === companyId);
      if (!seller) content = '<section class="commerce-card"><h3>Cadastro indisponível</h3><p>Você não possui acesso a este vendedor.</p><a class="button button--secondary" href="/consultor" data-link>Voltar ao meu espaço</a></section>';
      else {
        const access = sellerAccess(seller, state.memberships, userId);
        const members = state.memberships.filter(m => m.seller_id === seller.id);
        const invitations = state.invitations.filter(i => i.seller_id === seller.id);
        content = `<a href="/consultor" class="button button--secondary link" data-link>← Meu espaço</a><section class="commerce-card"><span class="commerce-badge">${access.label}</span><h3>${esc(seller.name)}</h3>${access.owner ? `<form data-command="update_seller"><input type="hidden" name="seller_id" value="${esc(seller.id)}">${input('name','Nome comercial',seller.name,'text','required minlength="2" maxlength="120"')}${input('email','E-mail de contato',seller.email,'email','maxlength="254"')}${input('phone','Telefone',seller.phone,'tel','maxlength="40"')}${button('Salvar dados','type="submit"')}</form>` : `<p>${esc(seller.email || 'E-mail não informado')}</p><p>${esc(seller.phone || 'Telefone não informado')}</p><p>${access.active ? 'Seu vínculo permite atuar em nome desta empresa.' : 'Seu vínculo foi encerrado. Este cadastro permanece no histórico.'}</p>`}</section>`;
        if (seller.kind === 'company') {
          if (access.owner) content += `<section class="commerce-card"><h3>Convidar representante</h3><p>Gere um código e compartilhe com a pessoa. Ela precisa entrar com o e-mail confirmado indicado abaixo. O código vale por 7 dias.</p><form data-command="invite"><input type="hidden" name="seller_id" value="${esc(seller.id)}">${input('invite-email','E-mail do representante','','email','required maxlength="254"')}${button('Gerar convite','type="submit"')}</form></section>`;
          content += `<section class="commerce-card"><h3>${access.owner ? 'Representantes' : 'Meu vínculo'}</h3>${members.length ? members.map(m => `<article class="commerce-row"><div><strong>${esc(m.representative_name)}</strong><p>${m.active ? 'Ativo desde ' + date(m.joined_at) : 'Encerrado em ' + date(m.ended_at)}</p></div>${m.active ? button(access.owner ? 'Encerrar vínculo' : 'Sair da empresa',`type="button" data-action="end_membership" data-id="${esc(m.id)}"`,true) : ''}</article>`).join('') : '<p>Nenhum representante vinculado.</p>'}</section>`;
          if (access.owner) content += `<section class="commerce-card"><h3>Convites</h3>${invitations.length ? invitations.map(i => {
            const pending = i.status === 'pending' && new Date(i.expires_at) > new Date();
            const label = i.status === 'accepted' ? 'Aceito' : i.status === 'revoked' ? 'Cancelado' : pending ? 'Pendente até ' + date(i.expires_at) : 'Expirado';
            return `<article class="commerce-row"><div class="commerce-invite-code"><strong>${esc(i.email)}</strong><p>${label}</p>${pending ? `<label class="commerce-code-label">Código do convite<input class="commerce-code" readonly value="${esc(i.token)}" aria-label="Código para ${esc(i.email)}"></label>` : ''}</div>${pending ? `<div class="commerce-actions">${button('Copiar',`type="button" data-action="copy" data-id="${esc(i.id)}"`,true)}${button('Cancelar',`type="button" data-action="revoke_invite" data-id="${esc(i.id)}"`,true)}</div>` : ''}</article>`;
          }).join('') : '<p>Nenhum convite gerado.</p>'}</section>`;
        }
      }
    } else {
      content = `<section class="commerce-grid">${state.sellers.map(seller => {
        const access = sellerAccess(seller, state.memberships, userId);
        const selected = state.account.active_seller_id === seller.id && access.active;
        return `<article class="commerce-card commerce-identity ${selected?'is-selected':''}"><span class="commerce-badge">${selected?'Atuação atual • ':''}${access.label}</span><h3>${esc(seller.name)}</h3><p>${selected ? 'Atuação selecionada' : seller.kind === 'personal' ? 'Sua identidade de vendedor independente.' : 'Identidade comercial da empresa.'}</p><div class="commerce-actions">${access.active && !selected ? button('Selecionar atuação',`type="button" data-action="select_seller" data-id="${esc(seller.id)}"`) : ''}<a class="button button--secondary" href="/consultor/empresa?id=${encodeURIComponent(seller.id)}" data-link>${access.owner ? 'Gerenciar cadastro' : 'Ver vínculo'}</a>${seller.kind==='company'&&(access.owner||state.memberships.some(m=>m.seller_id===seller.id&&m.user_id===userId&&m.active&&m.management_role==='manager'))?`<a class="button button--primary" href="/consultor/gestao?seller=${encodeURIComponent(seller.id)}" data-link>Gestão da empresa</a>`:''}</div></article>`;
      }).join('')}</section><section class="commerce-grid"><section class="commerce-card"><h3>Cadastrar minha empresa</h3><p>Você será responsável pelo cadastro e pelos convites dos representantes.</p><form data-command="create_company">${input('name','Nome da empresa','','text','required minlength="2" maxlength="120"')}${input('email','E-mail comercial','','email','maxlength="254"')}${input('phone','Telefone comercial','','tel','maxlength="40"')}${button('Criar empresa','type="submit"')}</form></section><section class="commerce-card"><h3>Aceitar convite</h3><p>Use o código recebido da empresa. Sua conta deve utilizar o e-mail confirmado do destinatário.</p><form data-command="accept_invite">${input('token','Código do convite','','text','required maxlength="36" autocomplete="off" spellcheck="false"')}${button('Aceitar convite','type="submit"')}</form></section></section><section class="commerce-card"><h3>Seu acesso de produtor continua aqui</h3><p>As propriedades, plantios, barracão e contatos existentes permanecem disponíveis.</p><a class="button button--secondary" href="/dashboard" data-link>Ir para o modo produtor</a></section>`;
    }
    const shortcuts=!companyId&&state.account?.enabled?`<nav class="commerce-shortcuts" aria-label="Atalhos comerciais"><a href="/consultor/negociacoes" data-link>${icon('clipboard')}<span><strong>Negociações</strong><small>Catálogo, propostas e conversas</small></span><span aria-hidden="true">→</span></a><a href="/consultor/resultados" data-link>${icon('chart')}<span><strong>Vendas e resultados</strong><small>Comissões e produtos campeões</small></span><span aria-hidden="true">→</span></a></nav>`:'';
    app.innerHTML = shell(heading + shortcuts + content);
    notice(message);
  }

  async function run(action, data) {
    if (busy || disposed) return;
    busy = true;
    const controls = [...app.querySelectorAll('button')];
    controls.forEach(b => { b.disabled = true; });
    notice('Salvando…');
    let saved = false;
    try {
      await commerceCommand(action, data);
      saved = true;
      state = await loadCommerce();
      paint('Alteração salva.');
    } catch (error) {
      if (!disposed) notice(saved ? 'A alteração foi salva, mas a atualização da tela falhou. Reabra esta página antes de repetir a ação.' : commerceError(error), true);
    } finally {
      busy = false;
      if (!disposed) controls.forEach(b => { b.disabled = false; });
    }
  }
  const submit = event => {
    const form = event.target.closest('form[data-command]');
    if (!form) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    if (data['invite-email']) { data.email = data['invite-email']; delete data['invite-email']; }
    if (data.token) data.token = data.token.trim();
    void run(form.dataset.command, data);
  };
  const click = async event => {
    const target = event.target.closest('[data-action]');
    if (!target || busy) return;
    const { action, id } = target.dataset;
    if (action === 'copy') {
      try { await navigator.clipboard.writeText(state.invitations.find(i => i.id === id).token); notice('Código copiado. Compartilhe com o destinatário.'); }
      catch { notice('Selecione e copie o código exibido no convite.', true); }
      return;
    }
    if (['end_membership','revoke_invite'].includes(action)) {
      const accepted = await showConfirmModal({ title: action === 'end_membership' ? 'Encerrar vínculo?' : 'Cancelar convite?', message: action === 'end_membership' ? 'A pessoa não poderá atuar pela empresa. O histórico será preservado.' : 'Este código não poderá mais ser utilizado.', confirmLabel: 'Confirmar', danger: true });
      if (!accepted || disposed) return;
    }
    await run(action, { [action === 'select_seller' ? 'seller_id' : action === 'end_membership' ? 'membership_id' : 'invitation_id']: id });
  };
  try { state = await loadCommerce(); paint(); }
  catch (error) {
    app.innerHTML = shell('<section class="commerce-card"><h2>Não foi possível abrir o modo consultor</h2><p id="commerce-load-error" role="alert"></p><a class="button button--secondary" href="/consultor" data-link>Tentar novamente</a><a class="button button--secondary" href="/dashboard" data-link>Voltar ao produtor</a></section>');
    app.querySelector('#commerce-load-error').textContent = commerceError(error);
  }
  app.addEventListener('submit', submit);
  app.addEventListener('click', click);
  return () => { disposed = true; app.removeEventListener('submit', submit); app.removeEventListener('click', click); };
}
