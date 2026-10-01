export const states = {
  open: 'Em andamento',
  all: 'Criadas no período',
  awaiting: 'Nova solicitação',
  awaiting_buyer: 'Aguardando produtor',
  quoted: 'Proposta enviada',
  revision_requested: 'Revisão solicitada',
  confirmed: 'Aguardando entrega',
  awaiting_receipt: 'Aguardando recebimento',
  delivery_issue: 'Divergência na entrega',
  received: 'Recebidas no período',
  declined: 'Recusadas pelo produtor',
  cancelled: 'Canceladas',
  rejected: 'Recusadas pelo vendedor',
  stale: 'Sem movimentação',
  followup_due: 'Retorno vencido',
  quote_expiring: 'Proposta vence em 48h',
  quoted_valid: 'Propostas abertas válidas',
  to_deliver: 'Pedidos a entregar',
};
export const approvalStatus = {
  pending: 'Aguardando aprovação',
  approved: 'Aprovada e enviada',
  rejected: 'Recusada',
  superseded: 'Substituída ou invalidada',
};
export const auditLabels = {
  grant: 'Permissões alteradas',
  settings: 'Limites alterados',
  goal: 'Meta alterada',
  transfer: 'Carteira transferida',
  note: 'Nota interna',
  followup: 'Próxima ação alterada',
  approve: 'Proposta aprovada',
  reject: 'Desconto recusado',
  request_approval: 'Aprovação solicitada',
};
export const localTime = (v) =>
  v
    ? new Date(new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : '';
