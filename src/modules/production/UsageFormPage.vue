<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { context, inputs, lots, saveUsage, balance } from './productionRepository';
import { validateUsage, quantity } from './productionModel';
import { useMutation } from './useMutation';
import { formatNumberPtBr, formatCurrencyBRL } from '../../js/html.js';
import { dateLabel } from '../seasons/seasonModel';
import RequestState from '../properties/components/RequestState.vue';
import '../properties/rural.css';
const props = defineProps<{ cycleId: string; eventId: string }>();
const { data, loading, error, reload } = useResource(() => context(props.cycleId, props.eventId), {
  planting: null,
  event: null,
});
const products = useResource(inputs, []);
const inputId = ref(''),
  lotId = ref(''),
  amount = ref(''),
  notes = ref(''),
  saved = ref(false),
  balanceMessage = ref('');
const available = useResource(() => lots(inputId.value), [], false);
const mutation = useMutation();
const selected = computed(() => available.data.value.find((l) => l.id === lotId.value));
watch(inputId, () => {
  lotId.value = '';
  available.reset();
  void available.reload();
});
async function submit() {
  if (
    loading.value ||
    error.value ||
    !data.value.planting ||
    data.value.planting.deleted_at ||
    !data.value.event ||
    products.error.value ||
    products.loading.value ||
    available.loading.value ||
    available.error.value
  )
    return;
  mutation.error.value = validateUsage(inputId.value, selected.value, amount.value, notes.value);
  if (mutation.error.value) return;
  const product = inputId.value;
  await mutation.run(
    () => saveUsage(props.eventId, product, lotId.value, amount.value, notes.value),
    () => {
      saved.value = true;
      balanceMessage.value = 'Consultando saldo atualizado…';
      void balance(product)
        .then((result) => {
          if (mutation.alive())
            balanceMessage.value =
              result.current_quantity <= 0
                ? 'O insumo ficou sem saldo. Consulte seus fornecedores para reposição.'
                : 'Saldo atualizado: ' +
                  formatNumberPtBr(result.current_quantity) +
                  ' ' +
                  result.base_unit;
        })
        .catch(() => {
          if (mutation.alive())
            balanceMessage.value =
              'O uso foi salvo. Não foi possível consultar o saldo atualizado; confira o Barracão.';
        });
    },
  );
}
</script>
<template>
  <div class="rural-vue">
    <a
      :href="`/plantings/${encodeURIComponent(cycleId)}#timeline`"
      class="button button--secondary"
      data-link
      >Voltar ao plantio</a
    >
    <section class="rural-panel">
      <h2>Usar insumo no evento</h2>
      <p>A saída será registrada nas movimentações do estoque.</p>
    </section>
    <RequestState :loading="loading" :error="error" @retry="reload"
      ><section v-if="!data.planting || !data.event" class="rural-panel">
        <h3>Plantio ou evento não encontrado</h3>
      </section>
      <section v-else-if="data.planting.deleted_at" class="rural-panel">
        <h3>Plantio arquivado</h3>
      </section>
      <section v-else-if="saved" class="rural-panel">
        <h3>Uso de insumo registrado</h3>
        <p role="status">{{ balanceMessage }}</p>
        <a href="/inventory" class="button button--secondary" data-link>Ver Barracão</a
        ><a href="/more/consultants" class="button button--secondary" data-link
          >Consultar fornecedores</a
        >
      </section>
      <form v-else class="rural-panel" novalidate @submit.prevent="submit">
        <h3>{{ data.event.title }}</h3>
        <RequestState
          :loading="products.loading.value"
          :error="products.error.value"
          retry-label="Tentar carregar insumos"
          @retry="products.reload"
          ><p v-if="!products.data.value.length">
            Cadastre um insumo e sua entrada de estoque no Barracão.
          </p></RequestState
        >
        <fieldset :disabled="mutation.busy.value || mutation.done.value">
          <div class="field">
            <label for="usage-input">Insumo *</label
            ><select
              id="usage-input"
              v-model="inputId"
              :disabled="products.loading.value || !!products.error.value"
            >
              <option value="">Selecione</option>
              <option v-for="p in products.data.value" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>
          <RequestState
            :loading="available.loading.value"
            :error="available.error.value"
            retry-label="Tentar carregar lotes"
            @retry="available.reload"
            ><p v-if="inputId && !available.data.value.length">
              Nenhum lote com saldo para este insumo.
            </p></RequestState
          >
          <div class="field">
            <label for="usage-lot">Lote *</label
            ><select
              id="usage-lot"
              v-model="lotId"
              :disabled="available.loading.value || !!available.error.value"
            >
              <option value="">Selecione</option>
              <option v-for="l in available.data.value" :key="l.id" :value="l.id">
                {{ l.batch_number || 'Sem número' }} • {{ formatNumberPtBr(l.current_quantity) }}
                {{ l.unit }}
              </option>
            </select>
          </div>
          <section v-if="selected" class="rural-card">
            <p>Saldo: {{ formatNumberPtBr(selected.current_quantity) }} {{ selected.unit }}</p>
            <p>Validade: {{ dateLabel(selected.expiration_date) }}</p>
            <p v-if="selected.unit_price !== null">
              Custo unitário: {{ formatCurrencyBRL(selected.unit_price) }}
            </p>
            <p v-if="selected.unit_price !== null && quantity(amount) !== null">
              Custo estimado:
              {{ formatCurrencyBRL(Number(selected.unit_price) * quantity(amount)!) }}
            </p>
          </section>
          <div class="field">
            <label for="usage-quantity">Quantidade *</label
            ><input id="usage-quantity" v-model="amount" inputmode="decimal" />
          </div>
          <div class="field">
            <label for="usage-notes">Observações</label
            ><textarea id="usage-notes" v-model="notes" maxlength="1000" rows="4" />
          </div>
        </fieldset>
        <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
        <button
          class="button button--primary"
          :disabled="
            mutation.busy.value ||
            mutation.done.value ||
            available.loading.value ||
            !!available.error.value ||
            products.loading.value ||
            !!products.error.value
          "
        >
          {{ mutation.busy.value ? 'Registrando…' : 'Registrar uso' }}
        </button>
      </form></RequestState
    >
  </div>
</template>
