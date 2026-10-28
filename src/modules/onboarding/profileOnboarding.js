export const onboardingProfiles = [
  ['producer', 'Produtor'],
  ['independent', 'Consultor independente'],
  ['representative', 'Representante de empresa'],
  ['manager', 'Gerente de empresa'],
  ['company', 'Responsável pela empresa'],
];
export function suggestedProfile(context) {
  const companies = context?.companies || [];
  if (companies.some((c) => c.role === 'owner')) return 'company';
  if (companies.some((c) => c.role === 'manager')) return 'manager';
  if (companies.length) return 'representative';
  return context?.counts?.commercial_account ? 'independent' : 'producer';
}
export function profileSteps(profile, context, prepared) {
  const c = context?.counts || {},
    companies = context?.companies || [];
  const step = (id, title, done, href, description, optional = false) => ({
    id,
    title,
    done: !!done,
    href,
    description,
    optional,
  });
  const offline = step(
    'offline',
    'Prepare este dispositivo para o campo',
    prepared,
    '/more/settings',
    'Conectado à internet, prepare os dados e confira a fila antes de sair. A preparação vale para este dispositivo.',
  );
  const personalVisit = step(
    'visit',
    'Registre sua primeira visita pessoal',
    c.personal_visits > 0,
    '/more/visits',
    'Preencha a anamnese e registre o que foi observado. Uma ficha pessoal continua privada até ser compartilhada.',
  );
  const account = step(
    'commercial',
    'Configure sua atuação comercial',
    c.commercial_account,
    '/consultor',
    'Ative o módulo Consultor se também for usar propostas, negociações ou uma empresa.',
    true,
  );
  if (profile === 'producer')
    return [
      step(
        'property',
        'Cadastre sua propriedade',
        c.properties > 0,
        '/properties',
        'Inclua o sítio e organize seus talhões.',
      ),
      step(
        'season',
        'Organize sua safra',
        c.seasons > 0,
        '/more/seasons',
        'Cadastre a safra para organizar a produção.',
      ),
      step(
        'cycle',
        'Registre um plantio',
        c.cycles > 0,
        '/plantings',
        'Vincule o plantio à propriedade, ao talhão e à cultura.',
      ),
      step(
        'input',
        'Cadastre seus insumos',
        c.inputs > 0,
        '/inventory',
        'Use o cadastro ou a importação CSV abaixo; saldos são registrados pelas movimentações.',
        true,
      ),
      offline,
    ];
  if (profile === 'independent')
    return [
      personalVisit,
      step(
        'sharing',
        'Confira o compartilhamento do produtor',
        c.shared_properties > 0,
        '/more/sharing',
        'Para consultar uma propriedade de cliente, o produtor precisa compartilhar o acesso. Não é necessário cadastrá-la como sua.',
        true,
      ),
      account,
      offline,
    ];
  const owns = companies.some((s) => s.role === 'owner');
  const managerRole = companies.some((s) => s.role === 'owner' || s.role === 'manager');
  const manages = managerRole && c.commercial_account;
  const requiredAccount = { ...account, optional: false };
  if (profile === 'company')
    return [
      requiredAccount,
      step(
        'company',
        'Cadastre ou confira sua empresa',
        owns,
        '/consultor',
        'Use uma empresa da qual você é responsável. Escolher este roteiro não cria uma empresa.',
      ),
      step(
        'team',
        'Monte sua equipe',
        c.active_colleagues > 0,
        owns ? '/consultor/equipe' : '/consultor',
        'Convide gerentes e representantes. Somente o responsável autoriza acesso gerencial a custos e comissões.',
      ),
      step(
        'visit',
        'Registre uma visita vinculada à empresa',
        c.company_visits > 0,
        '/more/visits',
        'Escolha a empresa autorizada ao registrar a visita.',
        true,
      ),
      offline,
    ];
  if (profile === 'manager')
    return [
      requiredAccount,
      step(
        'membership',
        'Confirme seu vínculo de gerente',
        managerRole,
        '/consultor',
        'O responsável precisa convidar você como gerente. Aceite o convite com o e-mail confirmado.',
      ),
      step(
        'workspace',
        'Abra a gestão da empresa',
        manages,
        manages ? '/consultor/gestao' : '/consultor',
        'Com vínculo autorizado, acompanhe a equipe e distribua a carteira. Custos e comissões dependem da autorização do responsável.',
      ),
      step(
        'visit',
        'Registre uma visita vinculada à empresa',
        c.company_visits > 0,
        '/more/visits',
        'Registre a visita em seu nome e selecione a empresa autorizada.',
        true,
      ),
      offline,
    ];
  if (profile === 'representative')
    return [
      requiredAccount,
      step(
        'membership',
        'Aceite o convite da empresa',
        companies.length > 0,
        '/consultor',
        'Use o e-mail confirmado do convite. O roteiro não cria vínculo nem libera a carteira de clientes.',
      ),
      step(
        'visit',
        'Registre sua primeira visita pela empresa',
        c.company_visits > 0,
        '/more/visits',
        'Escolha a empresa e o cliente permitido, preencha a anamnese e anexe fotos quando necessário.',
      ),
      step(
        'negotiation',
        'Confira suas negociações',
        companies.length > 0,
        companies.length ? '/consultor/negociacoes' : '/consultor',
        'O vínculo ativo permite abrir a área; a carteira e os dados seguem as permissões da empresa.',
        true,
      ),
      offline,
    ];
  return [];
}
