import { INPUT_CATEGORIES } from '../../constants/inputCategories.js';
import { INPUT_UNITS } from '../../constants/inputUnits.js';
export const importHeader = [
  'name',
  'brand',
  'category',
  'base_unit',
  'minimum_stock',
  'ideal_stock',
];
export function parseInputCsv(text) {
  if (typeof text !== 'string' || text.length > 60000)
    throw Error('Use um CSV de até 60 mil caracteres.');
  text = text.replace(/^\uFEFF/, '');
  const records = [];
  let row = [],
    cell = '',
    quoted = false,
    closed = false;
  for (let n = 0; n < text.length; n++) {
    const c = text[n];
    if (quoted) {
      if (c === '"') {
        if (text[n + 1] === '"') {
          cell += '"';
          n++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
    } else if (c === '"') {
      if (cell || closed) throw Error('Aspas inválidas no CSV.');
      quoted = true;
    } else if (c === ';' || c === '\n' || c === '\r') {
      row.push(cell);
      cell = '';
      closed = false;
      if (c !== ';') {
        if (c === '\r' && text[n + 1] === '\n') n++;
        if (row.some((v) => v.trim())) records.push(row);
        row = [];
      }
    } else {
      if (closed) throw Error('Texto fora de campo entre aspas.');
      cell += c;
    }
  }
  if (quoted) throw Error('Aspas não fechadas no CSV.');
  row.push(cell);
  if (row.some((v) => v.trim())) records.push(row);
  if (
    records.length < 2 ||
    records.length > 101 ||
    JSON.stringify(records[0].map((v) => v.trim())) !== JSON.stringify(importHeader)
  )
    throw Error('Use o cabeçalho do modelo e de 1 a 100 insumos.');
  const seen = new Set();
  return records.slice(1).map((values, index) => {
    if (values.length !== 6) throw Error('Linha ' + (index + 2) + ': use seis colunas.');
    const row = Object.fromEntries(importHeader.map((key, i) => [key, values[i].trim()]));
    if (
      row.name.length < 2 ||
      row.name.length > 160 ||
      row.brand.length > 160 ||
      !INPUT_CATEGORIES.some(([k]) => k === row.category) ||
      !INPUT_UNITS.some(([k]) => k === row.base_unit)
    )
      throw Error('Linha ' + (index + 2) + ': nome, categoria ou unidade inválida.');
    for (const key of ['minimum_stock', 'ideal_stock']) {
      row[key] = row[key].replace(',', '.');
      if ((key === 'minimum_stock' || row[key]) && !/^\d{1,7}(\.\d{1,4})?$/.test(row[key]))
        throw Error('Linha ' + (index + 2) + ': estoque inválido.');
    }
    if (row.ideal_stock && Number(row.ideal_stock) < Number(row.minimum_stock))
      throw Error('Linha ' + (index + 2) + ': ideal menor que mínimo.');
    const signature = [row.name.toLowerCase(), row.brand.toLowerCase(), row.base_unit].join('|');
    if (seen.has(signature)) throw Error('Linha ' + (index + 2) + ': insumo repetido.');
    seen.add(signature);
    return row;
  });
}
export function safePlanUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' &&
      ['asaas.com', 'www.asaas.com', 'sandbox.asaas.com'].includes(u.hostname)
      ? u.href
      : null;
  } catch {
    return null;
  }
}
