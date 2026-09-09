import {
  appShell,
} from '../../components/appShell.js';
import {
  moreItem,
} from '../../components/moreItem.js';

export function renderMorePage({
  session,
}) {
  const app =
    document.querySelector('#app');

  app.innerHTML =
    appShell({
      session,
      title: 'Mais',
      eyebrow: 'Meu Agro',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Mais recursos
            </p>

            <h2>
              Gestão e configurações
            </h2>

            <p>
              Acesse cadastros complementares, produção, vendas e sua conta.
            </p>
          </div>
        </section>

        <section class="more-list">
          <p class="more-list__label">
            Produção
          </p>

          ${moreItem({
            iconName: 'calendar',
            title: 'Safras',
            description: 'Agrupe ciclos produtivos',
            href: '/more/seasons',
          })}

          ${moreItem({
            iconName: 'leaf',
            title: 'Culturas',
            description: 'Ciclos médios e variedades',
            href: '/more/crops',
          })}

          ${moreItem({
            iconName: 'users',
            title: 'Consultores',
            description: 'Contatos agrícolas e WhatsApp',
            href: '/more/consultants',
          })}

          ${moreItem({
            iconName: 'harvest',
            title: 'Colheitas',
            description: 'Registros e produtividade',
            href: '/more/harvests',
          })}
        </section>

        <section class="more-list">
          <p class="more-list__label">
            Gestão
          </p>

          ${moreItem({
            iconName: 'cart',
            title: 'Vendas',
            description: 'Destino e comercialização',
            href: '/more/sales',
          })}

          ${moreItem({
            iconName: 'chart',
            title: 'Financeiro',
            description: 'Custos e resultados',
            href: '/more/finance',
          })}
        </section>

        <section class="more-list">
          <p class="more-list__label">
            Conta
          </p>

          ${moreItem({
            iconName: 'settings',
            title: 'Configurações',
            description: 'Preferências do aplicativo',
            href: '/more/settings',
          })}

          ${moreItem({
            iconName: 'user',
            title: 'Perfil',
            description: 'Sua conta e sessão',
            href: '/more/profile',
          })}
        </section>
      `,
    });

  return null;
}
