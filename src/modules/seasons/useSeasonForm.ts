import { reactive, ref, watch, onScopeDispose } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchSeason, fetchActiveProperties, saveSeason } from './seasonRepository';
import { seasonFields, validateSeason, isArchived } from './seasonModel';
import { getDataErrorMessage } from '../../services/dataErrorService.js';
export function useSeasonForm(
  id: string | undefined,
  requestedProperty: string,
  saved: (id: string) => void,
) {
  const record = useResource(() => (id ? fetchSeason(id) : Promise.resolve(null)), null);
  const properties = useResource(fetchActiveProperties, []);
  const fields = reactive(seasonFields(null, requestedProperty));
  const busy = ref(false),
    feedback = ref('');
  let disposed = false;
  watch(record.data, (item) => {
    if (item) Object.assign(fields, seasonFields(item));
  });
  async function submit() {
    if (
      disposed ||
      busy.value ||
      record.loading.value ||
      record.error.value ||
      properties.loading.value ||
      properties.error.value ||
      (id && (!record.data.value || isArchived(record.data.value)))
    )
      return;
    feedback.value = validateSeason(fields, properties.data.value);
    if (feedback.value) return;
    busy.value = true;
    try {
      const result = await saveSeason(id, { ...fields });
      if (!disposed) saved(result);
    } catch (cause) {
      if (!disposed) feedback.value = getDataErrorMessage(cause);
    } finally {
      if (!disposed) busy.value = false;
    }
  }
  onScopeDispose(() => {
    disposed = true;
  });
  return { record, properties, fields, busy, feedback, submit };
}
