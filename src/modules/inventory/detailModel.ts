import type { InputDetail, InventoryLot } from './detailTypes';

export function needsRestock(input: InputDetail | null, transactionCount: number): boolean {
  return Boolean(input?.active && Number(input.current_quantity) <= 0 && transactionCount > 0);
}
export function todayLocal(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function lotStatus(
  lot: Pick<InventoryLot, 'current_quantity' | 'expiration_date'>,
  today = todayLocal(),
): string {
  if (Number(lot.current_quantity ?? 0) <= 0) return 'Sem saldo';
  if (lot.expiration_date && lot.expiration_date < today) return 'Vencido';
  return 'Disponível';
}
export function stockStatusLabel(status: string): string {
  return (
    (
      {
        normal: 'Estoque normal',
        low_stock: 'Estoque baixo',
        out_of_stock: 'Sem estoque',
      } as Record<string, string>
    )[status] ?? 'Situação não informada'
  );
}
