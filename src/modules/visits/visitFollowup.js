// Civil dates must not pass through UTC when filtering a local calendar day.
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function matchesReturn(visit, filter, now = new Date()) {
  const day = visit.next_visit;
  const today = localDay(now);
  if (!filter) return true;
  if (filter === 'none') return !day;
  if (!day) return false;
  if (filter === 'overdue') return day < today;
  if (filter === 'today') return day === today;
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  return filter === 'week' && day > today && day <= localDay(end);
}
function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/u.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function visitsCsv(visits) {
  const columns = [
    'Data da visita (ISO)',
    'Produtor',
    'Propriedade',
    'Talhão',
    'Cultura',
    'Técnico',
    'Prioridade',
    'Retorno sugerido',
    'Motivo',
    'Sincronização',
  ];
  const rows = visits.map((v) => [
    v.visited_at,
    v.producer_name,
    v.site_name,
    v.area_name,
    v.crop_name,
    v.technician_name,
    v.priority,
    v.next_visit,
    v.anamnesis?.reason,
    v.offline_pending ? 'Pendente' : 'Sincronizada',
  ]);
  return '\uFEFF' + [columns, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
}
const icalText = (value) =>
  String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,');
function foldLine(line) {
  const encoder = new TextEncoder();
  let result = '',
    size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > 75) {
      result += '\r\n ';
      size = 1;
    }
    result += char;
    size += bytes;
  }
  return result;
}
export function returnCalendar(visit, now = new Date()) {
  const date = visit.next_visit;
  const parsed = new Date(date + 'T12:00:00');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date || '') ||
    !Number.isFinite(parsed.getTime()) ||
    localDay(parsed) !== date
  )
    throw Error('Esta visita não possui uma data de retorno válida.');
  parsed.setDate(parsed.getDate() + 1);
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MeuAgro//Retornos//PT-BR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${icalText(visit.id)}-retorno@meuagro`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${date.replaceAll('-', '')}`,
    `DTEND;VALUE=DATE:${localDay(parsed).replaceAll('-', '')}`,
    `SUMMARY:${icalText('Retorno sugerido — ' + visit.producer_name)}`,
    `LOCATION:${icalText([visit.site_name, visit.area_name].filter(Boolean).join(' / '))}`,
    `DESCRIPTION:${icalText((visit.anamnesis?.reason || '') + (visit.offline_pending ? '\nVisita pendente de sincronização.' : ''))}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ]
    .map(foldLine)
    .join('\r\n');
}
export function downloadVisitFile(contents, type, filename) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
