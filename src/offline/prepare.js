import { offlineStore, offlineUserId, isOnline, withFreshOfflineReads } from './runtime.js';
import { Capacitor } from '@capacitor/core';
// Use the same services and query shapes as the field screens, including detail routes.
export function prepareFieldData(progress = () => {}) {
  return withFreshOfflineReads(() => downloadFieldData(progress));
}
async function downloadFieldData(progress) {
  if (!isOnline()) throw Error('Conecte-se para preparar os dados de campo.');
  const user = offlineUserId();
  if (!user) throw Error('Entre na sua conta antes de preparar os dados.');
  if (import.meta.env.PROD && !Capacitor.isNativePlatform()) {
    if (!('serviceWorker' in navigator))
      throw Error(
        'Este navegador não oferece abertura offline. Use um navegador compatível ou o aplicativo Android.',
      );
    progress('Preparando a abertura do aplicativo sem internet…');
    let timer;
    try {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                Error(
                  'A abertura offline ainda não foi preparada. Confira a conexão e tente novamente.',
                ),
              ),
            30000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  const properties = await import('../services/propertyService.js');
  const areas = await import('../services/areaService.js');
  const cycles = await import('../services/productionCycleService.js');
  const events = await import('../services/productionEventService.js');
  const photos = await import('../services/photoService.js');
  const crops = await import('../services/cropService.js');
  const seasons = await import('../services/seasonService.js');
  const assertAccount = () => {
    if (offlineUserId() !== user || !isOnline())
      throw Error('O preparo foi interrompido. Conecte-se à conta original e tente novamente.');
  };
  const complete = (rows) => {
    if (rows.length >= 1000)
      throw Error(
        'Há muitos registros para o preparo completo nesta versão. O preparo não foi marcado como concluído.',
      );
    return rows;
  };
  progress('Baixando propriedades, áreas e culturas…');
  const allProperties = complete(await properties.listActiveProperties());
  await properties.listArchivedProperties();
  await crops.listCrops();
  await crops.listActiveCrops();
  await areas.listAreaTypes();
  await seasons.listSeasons();
  for (const property of allProperties) {
    assertAccount();
    await properties.getPropertyById(property.id);
    const allAreas = complete(await areas.listAreasByProperty(property.id));
    await areas.listAreasByProperty(property.id, { limit: 3 });
    await areas.countActiveAreas(property.id);
    await seasons.listSeasons({ propertyId: property.id });
    await seasons.listRecentPropertySeasons(property.id, 3);
    await seasons.countOpenSeasons(property.id);
    for (const area of allAreas) {
      assertAccount();
      await areas.getAreaById(area.id);
      await cycles.listProductionCycles({ areaId: area.id, archived: false, limit: 3 });
      await cycles.countOpenProductionCycles({ areaId: area.id });
    }
    await cycles.listProductionCycles({ propertyId: property.id });
  }
  assertAccount();
  const allCycles = complete(await cycles.listProductionCycles());
  for (let i = 0; i < allCycles.length; i++) {
    assertAccount();
    progress(`Baixando plantios e fotos: ${i + 1} de ${allCycles.length}…`);
    const cycle = allCycles[i];
    await cycles.getProductionCycleById(cycle.id);
    const timeline = complete(await events.listProductionEvents(cycle.id));
    for (const event of timeline) {
      assertAccount();
      await events.getProductionEventById(event.id);
    }
    const gallery = complete(await photos.listCyclePhotos(cycle.id));
    for (const photo of gallery) {
      assertAccount();
      // Preparation must report an incomplete download, rather than silently promise offline photos.
      if (!(await photos.offlinePhotoAvailable(photo)))
        throw Error(
          'Uma foto não foi baixada. Tente preparar os dados novamente antes de sair para o campo.',
        );
    }
  }
  assertAccount();
  progress('Baixando seu histórico de visitas técnicas…');
  const { prepareTechnicalVisits } = await import('../services/technicalVisitService.js');
  await prepareTechnicalVisits();
  assertAccount();
  const prepared = new Date().toISOString();
  await offlineStore.batch([[`${user}:prepared`, prepared]]);
  globalThis.dispatchEvent(new Event('meu-agro-offline-changed'));
  return prepared;
}
