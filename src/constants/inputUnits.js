export const INPUT_UNITS = [
  ['kg', 'Quilograma (kg)'],
  ['g', 'Grama (g)'],
  ['l', 'Litro (L)'],
  ['ml', 'Mililitro (mL)'],
  ['unit', 'Unidade'],
  ['bag', 'Saco'],
  ['box', 'Caixa'],
  ['bottle', 'Frasco'],
  ['package', 'Pacote'],
  ['seed', 'Semente'],
  ['seedling', 'Muda'],
  ['other', 'Outra unidade'],
];

export function getInputUnitLabel(
  value,
) {
  return (
    INPUT_UNITS.find(
      ([key]) => key === value,
    )?.[1] ||
    value ||
    ''
  );
}
