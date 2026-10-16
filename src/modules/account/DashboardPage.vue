<script setup lang="ts">
import { computed, watch } from 'vue';
import { useOffline } from '../../offline/useOffline.js';
const { status } = useOffline();
import { useResource } from '../inventory/shared/useResource';
import {
  getDashboardSummary,
  listNearHarvestCycles,
  listLowStockInputs,
  listRecentActivities,
} from '../../services/dashboardService.js';
import RequestState from '../properties/components/RequestState.vue';
import { dateLabel } from '../seasons/seasonModel';
import { amount } from '../harvests/harvestModel';
const props = defineProps<{
  session: { user: { email?: string; user_metadata?: { full_name?: string } } };
}>();
const name = computed(
  () =>
    props.session.user.user_metadata?.full_name?.trim().split(/\s+/)[0] ||
    props.session.user.email?.split('@')[0] ||
    'produtor',
);
const summary = useResource(getDashboardSummary, null),
  near = useResource(
    async () =>
      (await listNearHarvestCycles()) as unknown as {
        id: string;
        crop: { name: string } | null;
        property: { name: string } | null;
        area: { name: string } | null;
        variety: string;
        current_harvest_forecast: string | null;
      }[],
    [],
  ),
  stock = useResource(() => listLowStockInputs(), []),
  activities = useResource(() => listRecentActivities(), []);
const cards = computed(() =>
  summary.data.value
    ? [
        ['Propriedades', summary.data.value.properties_count, '/properties'],
        ['Áreas ativas', summary.data.value.active_areas_count, '/properties'],
        ['Plantios ativos', summary.data.value.active_cycles_count, '/plantings'],
        ['Próximos da colheita', summary.data.value.near_harvest_count, '/more/harvest-forecast'],
        ['Insumos com estoque baixo', summary.data.value.low_stock_count, '/inventory'],
        ['Colheitas no mês', summary.data.value.month_harvests_count, '/more/harvests'],
      ]
    : [],
);
watch(
  () => status.value.online,
  (online) => {
    if (online) {
      void summary.reload();
      void near.reload();
      void stock.reload();
      void activities.reload();
    }
  },
);
</script>
<template>
  <div class="rural-vue">
    <h2>Olá, {{ name }}</h2>
    <section v-if="!status.online" class="rural-panel">
      <h3>Seu trabalho no campo</h3>
      <p>Abra um plantio preparado para registrar eventos e fotos sem internet.</p>
      <div class="rural-actions">
        <a href="/plantings" data-link class="button button--primary">Abrir plantios</a>
        <a href="/properties" data-link class="button button--secondary">Consultar propriedades</a>
        <a href="/more/settings#offline" data-link class="button button--secondary"
          >Ver sincronização</a
        >
      </div>
    </section>
    <template v-else>
      <RequestState
        :loading="summary.loading.value"
        :error="summary.error.value"
        @retry="summary.reload"
        ><section v-if="summary.data.value?.properties_count === 0" class="rural-panel">
          <h3>Cadastre sua primeira propriedade</h3>
          <p>Organize suas áreas e acompanhe a produção.</p>
          <a href="/properties/new" data-link class="button button--primary"
            >Cadastrar propriedade</a
          >
        </section>
        <div class="rural-grid">
          <article v-for="[label, value, href] in cards" :key="String(label)" class="rural-card">
            <h3>{{ label }}</h3>
            <strong>{{ value }}</strong
            ><a :href="String(href)" data-link class="button button--secondary"
              >Ver {{ String(label).toLowerCase() }}</a
            >
          </article>
        </div></RequestState
      >
      <section class="rural-panel">
        <h3>Acesso rápido</h3>
        <div class="rural-actions">
          <a href="/plantings/new" data-link class="button button--primary">Novo plantio</a
          ><a href="/more/harvests/new" data-link class="button button--secondary">Nova colheita</a
          ><a href="/inventory/new" data-link class="button button--secondary">Novo insumo</a
          ><a href="/compras" data-link class="button button--secondary">Minhas compras</a>
        </div>
      </section>
      <section class="rural-panel">
        <h3>Colheitas nos próximos 7 dias</h3>
        <RequestState :loading="near.loading.value" :error="near.error.value" @retry="near.reload"
          ><p v-if="!near.data.value.length">Nenhum plantio previsto para os próximos 7 dias.</p>
          <article v-for="c in near.data.value" :key="c.id" class="rural-card">
            <h4>{{ c.crop?.name }} {{ c.variety }}</h4>
            <p>
              {{ c.property?.name }} • {{ c.area?.name }} •
              {{ dateLabel(c.current_harvest_forecast) }}
            </p>
            <a
              :href="`/plantings/${encodeURIComponent(c.id)}`"
              data-link
              class="button button--secondary"
              >Ver plantio</a
            >
          </article></RequestState
        >
      </section>
      <section class="rural-panel">
        <h3>Estoque que merece atenção</h3>
        <RequestState
          :loading="stock.loading.value"
          :error="stock.error.value"
          @retry="stock.reload"
          ><p v-if="!stock.data.value.length">Nenhum insumo com estoque baixo.</p>
          <article v-for="i in stock.data.value" :key="i.agricultural_input_id" class="rural-card">
            <h4>{{ i.name }} {{ i.brand }}</h4>
            <p>
              {{ amount(i.current_quantity) }} {{ i.base_unit }} • Mínimo:
              {{ amount(i.minimum_stock) }}
            </p>
            <a
              :href="`/inventory/${encodeURIComponent(i.agricultural_input_id)}`"
              data-link
              class="button button--secondary"
              >Ver estoque</a
            >
          </article></RequestState
        >
      </section>
      <section class="rural-panel">
        <h3>Atividades recentes</h3>
        <RequestState
          :loading="activities.loading.value"
          :error="activities.error.value"
          @retry="activities.reload"
          ><p v-if="!activities.data.value.length">Nenhuma atividade registrada.</p>
          <article v-for="a in activities.data.value" :key="a.id" class="rural-card">
            <h4>{{ a.title }}</h4>
            <p>{{ a.detail }}</p>
            <p>{{ new Date(a.occurredAt).toLocaleString('pt-BR') }}</p>
            <a :href="a.href" data-link class="button button--secondary">Ver registro</a>
          </article></RequestState
        >
      </section>
    </template>
  </div>
</template>
