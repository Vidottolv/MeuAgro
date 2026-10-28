import proj4 from 'proj4';
export function parseCoordinates(text, system = 'WGS84', zone = 23, hemisphere = 'S') {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((s) => s.trim());
  if (!lines.length || lines.length > 200)
    throw Error('Informe de 1 a 200 vértices, um por linha.');
  if (!['WGS84', 'SIRGAS2000', 'UTM-SIRGAS2000', 'UTM-WGS84'].includes(system))
    throw Error('Sistema de referência inválido.');
  const utm = system.startsWith('UTM');
  if (
    utm &&
    (!Number.isInteger(Number(zone)) || zone < 1 || zone > 60 || !['N', 'S'].includes(hemisphere))
  )
    throw Error('Informe fuso UTM de 1 a 60 e hemisfério.');
  const points = lines.map((line) => {
    const parts = line
      .trim()
      .split(/[;\s]+/)
      .map((n) => Number(n.replace(',', '.')));
    if (parts.length !== 2 || !parts.every(Number.isFinite))
      throw Error('Use dois números por linha: latitude;longitude ou, em UTM, leste;norte.');
    if (!utm) return [parts[1], parts[0]];
    if (parts[0] < 100000 || parts[0] > 900000 || parts[1] < 0 || parts[1] > 10000000)
      throw Error('Coordenadas UTM fora do intervalo aceito.');
    return proj4(
      `+proj=utm +zone=${Number(zone)} ${hemisphere === 'S' ? '+south' : ''} +ellps=${system.endsWith('SIRGAS2000') ? 'GRS80' : 'WGS84'} +units=m +no_defs`,
      'EPSG:4326',
      parts,
    );
  });
  const closed = JSON.stringify(points[0]) === JSON.stringify(points.at(-1));
  return normalizeGeometry(
    points.length === 1
      ? { type: 'Point', coordinates: points[0] }
      : { type: 'Polygon', coordinates: [closed ? points : [...points, points[0]]] },
  );
}
export function normalizeGeometry(input) {
  if (input?.crs || input?.geometry?.crs)
    throw Error(
      'Converta o arquivo para GeoJSON WGS84 antes de importar; CRS legado não é aceito.',
    );
  let geometry = input?.type === 'Feature' ? input.geometry : input;
  if (geometry?.type === 'FeatureCollection' && geometry.features?.length === 1)
    geometry = geometry.features[0].geometry;
  if (!geometry || !['Point', 'Polygon'].includes(geometry.type))
    throw Error('Use um ponto ou um polígono GeoJSON simples.');
  const points = geometry.type === 'Point' ? [geometry.coordinates] : geometry.coordinates?.[0];
  if (
    geometry.type === 'Polygon' &&
    (geometry.coordinates?.length !== 1 ||
      !Array.isArray(points) ||
      points.length < 4 ||
      points.length > 201)
  )
    throw Error('Use um polígono fechado com 3 a 200 vértices, sem furos.');
  if (
    !Array.isArray(points) ||
    points.some(
      (p) =>
        !Array.isArray(p) ||
        p.length !== 2 ||
        !p.every(Number.isFinite) ||
        Math.abs(p[0]) > 180 ||
        Math.abs(p[1]) > 85,
    )
  )
    throw Error('Coordenadas inválidas. GeoJSON usa longitude e latitude, em graus.');
  if (geometry.type === 'Polygon' && JSON.stringify(points[0]) !== JSON.stringify(points.at(-1)))
    throw Error('O primeiro e o último vértice devem ser iguais.');
  return { type: geometry.type, coordinates: JSON.parse(JSON.stringify(geometry.coordinates)) };
}
export function coordinatesText(geometry) {
  const points =
    geometry.type === 'Point' ? [geometry.coordinates] : geometry.coordinates[0].slice(0, -1);
  return points.map((p) => `${p[1].toFixed(7)};${p[0].toFixed(7)}`).join('\n');
}
