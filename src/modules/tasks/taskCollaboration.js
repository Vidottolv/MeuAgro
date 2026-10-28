import { localDay } from '../visits/visitFollowup.js';
import { taskOpen, taskStatuses } from './taskModel.js';
export function checklistProgress(items = []) {
  return { done: items.filter((i) => i.done).length, total: items.length };
}
export function validateChecklist(items) {
  if (!Array.isArray(items) || items.length > 20)
    throw Error('Adicione até 20 itens ao checklist.');
  const seen = new Set();
  return items.map((i) => {
    if (
      !i ||
      typeof i.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(i.id) ||
      seen.has(i.id) ||
      typeof i.label !== 'string' ||
      !i.label.trim() ||
      i.label.length > 160 ||
      typeof i.done !== 'boolean'
    )
      throw Error('Confira os textos e os identificadores dos itens do checklist.');
    seen.add(i.id);
    return { id: i.id, label: i.label.trim(), done: i.done };
  });
}
export function responsibleSummary(tasks, now = new Date()) {
  const groups = new Map(),
    today = localDay(now);
  for (const task of tasks) {
    const key = (task.seller_id || 'personal') + ':' + task.assigned_to;
    if (!groups.has(key))
      groups.set(key, {
        key,
        assigned_to: task.assigned_to,
        name: task.assigned_name,
        company: task.seller_id ? task.company_name || 'Empresa vinculada' : 'Pessoal',
        total: 0,
        open: 0,
        overdue: 0,
        done: 0,
        remaining: 0,
      });
    const g = groups.get(key);
    g.total++;
    if (taskOpen(task)) {
      g.open++;
      if (task.due_date < today) g.overdue++;
      g.remaining += (task.checklist || []).filter((i) => !i.done).length;
    }
    if (task.status === 'done') g.done++;
  }
  return [...groups.values()].sort(
    (a, b) => b.overdue - a.overdue || b.open - a.open || a.name.localeCompare(b.name),
  );
}
export function kanbanGroups(tasks) {
  return Object.entries(taskStatuses).map(([key, title]) => ({
    key,
    title,
    items: tasks.filter((t) => t.status === key),
  }));
}
const cell = (value) => {
  let s = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/u.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
};
export function responsibleCsv(rows) {
  return (
    '\uFEFF' +
    [
      [
        'Responsável',
        'Contexto',
        'Total',
        'Abertas',
        'Atrasadas',
        'Concluídas',
        'Itens pendentes em tarefas abertas',
      ],
      ...rows.map((g) => [g.name, g.company, g.total, g.open, g.overdue, g.done, g.remaining]),
    ]
      .map((r) => r.map(cell).join(';'))
      .join('\r\n')
  );
}
