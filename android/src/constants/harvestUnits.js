export const HARVEST_UNITS = [
  ['kg', 'Quilograma (kg)'],
  ['g', 'Grama (g)'],
  ['t', 'Tonelada (t)'],
  ['bag', 'Saca'],
  ['box', 'Caixa'],
  ['crate', 'Engradado'],
  ['unit', 'Unidade'],
  ['dozen', 'Dúzia'],
  ['bunch', 'Maço'],
  ['arroba', 'Arroba'],
  ['liter', 'Litro (L)'],
  ['other', 'Outra unidade'],
];

export function getHarvestUnitLabel(
  value,
) {
  return (
    HARVEST_UNITS.find(
      ([key]) =>
        key === value,
    )?.[1] ||
    value ||
    ''
  );
}
