export const BRAZIL_STATES = [
  ['AC', 'Acre'],
  ['AL', 'Alagoas'],
  ['AP', 'Amapá'],
  ['AM', 'Amazonas'],
  ['BA', 'Bahia'],
  ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'],
  ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'],
  ['MA', 'Maranhão'],
  ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'],
  ['PA', 'Pará'],
  ['PB', 'Paraíba'],
  ['PR', 'Paraná'],
  ['PE', 'Pernambuco'],
  ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'],
  ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'],
  ['RR', 'Roraima'],
  ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'],
  ['SE', 'Sergipe'],
  ['TO', 'Tocantins'],
];

export const PROPERTY_AREA_UNITS = [
  ['hectare', 'Hectare (ha)'],
  ['alqueire_paulista', 'Alqueire paulista'],
  ['alqueire_mineiro', 'Alqueire mineiro'],
  ['alqueire_baiano', 'Alqueire baiano'],
  ['metro_quadrado', 'Metro quadrado (m²)'],
  ['quilometro_quadrado', 'Quilômetro quadrado (km²)'],
  ['outro', 'Outra unidade'],
];

export function getAreaUnitLabel(value) {
  return (
    PROPERTY_AREA_UNITS.find(
      ([key]) => key === value,
    )?.[1] ||
    value ||
    ''
  );
}
