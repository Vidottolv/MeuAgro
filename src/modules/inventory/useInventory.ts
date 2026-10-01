import { computed, onMounted, onScopeDispose, ref } from 'vue';
import { getInputCategoryLabel } from '../../constants/inputCategories.js';
import { fetchInventory } from './inventoryRepository';
import type { ActivityFilter, AgriculturalInput, StockStatus } from './types';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

export function useInventory() {
  const items = ref<AgriculturalInput[]>([]);
  const query = ref('');
  const activity = ref<ActivityFilter>('active');
  const stock = ref<StockStatus | 'all'>('all');
  const loading = ref(false);
  const error = ref('');
  let disposed = false;
  let request = 0;

  async function reload() {
    const current = ++request;
    loading.value = true;
    error.value = '';
    try {
      const result = await fetchInventory();
      if (!disposed && current === request) items.value = result;
    } catch {
      if (!disposed && current === request) {
        items.value = [];
        error.value = 'Não foi possível carregar o estoque. Confira sua conexão e tente novamente.';
      }
    } finally {
      if (!disposed && current === request) loading.value = false;
    }
  }

  const filtered = computed(() => {
    const term = normalize(query.value.trim());
    return items.value.filter((item) => {
      if (activity.value === 'active' && !item.active) return false;
      if (activity.value === 'inactive' && item.active) return false;
      if (stock.value !== 'all' && item.stock_status !== stock.value) return false;
      return normalize(
        [item.name, item.brand, getInputCategoryLabel(item.category)].filter(Boolean).join(' '),
      ).includes(term);
    });
  });
  const summary = computed(() => {
    const active = items.value.filter((item) => item.active);
    return {
      active: active.length,
      low: active.filter((item) => item.stock_status === 'low_stock').length,
      empty: active.filter((item) => item.stock_status === 'out_of_stock').length,
    };
  });
  function clearFilters() {
    query.value = '';
    activity.value = 'active';
    stock.value = 'all';
  }

  onMounted(reload);
  onScopeDispose(() => {
    disposed = true;
    request++;
  });
  return { query, activity, stock, loading, error, filtered, summary, reload, clearFilters };
}
