<script setup>
import { taskPriorities } from '../tasks/taskModel.js';
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  areas: { type: Array, default: () => [] },
  crops: { type: Array, default: () => [] },
  propertyId: String,
  readonly: Boolean,
  canTask: Boolean,
});
const emit = defineEmits(['update:modelValue', 'task']);
function update(index, patch) {
  emit(
    'update:modelValue',
    props.modelValue.map((item, i) => (i === index ? { ...item, ...patch } : item)),
  );
}
function add() {
  if (props.modelValue.length < 20)
    emit('update:modelValue', [
      ...props.modelValue,
      {
        id: crypto.randomUUID(),
        area_id: null,
        crop_id: null,
        area_name: '',
        crop_name: '',
        observation: '',
        recommendation: '',
        priority: 'medium',
        next_visit: '',
      },
    ]);
}
function chooseArea(index, id) {
  const area = props.areas.find((a) => a.id === id);
  update(index, { area_id: id || null, ...(area ? { area_name: area.name } : {}) });
}
function chooseCrop(index, id) {
  const crop = props.crops.find((a) => a.id === id);
  update(index, { crop_id: id || null, ...(crop ? { crop_name: crop.name } : {}) });
}
const date = (value) => value?.split('-').reverse().join('/');
</script>
<template>
  <section class="visit-observations" aria-label="Observações por talhão e cultura">
    <h3>Observações por talhão e cultura</h3>
    <p v-if="!readonly">
      Registre até 20 observações nesta visita. Separe achados, ações e retornos por talhão ou
      setor; a identificação principal da ficha permanece como contexto geral.
    </p>
    <p v-if="!modelValue.length">Nenhuma observação adicional registrada.</p>
    <article v-for="(item, index) in modelValue" :key="item.id" class="rural-card observation-card">
      <h4>Observação {{ index + 1 }}{{ readonly ? ' — ' + item.area_name : '' }}</h4>
      <template v-if="readonly">
        <p>
          {{ item.crop_name || 'Cultura não informada' }} • prioridade
          {{ taskPriorities[item.priority] }}
        </p>
        <h5>Achados no campo</h5>
        <p class="observation-text">{{ item.observation }}</p>
        <h5>Ação recomendada</h5>
        <p class="observation-text">{{ item.recommendation || 'Não informada' }}</p>
        <p v-if="item.next_visit">Retorno sugerido: {{ date(item.next_visit) }}</p>
        <button
          v-if="canTask"
          type="button"
          class="button button--secondary"
          @click="emit('task', item)"
        >
          Preparar tarefa desta observação
        </button>
      </template>
      <template v-else>
        <div v-if="propertyId || item.area_id" class="field">
          <label :for="'observation-area-' + item.id"
            >Talhão cadastrado da observação {{ index + 1 }}</label
          ><select
            :id="'observation-area-' + item.id"
            :value="item.area_id || ''"
            @change="chooseArea(index, $event.target.value)"
          >
            <option value="">Informar setor pelo nome</option>
            <option
              v-if="item.area_id && !areas.some((a) => a.id === item.area_id)"
              :value="item.area_id"
              disabled
            >
              Vínculo anterior — confirme o talhão
            </option>
            <option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</option>
          </select>
        </div>
        <div class="field">
          <label :for="'observation-name-' + item.id"
            >Talhão / setor da observação {{ index + 1 }} *</label
          ><input
            :id="'observation-name-' + item.id"
            :value="item.area_name"
            required
            minlength="2"
            maxlength="160"
            @input="update(index, { area_name: $event.target.value })"
          />
        </div>
        <div class="field">
          <label :for="'observation-crop-' + item.id"
            >Cultura cadastrada da observação {{ index + 1 }}</label
          ><select
            :id="'observation-crop-' + item.id"
            :value="item.crop_id || ''"
            @change="chooseCrop(index, $event.target.value)"
          >
            <option value="">Informar cultura pelo nome</option>
            <option v-for="crop in crops" :key="crop.id" :value="crop.id">{{ crop.name }}</option>
          </select>
        </div>
        <div class="field">
          <label :for="'observation-crop-name-' + item.id"
            >Cultura / variedade da observação {{ index + 1 }}</label
          ><input
            :id="'observation-crop-name-' + item.id"
            :value="item.crop_name"
            maxlength="120"
            @input="update(index, { crop_name: $event.target.value })"
          />
        </div>
        <div class="field">
          <label :for="'observation-text-' + item.id">Achados da observação {{ index + 1 }} *</label
          ><textarea
            :id="'observation-text-' + item.id"
            :value="item.observation"
            required
            minlength="2"
            maxlength="2000"
            rows="3"
            @input="update(index, { observation: $event.target.value })"
          />
        </div>
        <div class="field">
          <label :for="'observation-action-' + item.id">Ação da observação {{ index + 1 }}</label
          ><textarea
            :id="'observation-action-' + item.id"
            :value="item.recommendation"
            maxlength="2000"
            rows="3"
            @input="update(index, { recommendation: $event.target.value })"
          />
        </div>
        <div class="field">
          <label :for="'observation-priority-' + item.id"
            >Prioridade da observação {{ index + 1 }}</label
          ><select
            :id="'observation-priority-' + item.id"
            :value="item.priority"
            @change="update(index, { priority: $event.target.value })"
          >
            <option v-for="(label, key) in taskPriorities" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="field">
          <label :for="'observation-return-' + item.id"
            >Retorno sugerido da observação {{ index + 1 }}</label
          ><input
            :id="'observation-return-' + item.id"
            :value="item.next_visit || ''"
            type="date"
            @input="update(index, { next_visit: $event.target.value })"
          />
        </div>
        <button
          type="button"
          class="button button--secondary"
          @click="
            emit(
              'update:modelValue',
              modelValue.filter((x) => x.id !== item.id),
            )
          "
        >
          Remover observação {{ index + 1 }}
        </button>
      </template>
    </article>
    <button
      v-if="!readonly"
      type="button"
      class="button button--secondary"
      :disabled="modelValue.length >= 20"
      @click="add"
    >
      Adicionar observação por talhão
    </button>
  </section>
</template>
<style scoped>
.visit-observations {
  margin: 1.5rem 0;
}
.observation-card {
  margin: 1rem 0;
}
.observation-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
input,
select,
textarea {
  box-sizing: border-box;
  min-height: 48px;
  padding: 0.75rem;
  border: 1px solid var(--color-border, #d7dfd4);
  border-radius: 0.75rem;
  font: inherit;
}
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--color-primary, #205c3c);
  outline-offset: 2px;
}
</style>
