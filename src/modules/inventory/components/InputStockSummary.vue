<script setup lang="ts">
import { formatNumberPtBr } from '../../../js/html.js';
import type { InputDetail } from '../detailTypes';
defineProps<{ input: InputDetail }>();
</script>
<template>
  <section class="input-detail-summary" aria-label="Resumo do estoque">
    <article>
      <span>Saldo atual</span
      ><strong>{{ formatNumberPtBr(input.current_quantity) }} {{ input.base_unit }}</strong
      ><small>Calculado pelas movimentações</small>
    </article>
    <article>
      <span>Estoque mínimo</span
      ><strong>{{ formatNumberPtBr(input.minimum_stock) }} {{ input.base_unit }}</strong>
    </article>
    <article>
      <span>Estoque ideal</span
      ><strong>{{
        input.ideal_stock == null
          ? 'Não informado'
          : `${formatNumberPtBr(input.ideal_stock)} ${input.base_unit}`
      }}</strong>
    </article>
  </section>
</template>
