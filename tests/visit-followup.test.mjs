import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchesReturn,
  visitsCsv,
  returnCalendar,
  localDay,
} from '../src/modules/visits/visitFollowup.js';

test('retornos usam datas locais, próximos sete dias e virada do ano', () => {
  const now = new Date(2026, 11, 30, 23, 45);
  assert.equal(localDay(now), '2026-12-30');
  for (const [date, filter, expected] of [
    ['2026-12-29', 'overdue', true],
    ['2026-12-30', 'overdue', false],
    ['2026-12-30', 'today', true],
    ['2026-12-30', 'week', false],
    ['2027-01-06', 'week', true],
    ['2027-01-07', 'week', false],
    [null, 'none', true],
    [null, 'today', false],
    [null, '', true],
  ])
    assert.equal(matchesReturn({ next_visit: date }, filter, now), expected);
});

test('CSV mantém Unicode, múltiplas linhas e neutraliza fórmulas em planilhas', () => {
  const text = visitsCsv([
    {
      producer_name: '=HYPERLINK("bad")',
      site_name: 'Sítio; "João"\nNorte',
      area_name: '\t+CMD',
      crop_name: '-1+1',
      technician_name: '@SUM(1)',
      anamnesis: { reason: ' \n=1+1' },
      offline_pending: true,
    },
  ]);
  assert.ok(text.startsWith('\uFEFF'));
  assert.ok(text.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(text.includes('"Sítio; ""João""\nNorte"'));
  assert.ok(text.includes('"\'\t+CMD"'));
  assert.ok(text.includes('"\'-1+1"'));
  assert.ok(text.includes('"\'@SUM(1)"'));
  assert.ok(text.includes('Pendente'));
});

test('ICS usa evento civil, fim exclusivo, UID estável e escape sem injeção', () => {
  const visit = {
    id: 'abc',
    next_visit: '2026-12-31',
    producer_name: 'João\nBEGIN:VALARM',
    site_name: 'Sítio, Norte; 2',
    anamnesis: { reason: 'á'.repeat(100) },
    offline_pending: true,
  };
  const text = returnCalendar(visit, new Date('2026-10-16T12:00:00Z'));
  assert.ok(text.includes('DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101'));
  assert.ok(text.includes('UID:abc-retorno@meuagro'));
  assert.ok(text.includes('João\\nBEGIN:VALARM'));
  assert.ok(!text.includes('\r\nBEGIN:VALARM'));
  assert.ok(text.includes('Sítio\\, Norte\\; 2'));
  assert.ok(text.replaceAll('\r\n ', '').includes('pendente de sincronização'));
  for (const line of text.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
  assert.throws(() => returnCalendar({ ...visit, next_visit: '2026-02-30' }));
  assert.throws(() => returnCalendar({ ...visit, next_visit: null }));
});
