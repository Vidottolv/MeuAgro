export const PLANTED_UNITS = [
  ['unit', 'Unidade'],
  ['seed', 'Semente'],
  ['seedling', 'Muda'],
  ['kg', 'Quilograma (kg)'],
  ['g', 'Grama (g)'],
  ['bag', 'Saco'],
  ['tray', 'Bandeja'],
  ['meter', 'Metro linear (m)'],
  ['liter', 'Litro (L)'],
  ['other', 'Outra unidade'],
];

export function getPlantedUnitLabel(value) {
  return (
    PLANTED_UNITS.find(([key]) => key === value)?.[1] ||
    value ||
    ''
  );
}
