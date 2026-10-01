<script setup>
import { computed } from 'vue';
import { money } from '../../services/tradeService.js';
import { packaging, availability, field, text, select, number } from './tradeModel';
import CommandForm from './CommandForm.vue';
const props = defineProps({
  state: Object,
  seller: Object,
  uid: String,
  commercial: Boolean,
  busy: Boolean,
  versions: Object,
});
const emit = defineEmits(['command']);
const productId = new URLSearchParams(location.search).get('product');
const products = computed(() =>
  props.state.trade_products.filter((p) => p.seller_id === props.seller.id),
);
const editing = computed(() => products.value.find((p) => p.id === productId && !p.archived));
const owner = computed(() => props.seller.owner_id === props.uid);
const connection = computed(() =>
  props.state.trade_connections.find(
    (c) => c.seller_id === props.seller.id && c.buyer_id === props.uid && c.active,
  ),
);
const available = computed(() =>
  products.value.filter((p) => !p.archived && p.availability !== 'unavailable'),
);
const productFields = computed(() => {
  const p = editing.value;
  return [
    field('name', 'Nome do produto', p?.name || '', {
      required: true,
      minlength: 2,
      maxlength: 120,
    }),
    field('category', 'Categoria', p?.category || '', { maxlength: 80 }),
    field('brand', 'Marca', p?.brand || '', { maxlength: 80 }),
    text('description', 'Descrição', p?.description || ''),
    field('package_name', 'Embalagem (saco, frasco, unidade)', p?.package_name || '', {
      required: true,
      maxlength: 60,
    }),
    number('package_size', 'Conteúdo de cada embalagem', p?.package_size || 1, {
      required: true,
      min: 0.001,
      max: 1000000,
      step: 0.001,
    }),
    select(
      'base_unit',
      'Unidade do conteúdo',
      [
        ['kg', 'Quilogramas'],
        ['L', 'Litros'],
        ['un', 'Unidades'],
      ],
      p?.base_unit || 'kg',
    ),
    number(
      'reference_price',
      'Preço de referência por embalagem (opcional)',
      p?.reference_price ?? '',
    ),
    select(
      'availability',
      'Disponibilidade',
      Object.entries(availability),
      p?.availability || 'on_request',
    ),
  ];
});
const requestFields = computed(() => [
  ...available.value.map((p) =>
    number('qty_' + p.id, p.name + ' — ' + packaging(p), 0, { max: 1000000, step: 0.001 }),
  ),
  select('property_id', 'Propriedade de destino (opcional)', [
    ['', 'Outro local'],
    ...props.state.properties.map((p) => [p.id, p.name]),
  ]),
  text('delivery_address', 'Endereço ou instruções de entrega', '', 500),
  field('desired_date', 'Data desejada (opcional)', '', { type: 'date' }),
  text('notes', 'Observações'),
]);
</script>
<template>
  <section class="rural-panel">
    <h3>Catálogo de {{ seller.name }}</h3>
    <p v-if="!products.filter((p) => commercial || !p.archived).length">
      Nenhum produto cadastrado.
    </p>
    <article
      v-for="p in products.filter((p) => commercial || !p.archived)"
      :key="p.id"
      class="rural-card"
    >
      <h4>{{ p.name }}</h4>
      <p>{{ p.category }} {{ p.brand }}</p>
      <p>{{ packaging(p) }}</p>
      <p>
        {{ p.archived ? 'Arquivado' : availability[p.availability]
        }}<template v-if="p.reference_price !== null">
          • Referência: {{ money(p.reference_price) }}</template
        >
      </p>
      <p>{{ p.description }}</p>
      <div v-if="owner && commercial && !p.archived" class="rural-actions">
        <a
          :href="
            '/consultor/negociacoes?seller=' +
            encodeURIComponent(seller.id) +
            '&product=' +
            encodeURIComponent(p.id)
          "
          data-link
          class="button button--secondary"
          >Editar produto</a
        ><button
          class="button button--secondary"
          :disabled="busy"
          @click="emit('command', 'archive_product', { seller_id: seller.id, product_id: p.id })"
        >
          Arquivar produto
        </button>
      </div>
    </article>
  </section>
  <section v-if="commercial && owner" class="rural-panel">
    <h3>{{ editing ? 'Editar produto' : 'Novo produto' }}</h3>
    <CommandForm
      :key="versions.save_product || 0"
      :fields="productFields"
      :busy="busy"
      label="Salvar produto"
      @submit="
        emit('command', 'save_product', {
          ...$event,
          seller_id: seller.id,
          product_id: editing?.id || '',
        })
      "
    />
  </section>
  <section v-if="!commercial && connection && available.length" class="rural-panel">
    <h3>Solicitar orçamento</h3>
    <p>Informe a quantidade de embalagens desejadas. Deixe os demais produtos em zero.</p>
    <CommandForm
      :key="versions.create_request || 0"
      :fields="requestFields"
      :busy="busy"
      label="Enviar solicitação"
      @submit="emit('command', 'create_request', { ...$event, connection_id: connection.id })"
    />
  </section>
</template>
