export const HARVEST_FORECAST_FILTERS = [
  ['all', 'Todos'],
  ['overdue', 'Atrasados'],
  ['today', 'Hoje'],
  ['harvest_week', '7 dias'],
  ['upcoming', 'Próximos'],
];

export function getHarvestForecastState(
  daysToHarvest,
) {
  if (
    daysToHarvest === null ||
    daysToHarvest === undefined
  ) {
    return 'no_forecast';
  }

  if (daysToHarvest < 0) {
    return 'overdue';
  }

  if (daysToHarvest === 0) {
    return 'today';
  }

  if (daysToHarvest <= 7) {
    return 'harvest_week';
  }

  return 'upcoming';
}

export function getHarvestForecastLabel(
  state,
) {
  switch (state) {
    case 'overdue':
      return 'Previsão atrasada';

    case 'today':
      return 'Previsto para hoje';

    case 'harvest_week':
      return 'Semana da colheita';

    case 'upcoming':
      return 'Próxima colheita';

    default:
      return 'Sem previsão';
  }
}

export function getHarvestForecastClass(
  state,
) {
  return `harvest-forecast-status--${state}`;
}
