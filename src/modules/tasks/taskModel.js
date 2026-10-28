import { localDay, returnCalendar } from '../visits/visitFollowup.js';
export const taskStatuses = {
  pending: 'Pendente',
  doing: 'Em andamento',
  done: 'Concluída',
  cancelled: 'Cancelada',
};
export const taskPriorities = { low: 'Baixa', medium: 'Moderada', high: 'Alta', urgent: 'Urgente' };
export const taskOpen = (t) => ['pending', 'doing'].includes(t.status);
export function taskDate(value) {
  const d = new Date(value + 'T12:00:00');
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(d.getTime()) && localDay(d) === value
  );
}
export function taskMatches(t, f = {}, now = new Date()) {
  if (f.responsible && f.responsible !== (t.seller_id || 'personal') + ':' + t.assigned_to)
    return false;
  const today = localDay(now),
    end = new Date(now);
  end.setDate(end.getDate() + 7);
  if (f.status && (f.status === 'open' ? !taskOpen(t) : t.status !== f.status)) return false;
  if (f.priority && t.priority !== f.priority) return false;
  if (f.person === 'mine' && t.assigned_to !== f.user) return false;
  if (f.person === 'created' && t.created_by !== f.user) return false;
  if ((f.from && t.due_date < f.from) || (f.to && t.due_date > f.to)) return false;
  if (f.period === 'overdue' && (!taskOpen(t) || t.due_date >= today)) return false;
  if (f.period === 'today' && t.due_date !== today) return false;
  if (f.period === 'week' && (t.due_date < today || t.due_date > localDay(end))) return false;
  const text = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  return (
    !f.search ||
    text([t.title, t.site_name, t.area_name, t.producer_name, t.assigned_name].join(' ')).includes(
      text(f.search),
    )
  );
}
export function taskSummary(tasks, now = new Date()) {
  const today = localDay(now);
  return {
    open: tasks.filter(taskOpen).length,
    overdue: tasks.filter((t) => taskOpen(t) && t.due_date < today).length,
    doing: tasks.filter((t) => t.status === 'doing').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };
}
const csv = (value) => {
  let s = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/u.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
};
export function tasksCsv(tasks) {
  return (
    '\uFEFF' +
    [
      [
        'Prazo',
        'Tarefa',
        'Situação',
        'Prioridade',
        'Responsável',
        'Produtor',
        'Propriedade',
        'Talhão',
        'Descrição',
        'Resultado',
        'ID da visita',
        'ID da observação',
        'Etapas concluídas',
        'Total de etapas',
      ],
      ...tasks.map((t) => [
        t.due_date,
        t.title,
        taskStatuses[t.status],
        taskPriorities[t.priority],
        t.assigned_name,
        t.producer_name,
        t.site_name,
        t.area_name,
        t.description,
        t.outcome,
        t.visit_id,
        t.observation_id || '',
        (t.checklist || []).filter((i) => i.done).length,
        (t.checklist || []).length,
      ]),
    ]
      .map((r) => r.map(csv).join(';'))
      .join('\r\n')
  );
}
export function taskCalendar(t, now = new Date()) {
  if (!taskOpen(t)) throw Error('Exporte somente tarefas pendentes ou em andamento.');
  return returnCalendar(
    {
      id: 'tarefa-' + t.id,
      next_visit: t.due_date,
      producer_name: t.title,
      site_name: t.site_name,
      area_name: t.area_name,
      anamnesis: { reason: 'Responsável: ' + t.assigned_name },
    },
    now,
  ).replace('Retorno sugerido — ', 'Tarefa — ');
}
