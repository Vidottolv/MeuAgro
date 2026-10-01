<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { filterLots } from './lotFilters';
import { lotStatus } from '../detailModel';
import PageNavigation from '../components/PageNavigation.vue';
import { useLotPage } from './useLotPage';
import LotCard from './LotCard.vue';
import '../inputDetail.css';
import './lots.css';
const props = defineProps<{ inputId: string }>();
const {
  input,
  lots,
  loading,
  error,
  missing,
  relatedLoading,
  relatedError,
  reload,
  reloadRelated,
} = useLotPage(props.inputId, undefined, true);
const search = ref(''),
  status = ref(''),
  order = ref('purchase'),
  page = ref(1);
const filtered = computed(() => filterLots(lots.value, search.value, status.value, order.value));
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
const expired = computed(() => lots.value.filter((item) => lotStatus(item) === 'Vencido').length);
const empty = computed(() => lots.value.filter((item) => lotStatus(item) === 'Sem saldo').length);
watch([search, status, order, lots], () => {
  page.value = 1;
});
function clearFilters() {
  search.value = '';
  status.value = '';
  order.value = 'purchase';
}
</script>
<template>
  <div class="input-detail-vue lots-vue">
    <a
      :href="`/inventory/${encodeURIComponent(inputId)}`"
      class="button button--secondary input-detail-back"
      data-link
      >Voltar ao insumo</a
    >
    <h2>Lotes de estoque</h2>
    <p v-if="loading" role="status">Carregando insumo…</p>
    <section v-else-if="error" role="alert" class="input-detail-section">
      <p>{{ error }}</p>
      <button class="button button--secondary" @click="reload">Tentar novamente</button>
    </section>
    <section v-else-if="missing" class="input-detail-section">
      <h3>Insumo não encontrado</h3>
      <a href="/inventory" class="button button--secondary" data-link>Voltar ao Barracão</a>
    </section>
    <template v-else-if="input">
      <section class="input-detail-section">
        <header>
          <div>
            <h3>{{ input.name }}</h3>
            <p>Cada compra tem seu próprio saldo, custo, fornecedor e validade.</p>
          </div>
          <a
            v-if="input.active"
            :href="`/inventory/${encodeURIComponent(inputId)}/lots/new`"
            class="button button--primary"
            data-link
            >Novo lote</a
          >
        </header>
        <p v-if="!input.active">
          Insumo inativo. Reative-o para registrar uma nova compra. Os lotes existentes continuam
          disponíveis.
        </p>
      </section>
      <section class="input-detail-section" aria-label="Filtros de lotes">
        <div class="field">
          <label for="lots-search">Buscar lote</label
          ><input
            id="lots-search"
            v-model="search"
            type="search"
            placeholder="Número do lote, fornecedor ou observação"
          />
        </div>
        <div class="lot-form-grid">
          <div class="field">
            <label for="lots-status">Situação</label
            ><select id="lots-status" v-model="status">
              <option value="">Todas as situações</option>
              <option value="available">Disponível</option>
              <option value="expired">Vencido</option>
              <option value="empty">Sem saldo</option>
            </select>
          </div>
          <div class="field">
            <label for="lots-order">Ordenar</label
            ><select id="lots-order" v-model="order">
              <option value="purchase">Compras mais recentes</option>
              <option value="expiration">Validade mais próxima</option>
            </select>
          </div>
        </div>
        <div class="input-detail-actions">
          <button class="button button--secondary" @click="clearFilters">Limpar filtros</button
          ><button
            class="button button--secondary"
            :disabled="relatedLoading"
            @click="reloadRelated"
          >
            Atualizar lotes
          </button>
        </div>
      </section>
      <section
        v-if="!relatedLoading && !relatedError"
        class="input-detail-summary"
        aria-label="Resumo de todos os lotes"
      >
        <article>
          <span>Total de lotes</span><strong>{{ lots.length }}</strong>
        </article>
        <article>
          <span>Vencidos com saldo</span><strong>{{ expired }}</strong>
        </article>
        <article>
          <span>Sem saldo</span><strong>{{ empty }}</strong>
        </article>
      </section>
      <p v-if="relatedLoading" role="status">Carregando lotes…</p>
      <section v-else-if="relatedError" class="input-detail-section" role="alert">
        <p>{{ relatedError }}</p>
        <button class="button button--secondary" @click="reloadRelated">
          Tentar carregar lotes
        </button>
      </section>
      <div v-else-if="visible.length" class="input-detail-related-grid">
        <LotCard v-for="item in visible" :key="item.id" :lot="item" :input-id="inputId" />
      </div>
      <section v-else class="input-detail-section">
        <h3>{{ lots.length ? 'Nenhum lote encontrado' : 'Nenhum lote registrado' }}</h3>
        <p>
          {{
            lots.length
              ? 'Ajuste os filtros para encontrar outros lotes.'
              : 'Cadastre uma compra para registrar a entrada de estoque.'
          }}
        </p>
      </section>
      <PageNavigation
        v-if="!relatedLoading && !relatedError"
        :page="page"
        :total="filtered.length"
        :size="20"
        @change="page = $event"
      />
    </template>
  </div>
</template>
