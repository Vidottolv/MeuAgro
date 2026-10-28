<script setup lang="ts">
import { useResource } from '../inventory/shared/useResource';
import { detail } from './financeRepository';
import { cycleLabel, money, amount } from '../harvests/harvestModel';
import { dateLabel } from '../seasons/seasonModel';
import RequestState from '../properties/components/RequestState.vue';
import FinanceSummary from './FinanceSummary.vue';
const props = defineProps<{ cycleId: string }>();
const { data, loading, error, reload } = useResource(() => detail(props.cycleId), null);
</script>
<template>
  <div class="rural-vue">
    <a href="/more/finance" data-link class="button button--secondary">Voltar ao financeiro</a
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><p v-if="!data">Plantio não encontrado.</p>
      <template v-else
        ><h2>{{ cycleLabel(data.cycle) }}</h2>
        <p>O resultado estimado considera somente insumos consumidos e vendas registradas.</p>
        <FinanceSummary :summary="data.summary" />
        <a :href="'/more/costs?cycle='+encodeURIComponent(cycleId)" data-link class="button button--secondary">Ver resultado ampliado deste plantio</a>
        <section class="rural-panel">
          <h3>Margem bruta</h3>
          <p>
            {{
              data.summary.gross_margin_percent === null
                ? 'Sem receita para calcular'
                : amount(data.summary.gross_margin_percent) + '%'
            }}
          </p>
          <a
            :href="`/plantings/${encodeURIComponent(cycleId)}`"
            data-link
            class="button button--secondary"
            >Ver plantio</a
          >
        </section>
        <section class="rural-panel">
          <h3>Insumos consumidos</h3>
          <p v-if="!data.inputCosts.length">Nenhum consumo registrado.</p>
          <article
            v-for="i in data.inputCosts"
            :key="i.agricultural_input_id + '-' + i.unit"
            class="rural-card"
          >
            <h4>{{ i.input_name }} {{ i.brand }}</h4>
            <p>{{ amount(i.quantity_used) }} {{ i.unit }} • {{ i.usage_count }} registros</p>
            <strong>{{ money(i.total_cost) }}</strong>
          </article>
        </section>
        <section class="rural-panel">
          <h3>Produção por unidade</h3>
          <p v-if="!data.production.length">Nenhuma colheita registrada.</p>
          <article v-for="p in data.production" :key="p.unit" class="rural-card">
            <h4>{{ p.unit }}</h4>
            <dl>
              <dt>Colhido</dt>
              <dd>{{ amount(p.harvested_quantity) }}</dd>
              <dt>Vendido</dt>
              <dd>{{ amount(p.sold_quantity) }}</dd>
              <dt>Saldo</dt>
              <dd>{{ amount(p.remaining_quantity) }}</dd>
              <dt>Receita</dt>
              <dd>{{ money(p.gross_revenue) }}</dd>
            </dl>
          </article>
        </section>
        <section class="rural-panel">
          <h3>Colheitas</h3>
          <p v-if="!data.harvests.length">Nenhuma colheita registrada.</p>
          <article v-for="h in data.harvests" :key="h.id" class="rural-card">
            <p>{{ dateLabel(h.harvest_date) }} • {{ amount(h.quantity) }} {{ h.unit }}</p>
            <a
              :href="`/more/harvests/${encodeURIComponent(h.id)}`"
              data-link
              class="button button--secondary"
              >Ver colheita</a
            >
          </article>
        </section>
        <section class="rural-panel">
          <h3>Vendas</h3>
          <p v-if="!data.sales.length">Nenhuma venda registrada.</p>
          <article v-for="s in data.sales" :key="s.id" class="rural-card">
            <h4>{{ s.buyer || 'Comprador não informado' }}</h4>
            <p>
              {{ dateLabel(s.sale_date) }} • {{ amount(s.quantity) }} {{ s.unit }} •
              {{ money(s.total_value) }}
            </p>
            <a
              :href="`/more/sales/${encodeURIComponent(s.id)}`"
              data-link
              class="button button--secondary"
              >Ver venda</a
            >
          </article>
        </section></template
      ></RequestState
    >
  </div>
</template>
