<script setup lang="ts">
import { ref, computed } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import { getHarvest, finalize } from './harvestRepository';
import { amount, money, cycleLabel, remaining } from './harvestModel';
import { dateLabel } from '../seasons/seasonModel';
import {
  getHarvestDestinationLabel,
  harvestAllowsSales,
} from '../../constants/harvestDestinations.js';
import { getProductionCycleStatusLabel } from '../../constants/productionCycleStatus.js';
import RequestState from '../properties/components/RequestState.vue';
import RuralDialog from '../properties/components/RuralDialog.vue';
const props = defineProps<{ harvestId: string }>();
const { data, loading, error, reload } = useResource(() => getHarvest(props.harvestId), null);
const confirm = ref(false),
  finished = ref(false),
  mutation = useMutation();
const editable = computed(() => data.value && !data.value.production_cycle?.deleted_at);
const canFinish = computed(
  () =>
    editable.value &&
    !finished.value &&
    !['harvested', 'closed', 'cancelled'].includes(data.value!.production_cycle.status),
);
function finish() {
  if (!canFinish.value) return;
  void mutation.run(
    () => finalize(props.harvestId),
    () => {
      finished.value = true;
      confirm.value = false;
      void reload();
    },
  );
}
</script>
<template>
  <div class="rural-vue">
    <a href="/more/harvests" data-link class="button button--secondary">Voltar às colheitas</a>
    <p v-if="finished" role="status">Plantio marcado como colhido.</p>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><p v-if="!data">Colheita não encontrada.</p>
      <template v-else
        ><section class="rural-panel">
          <h2>{{ cycleLabel(data.production_cycle) }}</h2>
          <p>{{ getProductionCycleStatusLabel(data.production_cycle?.status) }}</p>
          <dl>
            <dt>Data da colheita</dt>
            <dd>{{ dateLabel(data.harvest_date) }}</dd>
            <dt>Quantidade</dt>
            <dd>{{ amount(data.quantity) }} {{ data.unit }}</dd>
            <dt>Destino</dt>
            <dd>{{ getHarvestDestinationLabel(data.destination) }}</dd>
            <dt>Classificação</dt>
            <dd>{{ data.quality_classification || 'Não informada' }}</dd>
            <dt>Observações</dt>
            <dd>{{ data.notes || 'Nenhuma' }}</dd>
            <dt>Saldo para venda</dt>
            <dd>{{ amount(remaining(data)) }} {{ data.unit }}</dd>
          </dl>
          <div class="rural-actions">
            <a
              v-if="editable"
              :href="`/more/harvests/${encodeURIComponent(data.id)}/edit`"
              data-link
              class="button button--secondary"
              >Editar colheita</a
            ><a
              :href="`/plantings/${encodeURIComponent(data.production_cycle_id)}`"
              data-link
              class="button button--secondary"
              >Ver plantio</a
            ><a
              :href="`/more/finance/${encodeURIComponent(data.production_cycle_id)}`"
              data-link
              class="button button--secondary"
              >Ver financeiro</a
            ><a
              v-if="editable && harvestAllowsSales(data.destination) && remaining(data) > 0"
              :href="`/more/harvests/${encodeURIComponent(data.id)}/sales/new`"
              data-link
              class="button button--primary"
              >Registrar venda</a
            >
          </div>
        </section>
        <section v-if="canFinish" class="rural-panel">
          <h3>Esta foi a colheita final?</h3>
          <p>Registrar uma colheita não encerra o plantio automaticamente.</p>
          <button class="button button--secondary" @click="confirm = true">
            Marcar plantio como colhido
          </button>
        </section>
        <section class="rural-panel">
          <h3>Vendas desta colheita</h3>
          <p v-if="!data.sales?.length">Nenhuma venda registrada.</p>
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
    ><RuralDialog
      v-if="confirm"
      title="Concluir a colheita do plantio?"
      :busy="mutation.busy.value"
      @close="confirm = false"
      ><p>O plantio será marcado como colhido, usando a data desta colheita.</p>
      <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
      <div class="rural-actions">
        <button
          class="button button--secondary"
          :disabled="mutation.busy.value"
          @click="confirm = false"
        >
          Cancelar</button
        ><button class="button button--primary" :disabled="mutation.busy.value" @click="finish">
          {{ mutation.busy.value ? 'Concluindo…' : 'Confirmar conclusão' }}
        </button>
      </div></RuralDialog
    >
  </div>
</template>
