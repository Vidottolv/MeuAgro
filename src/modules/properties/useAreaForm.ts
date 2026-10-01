import { reactive, ref, computed, watch, onScopeDispose } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { fetchAreaContext, fetchTypes, saveArea } from './ruralRepository';
import { isArchived, validateArea } from './ruralModel';
import { getDataErrorMessage } from '../../services/dataErrorService.js';
import type { AreaFields, AreaType } from './ruralTypes';
export function useAreaForm(
  propertyId: string,
  areaId: string | undefined,
  saved: (id: string) => void,
) {
  const resource = useResource(() => fetchAreaContext(propertyId, areaId), {
    property: null,
    area: null,
  });
  const types = useResource(fetchTypes, []);
  const fields = reactive<AreaFields>({
    name: '',
    areaTypeId: '',
    description: '',
    size: '',
    unit: '',
    locationDescription: '',
    notes: '',
  });
  const busy = ref(false),
    feedback = ref(''),
    typeOpen = ref(false);
  let disposed = false;
  const blocked = computed(
    () =>
      !resource.data.value.property ||
      isArchived(resource.data.value.property) ||
      Boolean(areaId && (!resource.data.value.area || isArchived(resource.data.value.area))),
  );
  watch(resource.data, ({ area }) => {
    if (area)
      Object.assign(fields, {
        name: area.name,
        areaTypeId: area.area_type_id || '',
        description: area.description || '',
        size: String(area.size ?? ''),
        unit: area.unit || '',
        locationDescription: area.location_description || '',
        notes: area.notes || '',
      });
  });
  function typeCreated(item: AreaType) {
    types.data.value = [...types.data.value.filter((type) => type.id !== item.id), item].sort(
      (a, b) => Number(b.is_system) - Number(a.is_system) || a.name.localeCompare(b.name, 'pt-BR'),
    );
    fields.areaTypeId = item.id;
    typeOpen.value = false;
  }
  async function submit() {
    if (
      busy.value ||
      typeOpen.value ||
      resource.loading.value ||
      resource.error.value ||
      disposed ||
      blocked.value
    )
      return;
    if (types.loading.value || types.error.value) {
      feedback.value = 'Carregue os tipos de área antes de salvar.';
      return;
    }
    feedback.value = validateArea(fields, types.data.value);
    if (feedback.value) return;
    busy.value = true;
    try {
      const id = await saveArea(propertyId, areaId, { ...fields });
      if (!disposed) saved(id);
    } catch (cause) {
      if (!disposed) feedback.value = getDataErrorMessage(cause);
    } finally {
      if (!disposed) busy.value = false;
    }
  }
  onScopeDispose(() => {
    disposed = true;
  });
  return { ...resource, types, fields, busy, feedback, blocked, typeOpen, typeCreated, submit };
}
