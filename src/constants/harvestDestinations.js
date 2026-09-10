export const HARVEST_DESTINATIONS = [
  ['own_consumption', 'Consumo próprio'],
  ['sale', 'Venda'],
  [
    'own_consumption_and_sale',
    'Consumo próprio e venda',
  ],
  ['donation', 'Doação'],
  ['loss', 'Perda'],
  ['other', 'Outro'],
];

export function getHarvestDestinationLabel(
  destination,
) {
  return (
    HARVEST_DESTINATIONS.find(
      ([value]) =>
        value === destination,
    )?.[1] ||
    destination ||
    'Não informado'
  );
}

export function harvestAllowsSales(
  destination,
) {
  return [
    'sale',
    'own_consumption_and_sale',
  ].includes(destination);
}
