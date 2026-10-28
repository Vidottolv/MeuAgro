import { taskDate, taskPriorities } from '../tasks/taskModel.js';
const uuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function visitObservations(items = [], propertyId = null, visitedDay = '') {
  if (!Array.isArray(items) || items.length > 20)
    throw Error('Adicione até 20 observações por visita.');
  const seen = new Set();
  return items.map((item) => {
    if (!item || !uuid(item.id) || seen.has(item.id))
      throw Error('Identificador inválido ou duplicado nas observações.');
    seen.add(item.id);
    const area_id = item.area_id || null,
      crop_id = item.crop_id || null;
    if (area_id && (!uuid(area_id) || !uuid(propertyId)))
      throw Error('Selecione a propriedade da visita antes de vincular o talhão da observação.');
    if (crop_id && !uuid(crop_id)) throw Error('Cultura inválida na observação.');
    const text = (key, max, minimum = 0) => {
      const value = item[key] ?? '';
      if (typeof value !== 'string' || value.trim().length < minimum || value.length > max)
        throw Error('Confira os textos e limites das observações por talhão.');
      return value.trim();
    };
    if (!Object.hasOwn(taskPriorities, item.priority))
      throw Error('Selecione a prioridade da observação.');
    const next = item.next_visit || null;
    if (next && (!taskDate(next) || next < visitedDay))
      throw Error('O retorno da observação deve ser uma data válida igual ou posterior à visita.');
    return {
      id: item.id,
      area_id,
      crop_id,
      area_name: text('area_name', 160, 2),
      crop_name: text('crop_name', 120),
      observation: text('observation', 2000, 2),
      recommendation: text('recommendation', 2000),
      priority: item.priority,
      next_visit: next,
    };
  });
}
const cell = (value) => {
  let s = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/u.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
};
export function observationsCsv(visit) {
  return (
    '\uFEFF' +
    [
      [
        'Visita',
        'Observação (ID)',
        'Produtor',
        'Propriedade',
        'Talhão',
        'Cultura',
        'Prioridade',
        'Retorno sugerido',
        'Observação',
        'Ação recomendada',
      ],
      ...(visit.field_observations || []).map((i) => [
        visit.id,
        i.id,
        visit.producer_name,
        visit.site_name,
        i.area_name,
        i.crop_name,
        taskPriorities[i.priority],
        i.next_visit,
        i.observation,
        i.recommendation,
      ]),
    ]
      .map((row) => row.map(cell).join(';'))
      .join('\r\n')
  );
}
