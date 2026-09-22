export const AREA_UNITS = [
  ['hectare', 'Hectare (ha)'],
  ['alqueire_paulista', 'Alqueire paulista'],
  ['alqueire_mineiro', 'Alqueire mineiro'],
  ['alqueire_baiano', 'Alqueire baiano'],
  ['metro_quadrado', 'Metro quadrado (m²)'],
  ['quilometro_quadrado', 'Quilômetro quadrado (km²)'],
  ['metro_linear', 'Metro linear (m)'],
  ['unidade', 'Unidade'],
  ['outro', 'Outra unidade'],
];

export function getAreaSizeUnitLabel(
  value,
) {
  return (
    AREA_UNITS.find(
      ([key]) => key === value,
    )?.[1] ||
    value ||
    ''
  );
}
