export const INPUT_CATEGORIES = [
  ['seeds', 'Sementes'],
  ['seedlings', 'Mudas'],
  ['fertilizers', 'Fertilizantes'],
  ['manures', 'Adubos'],
  ['herbicides', 'Herbicidas'],
  ['fungicides', 'Fungicidas'],
  ['insecticides', 'Inseticidas'],
  ['defensives', 'Defensivos'],
  ['biologicals', 'Produtos biológicos'],
  ['soil_amendments', 'Corretivos'],
  ['other', 'Outros'],
];

export function getInputCategoryLabel(
  value,
) {
  return (
    INPUT_CATEGORIES.find(
      ([key]) => key === value,
    )?.[1] ||
    value ||
    'Não informada'
  );
}
