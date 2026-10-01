import { ref, watch, onScopeDispose } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { cycle, events, savePhoto } from './productionRepository';
import { useMutation } from './useMutation';
import { localDateTime } from './productionModel';
import { validatePhotoFile } from '../../services/photoService.js';
import {
  isNativeCameraPlatform,
  takePhotoWithCamera,
  choosePhotoFromGallery,
} from '../../services/cameraService.js';
import { toDateTimeLocalValue } from '../../js/html.js';
import { getDataErrorMessage } from '../../services/dataErrorService.js';
export function usePhotoForm(id: string, saved: () => void) {
  const planting = useResource(() => cycle(id), null),
    options = useResource(() => events(id), []);
  const eventId = ref(new URLSearchParams(location.search).get('event') || '__auto__'),
    capturedAt = ref(toDateTimeLocalValue(new Date())),
    description = ref(''),
    file = ref<File | null>(null),
    preview = ref(''),
    picking = ref(false);
  const mutation = useMutation(),
    native = isNativeCameraPlatform();
  let disposed = false;
  function setFile(value: File) {
    if (disposed || mutation.busy.value || mutation.done.value) return;
    const error = validatePhotoFile(value);
    mutation.error.value = error || '';
    if (error) return;
    if (preview.value) URL.revokeObjectURL(preview.value);
    file.value = value;
    preview.value = URL.createObjectURL(value);
  }
  async function pick(source: 'camera' | 'gallery') {
    if (picking.value || mutation.busy.value || mutation.done.value) return;
    picking.value = true;
    try {
      const selected = await (source === 'camera'
        ? takePhotoWithCamera()
        : choosePhotoFromGallery());
      if (selected && !disposed) {
        setFile(selected.file);
        if (selected.capturedAt && eventId.value === '__auto__')
          capturedAt.value = toDateTimeLocalValue(selected.capturedAt);
      }
    } catch (error) {
      if (
        !disposed &&
        !String((error as Error)?.message || '')
          .toLowerCase()
          .includes('cancel')
      )
        mutation.error.value = getDataErrorMessage(error);
    } finally {
      if (!disposed) picking.value = false;
    }
  }
  watch(eventId, (value) => {
    const selected = options.data.value.find((e) => e.id === value);
    if (selected) capturedAt.value = toDateTimeLocalValue(new Date(selected.occurred_at));
  });
  function submit() {
    const p = planting.data.value;
    if (
      !p ||
      p.deleted_at ||
      planting.loading.value ||
      planting.error.value ||
      options.loading.value ||
      options.error.value ||
      picking.value
    )
      return;
    mutation.error.value =
      validatePhotoFile(file.value) ||
      (!localDateTime(capturedAt.value)
        ? 'Informe data e horário válidos.'
        : description.value.trim().length > 800
          ? 'A descrição deve ter até 800 caracteres.'
          : eventId.value &&
              eventId.value !== '__auto__' &&
              !options.data.value.some(
                (e) => e.id === eventId.value && e.production_cycle_id === id,
              )
            ? 'Selecione um evento deste plantio.'
            : '');
    if (mutation.error.value || !file.value) return;
    const snapshot = {
      file: file.value,
      eventId: eventId.value,
      description: description.value,
      date: capturedAt.value,
    };
    void mutation.run(
      () => savePhoto(p, snapshot.file, snapshot.eventId, snapshot.description, snapshot.date),
      saved,
    );
  }
  onScopeDispose(() => {
    disposed = true;
    if (preview.value) URL.revokeObjectURL(preview.value);
  });
  return {
    planting,
    options,
    eventId,
    capturedAt,
    description,
    preview,
    picking,
    mutation,
    native,
    setFile,
    pick,
    submit,
  };
}
