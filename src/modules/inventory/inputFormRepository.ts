import {
  createAgriculturalInput,
  getAgriculturalInputById,
  updateAgriculturalInput,
} from '../../services/agriculturalInputService.js';
import type { InputRecord } from './inputFormModel';
import { inputPayload } from './inputFormModel';

export async function fetchInput(id: string): Promise<InputRecord | null> {
  return (await getAgriculturalInputById(id)) as InputRecord | null;
}
export async function saveInput(
  id: string | undefined,
  payload: ReturnType<typeof inputPayload>,
): Promise<{ id: string }> {
  const saved = id
    ? await updateAgriculturalInput(id, payload)
    : await createAgriculturalInput(payload);
  if (!saved?.id) throw new Error('Não foi possível confirmar o registro salvo.');
  return saved;
}
