<script setup lang="ts">
import { nextTick, ref } from 'vue';
import InputIdentityFields from './components/InputIdentityFields.vue';
import InputStockFields from './components/InputStockFields.vue';
import InputNotesFields from './components/InputNotesFields.vue';
import { useInputForm } from './useInputForm';
import './inputForm.css';

const form = ref<HTMLFormElement | null>(null);
const props = defineProps<{ inputId?: string }>();
const emit = defineEmits<{ saved: [id: string] }>();
const { draft, loading, saving, loadError, saveError, notFound, errors, load, submit } =
  useInputForm(props.inputId, (id) => emit('saved', id));
const back = props.inputId ? `/inventory/${encodeURIComponent(props.inputId)}` : '/inventory';
async function handleSubmit() {
  await submit();
  await nextTick();
  form.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}
</script>

<template>
  <div class="input-form-vue">
    <header>
      <h2>{{ inputId ? 'Editar insumo' : 'Cadastrar insumo' }}</h2>
      <p>Informe os dados do produto. O saldo é registrado nas movimentações de estoque.</p>
    </header>
    <p v-if="loading" role="status">Carregando insumo…</p>
    <section v-else-if="loadError" role="alert" class="input-form-section">
      <h3>Não foi possível abrir o formulário</h3>
      <p>{{ loadError }}</p>
      <button class="button button--primary" @click="load">Tentar novamente</button
      ><a href="/inventory" class="button button--secondary" data-link>Voltar para o Barracão</a>
    </section>
    <section v-else-if="notFound" class="input-form-section">
      <h3>Insumo não encontrado</h3>
      <p>Este registro não existe ou não está disponível para sua conta.</p>
      <a href="/inventory" class="button button--secondary" data-link>Voltar para o Barracão</a>
    </section>
    <form v-else ref="form" novalidate :aria-busy="saving" @submit.prevent="handleSubmit">
      <p v-if="Object.keys(errors).length" role="alert" class="input-form-error">
        Confira os campos destacados antes de salvar.
      </p>
      <p v-if="saveError" role="alert" class="input-form-error">{{ saveError }}</p>
      <fieldset :disabled="saving">
        <legend class="input-form-legend">Dados do insumo</legend>
        <InputIdentityFields v-model="draft" :errors="errors" />
        <InputStockFields v-model="draft" :errors="errors" />
        <InputNotesFields v-model="draft" :errors="errors" />
      </fieldset>
      <div class="input-form-actions">
        <a v-if="!saving" :href="back" class="button button--secondary" data-link>Cancelar</a>
        <button type="submit" class="button button--primary" :disabled="saving">
          {{ saving ? 'Salvando…' : inputId ? 'Salvar alterações' : 'Cadastrar insumo' }}
        </button>
      </div>
    </form>
  </div>
</template>
