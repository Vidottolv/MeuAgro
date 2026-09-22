export const PRODUCTION_CYCLE_STATUSES = [
  ['planned', 'Planejado'],
  ['planted', 'Plantado'],
  ['developing', 'Em desenvolvimento'],
  ['near_harvest', 'Próximo da colheita'],
  ['ready_to_harvest', 'Pronto para colher'],
  ['harvested', 'Colhido'],
  ['closed', 'Encerrado'],
  ['cancelled', 'Cancelado'],
];

export const OPEN_PRODUCTION_CYCLE_STATUSES = [
  'planned',
  'planted',
  'developing',
  'near_harvest',
  'ready_to_harvest',
];

export function getProductionCycleStatusLabel(status) {
  return (
    PRODUCTION_CYCLE_STATUSES.find(
      ([value]) => value === status,
    )?.[1] ||
    status ||
    'Não informado'
  );
}

export function getProductionCycleStatusClass(status) {
  switch (status) {
    case 'planned':
      return 'cycle-status--planned';
    case 'planted':
      return 'cycle-status--planted';
    case 'developing':
      return 'cycle-status--developing';
    case 'near_harvest':
      return 'cycle-status--near-harvest';
    case 'ready_to_harvest':
      return 'cycle-status--ready';
    case 'harvested':
      return 'cycle-status--harvested';
    case 'closed':
      return 'cycle-status--closed';
    case 'cancelled':
      return 'cycle-status--cancelled';
    default:
      return 'cycle-status--planned';
  }
}
