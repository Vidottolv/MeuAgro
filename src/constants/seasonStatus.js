export const SEASON_STATUSES = [
  ['planned', 'Planejada'],
  ['active', 'Em andamento'],
  ['closed', 'Encerrada'],
  ['cancelled', 'Cancelada'],
];

export function getSeasonStatusLabel(
  status,
) {
  return (
    SEASON_STATUSES.find(
      ([value]) => value === status,
    )?.[1] ||
    status ||
    'Não informado'
  );
}

export function getSeasonStatusClass(
  status,
) {
  switch (status) {
    case 'active':
      return 'season-status--active';

    case 'closed':
      return 'season-status--closed';

    case 'cancelled':
      return 'season-status--cancelled';

    case 'planned':
    default:
      return 'season-status--planned';
  }
}
