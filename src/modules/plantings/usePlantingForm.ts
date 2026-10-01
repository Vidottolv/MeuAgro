import { reactive, ref, watch, onScopeDispose } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchForm, fetchLinks, savePlanting, forecast } from './plantingRepository';
import { fieldsFrom, validatePlanting, isArchived } from './plantingModel';
import { validDate } from '../seasons/seasonModel';
import { getDataErrorMessage } from '../../services/dataErrorService.js';
export function usePlantingForm(
  id: string | undefined,
  query: URLSearchParams,
  saved: (id: string) => void,
) {
  const base = useResource(() => fetchForm(id), { item: null, properties: [], crops: [] });
  const fields = reactive(fieldsFrom());
  if (!id)
    Object.assign(fields, {
      propertyId: query.get('property') || '',
      areaId: query.get('area') || '',
      seasonId: query.get('season') || '',
    });
  const links = useResource(() => fetchLinks(fields.propertyId), { areas: [], seasons: [] }, false);
  const busy = ref(false),
    feedback = ref(''),
    forecastBusy = ref(false),
    forecastMessage = ref('');
  let disposed = false,
    sequence = 0;
  watch(base.data, (data) => {
    if (data.item) Object.assign(fields, fieldsFrom(data.item));
  });
  watch(
    () => fields.propertyId,
    () => {
      links.reset();
      void links.reload();
    },
    { immediate: true },
  );
  watch(
    () => [fields.cropId, fields.plantingDate],
    () => {
      ++sequence;
      forecastBusy.value = false;
      forecastMessage.value = '';
    },
    { flush: 'sync' },
  );
  function changeProperty(value: string) {
    fields.areaId = '';
    fields.seasonId = '';
    fields.propertyId = value;
  }
  async function recalculate() {
    if (busy.value || forecastBusy.value || disposed) return;
    if (!fields.cropId || !validDate(fields.plantingDate)) {
      forecastMessage.value = 'Selecione a cultura e informe uma data de plantio válida.';
      return;
    }
    const current = ++sequence,
      previous = { initial: fields.initialHarvestForecast, current: fields.currentHarvestForecast };
    forecastBusy.value = true;
    forecastMessage.value = '';
    try {
      const result = await forecast(fields.cropId, fields.plantingDate);
      if (disposed || current !== sequence) return;
      if (!result) {
        forecastMessage.value = 'A cultura não possui ciclo médio para sugerir a colheita.';
        return;
      }
      if (!validDate(result) || result < fields.plantingDate)
        throw new Error('Não foi possível obter uma previsão válida. Informe a data manualmente.');
      if (
        previous.current !== fields.currentHarvestForecast ||
        previous.initial !== fields.initialHarvestForecast
      ) {
        forecastMessage.value =
          'As datas foram alteradas durante a consulta. Seus valores foram mantidos.';
        return;
      }
      if (!fields.initialHarvestForecast) fields.initialHarvestForecast = result;
      fields.currentHarvestForecast = result;
      forecastMessage.value = 'Previsão atualizada pelo ciclo médio da cultura.';
    } catch (cause) {
      if (!disposed && current === sequence) forecastMessage.value = getDataErrorMessage(cause);
    } finally {
      if (!disposed && current === sequence) forecastBusy.value = false;
    }
  }
  async function submit() {
    if (
      disposed ||
      busy.value ||
      forecastBusy.value ||
      base.loading.value ||
      base.error.value ||
      links.loading.value ||
      links.error.value ||
      (id && (!base.data.value.item || isArchived(base.data.value.item)))
    )
      return;
    feedback.value = validatePlanting(
      fields,
      base.data.value.properties,
      base.data.value.crops,
      links.data.value,
      base.data.value.item?.crop_id,
    );
    if (feedback.value) return;
    busy.value = true;
    try {
      const result = await savePlanting(id, { ...fields });
      if (!disposed) saved(result);
    } catch (cause) {
      if (!disposed) feedback.value = getDataErrorMessage(cause);
    } finally {
      if (!disposed) busy.value = false;
    }
  }
  onScopeDispose(() => {
    disposed = true;
    ++sequence;
  });
  return {
    base,
    links,
    fields,
    busy,
    feedback,
    submit,
    changeProperty,
    recalculate,
    forecastBusy,
    forecastMessage,
  };
}
