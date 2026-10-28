import { anamnesisFields } from './visitModel.js';
export function templatePayload(name, anamnesis) {
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100)
    throw Error('Dê ao modelo um nome de 2 a 100 caracteres.');
  const data = Object.fromEntries(
    anamnesisFields.map(([key]) => {
      const text = anamnesis?.[key] || '';
      if (typeof text !== 'string' || text.length > 4000)
        throw Error('Cada campo do modelo deve ter até 4.000 caracteres.');
      return [key, text.trim()];
    }),
  );
  if (!Object.values(data).some((text) => text.length))
    throw Error('Preencha ao menos um campo da anamnese antes de salvar um modelo.');
  return { name: name.trim(), anamnesis: data };
}
export function applyEmptyTemplate(current, template) {
  let filled = 0;
  const data = { ...current };
  for (const [key] of anamnesisFields) {
    if (!String(data[key] || '').trim() && template.anamnesis?.[key]?.trim()) {
      data[key] = template.anamnesis[key];
      filled++;
    }
  }
  return { data, filled };
}
