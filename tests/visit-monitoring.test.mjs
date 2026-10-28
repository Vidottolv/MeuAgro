import test from 'node:test';
import assert from 'node:assert/strict';
import {
  visitMatches,
  monitoringSummary,
  observationHistory,
  observationsBatchCsv,
  observationsCalendar,
} from '../src/modules/visits/visitMonitoring.js';
const obs = {
  id: 'o1',
  area_name: 'Norte',
  crop_name: 'Milho',
  observation: 'Clorose nas folhas',
  recommendation: 'Reavaliar nutrição',
  priority: 'high',
  next_visit: '2026-10-21',
};
const visit = {
  id: 'v1',
  author_id: 'u1',
  property_id: 'p1',
  producer_name: 'Produtor',
  site_name: 'Sítio',
  visited_at: '2026-10-20T12:00:00Z',
  priority: 'medium',
  field_observations: [obs],
};
test('busca inclui achados e recomendações, sem acentos, e combina filtros', () => {
  assert.equal(visitMatches(visit, { search: 'NUTRICAO' }), true);
  assert.equal(visitMatches(visit, { search: 'clorose' }), true);
  assert.equal(visitMatches(visit, { search: 'ausente' }), false);
  assert.equal(visitMatches(visit, { from: '2026-10-20', to: '2026-10-20', sync: 'synced' }), true);
  assert.equal(visitMatches(visit, { from: '2026-10-21' }), false);
  assert.equal(visitMatches(visit, { to: '2026-10-19' }), false);
  assert.equal(visitMatches(visit, { sync: 'pending' }), false);
  assert.equal(visitMatches({ ...visit, offline_pending: true }, { sync: 'pending' }), true);
  assert.equal(visitMatches(visit, { priority: 'urgent' }), false);
});
test('painel conta observações sem confundir sugestões com tarefas', () => {
  const result = monitoringSummary(
    [
      {
        ...visit,
        offline_pending: true,
        field_observations: [
          obs,
          { ...obs, id: 'o2', priority: 'urgent', next_visit: '2026-10-20' },
          { ...obs, id: 'o3', priority: 'low', next_visit: null },
        ],
      },
    ],
    new Date('2026-10-21T12:00:00'),
  );
  assert.deepEqual(result, { visits: 1, observations: 3, high: 2, past: 1, today: 1, pending: 1 });
});
test('histórico separa homônimos, culturas e autores, ordena sem alterar entrada', () => {
  const older = { ...visit, id: 'older', visited_at: '2026-10-19T12:00:00Z' };
  const input = [
    older,
    visit,
    { ...visit, id: 'other', author_id: 'u2' },
    { ...visit, id: 'otherplace', property_id: 'p2' },
    { ...visit, id: 'crop', field_observations: [{ ...obs, crop_name: 'Soja' }] },
  ];
  const groups = observationHistory(input);
  assert.equal(groups.length, 4);
  assert.deepEqual(
    groups[0].items.map((r) => r.visit.id),
    ['v1', 'older'],
  );
  assert.equal(input[0].id, 'older');
});
test('CSV em lote tem um cabeçalho, preserva multilinhas e protege fórmulas', () => {
  const csv = observationsBatchCsv([
    { ...visit, field_observations: [] },
    { ...visit, field_observations: [{ ...obs, observation: '=teste\n"linha"' }] },
    visit,
  ]);
  assert.equal(csv.split('Observação (ID)').length, 2);
  assert.match(csv, /"'=teste\n""linha"""/);
  assert.match(csv, /Clorose/);
  assert.ok(observationsBatchCsv([]).startsWith('\uFEFF'));
});
test('calendário em lote tem UIDs por origem, datas civis, escape e sem alarmes', () => {
  const calendar = observationsCalendar(
    [
      visit,
      visit,
      {
        ...visit,
        id: 'v2',
        offline_pending: true,
        field_observations: [
          { ...obs, next_visit: '2026-12-31', observation: 'Teste\nBEGIN:VEVENT' },
        ],
      },
    ],
    new Date('2026-10-20T12:00:00Z'),
  );
  assert.equal(calendar.split('\r\nBEGIN:VEVENT\r\n').length - 1, 2);
  assert.equal(calendar.split('BEGIN:VCALENDAR').length - 1, 1);
  assert.match(calendar, /UID:v1-o1-retorno@meuagro/);
  assert.match(calendar, /DTEND;VALUE=DATE:20270101/);
  assert.match(calendar, /Teste\\nBEGIN:VEVENT/);
  assert.match(calendar.replace(/\r\n /g, ''), /pendente de/);
  assert.doesNotMatch(calendar, /VALARM/);
  assert.throws(() => observationsCalendar([{ ...visit, field_observations: [] }]));
  assert.throws(() =>
    observationsCalendar([
      { ...visit, field_observations: [{ ...obs, next_visit: '2026-02-30' }] },
    ]),
  );
});
