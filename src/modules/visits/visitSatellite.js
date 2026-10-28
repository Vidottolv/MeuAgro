const uuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function visitSatelliteReference(reference, property, area) {
  if (!reference) return null;
  if (
    !uuid(reference.image_id) ||
    !uuid(property) ||
    !uuid(area) ||
    reference.property_id !== property ||
    reference.area_id !== area
  )
    throw Error('A imagem de satélite deve pertencer ao talhão selecionado para a visita.');
  if (
    !['ndvi', 'rgb'].includes(reference.layer) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(reference.day || '') ||
    new Date(reference.day + 'T00:00:00Z').toISOString().slice(0, 10) !== reference.day
  )
    throw Error('Referência de imagem inválida. Selecione a imagem novamente.');
  if (typeof reference.note !== 'string' || reference.note.length > 2000)
    throw Error('A observação sobre a imagem deve ter até 2.000 caracteres.');
  // Keep only descriptive fields; never persist private paths, URLs or image bytes.
  return {
    image_id: reference.image_id,
    property_id: property,
    area_id: area,
    day: reference.day,
    layer: reference.layer,
    acquisition_at:
      typeof reference.acquisition_at === 'string' ? reference.acquisition_at.slice(0, 40) : null,
    scene_cloud_percent: Number.isFinite(reference.scene_cloud_percent)
      ? reference.scene_cloud_percent
      : null,
    resolution_m: Number.isFinite(reference.resolution_m) ? reference.resolution_m : null,
    source:
      typeof reference.source === 'string'
        ? reference.source.slice(0, 160)
        : 'Copernicus Sentinel-2',
    note: reference.note.trim(),
  };
}
