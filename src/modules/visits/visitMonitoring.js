import { localDay, matchesReturn, returnCalendar } from './visitFollowup.js';
import { observationsCsv } from './visitObservations.js';
const text = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
export function visitMatches(visit, filters = {}) {
  const day = localDay(new Date(visit.visited_at));
  if ((filters.from && day < filters.from) || (filters.to && day > filters.to)) return false;
  if (filters.sync === 'pending' && !visit.offline_pending) return false;
  if (filters.sync === 'synced' && visit.offline_pending) return false;
  if (filters.priority && visit.priority !== filters.priority) return false;
  if (!matchesReturn(visit, filters.returnFilter)) return false;
  const observations = visit.field_observations || [];
  return (
    !filters.search ||
    text(
      [
        visit.producer_name,
        visit.site_name,
        visit.area_name,
        visit.crop_name,
        visit.anamnesis?.reason,
        ...observations.flatMap((i) => [i.area_name, i.crop_name, i.observation, i.recommendation]),
      ].join(' '),
    ).includes(text(filters.search))
  );
}
export function observationRows(visits) {
  return visits.flatMap((visit) =>
    (visit.field_observations || []).map((observation) => ({ visit, observation })),
  );
}
export function monitoringSummary(visits, now = new Date()) {
  const rows = observationRows(visits),
    today = localDay(now);
  return {
    visits: visits.length,
    observations: rows.length,
    high: rows.filter(({ observation: o }) => ['high', 'urgent'].includes(o.priority)).length,
    past: rows.filter(({ observation: o }) => o.next_visit && o.next_visit < today).length,
    today: rows.filter(({ observation: o }) => o.next_visit === today).length,
    pending: visits.filter((v) => v.offline_pending).length,
  };
}
export function observationHistory(visits) {
  const groups = new Map();
  for (const row of observationRows(visits)) {
    const { visit: v, observation: o } = row;
    // Free-text places stay within author + property context; registered IDs distinguish homonyms.
    const key = JSON.stringify([
      v.author_id,
      v.property_id || [v.producer_name, v.site_name],
      o.area_id || o.area_name,
      o.crop_id || o.crop_name,
    ]);
    if (!groups.has(key))
      groups.set(key, {
        key,
        site: v.site_name,
        producer: v.producer_name,
        area: o.area_name,
        crop: o.crop_name,
        items: [],
      });
    groups.get(key).items.push(row);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    items: group.items.sort(
      (a, b) =>
        new Date(b.visit.visited_at).getTime() - new Date(a.visit.visited_at).getTime() ||
        a.observation.id.localeCompare(b.observation.id),
    ),
  }));
}
export function observationsBatchCsv(visits) {
  const files = visits.map(observationsCsv);
  if (!files.length) return observationsCsv({ field_observations: [] });
  // Strip the header by its physical first line only; observation cells can contain line breaks.
  return (
    files[0] +
    files
      .slice(1)
      .map((file) => {
        const body = file.slice(file.indexOf('\r\n') + 2);
        return file.includes('\r\n') ? '\r\n' + body : '';
      })
      .join('')
  );
}
export function observationsCalendar(visits, now = new Date()) {
  const rows = observationRows(visits).filter(({ observation: o }) => o.next_visit);
  if (!rows.length) throw Error('Nenhuma observação com retorno sugerido nesta seleção.');
  const seen = new Set();
  const events = rows
    .map(({ visit: v, observation: o }) => {
      const id = `${v.id}-${o.id}`;
      if (seen.has(id)) return '';
      seen.add(id);
      const calendar = returnCalendar(
        {
          ...v,
          id,
          area_name: o.area_name,
          next_visit: o.next_visit,
          anamnesis: {
            reason: [o.crop_name, o.observation, o.recommendation].filter(Boolean).join('\n'),
          },
        },
        now,
      );
      return calendar.slice(calendar.indexOf('BEGIN:VEVENT'), calendar.indexOf('END:VCALENDAR'));
    })
    .join('');
  return (
    'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MeuAgro//Observacoes//PT-BR\r\nCALSCALE:GREGORIAN\r\n' +
    events +
    'END:VCALENDAR\r\n'
  );
}
