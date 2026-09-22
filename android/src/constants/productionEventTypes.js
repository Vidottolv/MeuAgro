export const PRODUCTION_EVENT_TYPES = [
  ['planting', 'Plantio', 'sprout'],
  ['irrigation', 'Irrigação', 'droplets'],
  ['manuring', 'Adubação', 'leaf'],
  ['fertilization', 'Fertilização', 'flask'],
  ['spraying', 'Pulverização', 'spray'],
  ['defensive_application', 'Aplicação de defensivo', 'shield'],
  ['weeding', 'Capina', 'sprout'],
  ['pruning', 'Poda', 'scissors'],
  ['pest', 'Ocorrência de praga', 'bug'],
  ['disease', 'Ocorrência de doença', 'alertTriangle'],
  ['analysis', 'Análise', 'chart'],
  ['observation', 'Observação', 'clipboard'],
  ['photo', 'Fotografia', 'camera'],
  ['harvest', 'Colheita', 'harvest'],
  ['other', 'Outro', 'more'],
];

export function getProductionEventTypeLabel(
  eventType,
) {
  return (
    PRODUCTION_EVENT_TYPES.find(
      ([value]) => value === eventType,
    )?.[1] ||
    eventType ||
    'Evento'
  );
}

export function getProductionEventIconName(
  eventType,
) {
  return (
    PRODUCTION_EVENT_TYPES.find(
      ([value]) => value === eventType,
    )?.[2] ||
    'clipboard'
  );
}
