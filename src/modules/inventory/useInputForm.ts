import { computed, onMounted, onScopeDispose, ref } from 'vue';
import { getDataErrorMessage } from '../../services/dataErrorService.js';
import { createInputDraft, inputPayload, validateInputDraft } from './inputFormModel';
import { fetchInput, saveInput } from './inputFormRepository';

export function useInputForm(id: string | undefined, onSaved: (id: string) => void) {
  const draft = ref(createInputDraft());
  const loading = ref(Boolean(id));
  const saving = ref(false);
  const loadError = ref('');
  const saveError = ref('');
  const notFound = ref(false);
  const submitted = ref(false);
  let disposed = false;
  let request = 0;
  const errors = computed(() => (submitted.value ? validateInputDraft(draft.value) : {}));

  async function load() {
    if (!id) return;
    const current = ++request;
    loading.value = true;
    loadError.value = '';
    notFound.value = false;
    try {
      const input = await fetchInput(id);
      if (disposed || current !== request) return;
      if (!input) notFound.value = true;
      else draft.value = createInputDraft(input);
    } catch {
      if (!disposed && current === request)
        loadError.value =
          'Não foi possível carregar o insumo. Confira sua conexão e tente novamente.';
    } finally {
      if (!disposed && current === request) loading.value = false;
    }
  }

  async function submit() {
    if (disposed || saving.value || loading.value || loadError.value || notFound.value) return;
    submitted.value = true;
    saveError.value = '';
    if (Object.keys(errors.value).length) return;
    saving.value = true;
    try {
      const saved = await saveInput(id, inputPayload(draft.value));
      if (!disposed) onSaved(saved.id);
    } catch (error) {
      if (!disposed)
        saveError.value = getDataErrorMessage(
          error,
          'Não foi possível salvar. Confira sua conexão e tente novamente.',
        );
    } finally {
      if (!disposed) saving.value = false;
    }
  }

  onMounted(load);
  onScopeDispose(() => {
    disposed = true;
    request++;
  });
  return { draft, loading, saving, loadError, saveError, notFound, errors, load, submit };
}
