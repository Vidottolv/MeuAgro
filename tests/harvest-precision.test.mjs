import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, extname } from 'node:path';
import ts from 'typescript';
const cache = new Map();
function moduleUrl(path) {
  if (cache.has(path)) return cache.get(path);
  let code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const m of [...code.matchAll(/from ['"]([^'"]+)['"]/g)]) {
    let file = resolve(dirname(path), m[1]);
    if (!extname(file)) file += '.ts';
    code = code.replace(m[0], `from '${moduleUrl(file)}'`);
  }
  const url = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
  cache.set(path, url);
  return url;
}
const { remaining, validateHarvest, validateSale } = await import(
  moduleUrl(fileURLToPath(new URL('../src/modules/harvests/harvestModel.ts', import.meta.url)))
);
test('saldo fracionado não impede venda exata e continua recusando excesso', () => {
  const h = {
    id: 'h',
    quantity: 0.3,
    unit: 'kg',
    destination: 'sale',
    harvest_date: '2026-10-10',
    production_cycle: { deleted_at: null },
    sales: [{ id: 'sale', quantity: 0.1, sale_date: '2026-10-11' }],
  };
  assert.equal(remaining(h), 0.2);
  const form = {
    harvestId: 'h',
    quantity: '0,2',
    unitPrice: '10',
    saleDate: '2026-10-12',
    paymentMethod: '',
    buyer: '',
    notes: '',
  };
  assert.equal(validateSale(form, h), '');
  assert.match(validateSale({ ...form, quantity: '0,2001' }, h), /saldo/);
  const c = { planting_date: '2026-10-01', status: 'developing', deleted_at: null };
  const fields = {
    harvestDate: '2026-10-10',
    quantity: '0,3',
    unit: 'kg',
    destination: 'sale',
    qualityClassification: '',
    notes: '',
  };
  assert.equal(
    validateHarvest(fields, c, {
      ...h,
      sales: [...h.sales, { id: 'sale2', quantity: 0.2, sale_date: '2026-10-12' }],
    }),
    '',
  );
  assert.match(
    validateHarvest({ ...fields, harvestDate: '2026-10-13' }, c, h),
    /depois de uma venda/,
  );
});
