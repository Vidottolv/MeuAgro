import type { LotDetail } from './lotModel';
import { normalizeSearch } from '../shared/text';
import { lotStatus } from '../detailModel';
export function filterLots(
  items: LotDetail[],
  search: string,
  status: string,
  order: string,
): LotDetail[] {
  const term = normalizeSearch(search);
  const labels: Record<string, string> = {
    available: 'Disponível',
    expired: 'Vencido',
    empty: 'Sem saldo',
  };
  const result = items.filter(
    (item) =>
      (!term ||
        normalizeSearch(
          [item.batch_number, item.supplier, item.notes].filter(Boolean).join(' '),
        ).includes(term)) &&
      (!status || lotStatus(item) === labels[status]),
  );
  if (order === 'expiration')
    result.sort((a, b) =>
      (a.expiration_date || '9999-12-31').localeCompare(b.expiration_date || '9999-12-31'),
    );
  return result;
}
