import { reactive, ref, watch, onScopeDispose } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchProperty, saveProperty } from './ruralRepository';
import { isArchived, validateProperty } from './ruralModel';
import { getDataErrorMessage } from '../../services/dataErrorService.js';
import type { PropertyFields } from './ruralTypes';
export function usePropertyForm(id: string | undefined, saved: (id: string) => void) {
  const resource = useResource(() => (id ? fetchProperty(id) : Promise.resolve(null)), null);
  const fields = reactive<PropertyFields>({
    name: '',
    description: '',
    city: '',
    state: '',
    totalArea: '',
    areaUnit: '',
    notes: '',
  });
  const busy = ref(false),
    feedback = ref('');
  let disposed = false;
  watch(resource.data, (item) => {
    if (item)
      Object.assign(fields, {
        name: item.name,
        description: item.description || '',
        city: item.city || '',
        state: item.state || '',
        totalArea: String(item.total_area ?? ''),
        areaUnit: item.area_unit || '',
        notes: item.notes || '',
      });
  });
  async function submit() {
    if (
      busy.value ||
      resource.loading.value ||
      resource.error.value ||
      disposed ||
      (id && (!resource.data.value || isArchived(resource.data.value)))
    )
      return;
    feedback.value = validateProperty(fields);
    if (feedback.value) return;
    busy.value = true;
    try {
      const result = await saveProperty(id, { ...fields });
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
  return { ...resource, fields, busy, feedback, submit };
}
