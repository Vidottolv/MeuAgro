<script setup lang="ts">
import { ref } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { crop, cropCount, toggleCrop } from './productionRepository';
import { useMutation } from './useMutation';
import RequestState from '../properties/components/RequestState.vue';
import RuralDialog from '../properties/components/RuralDialog.vue';
import '../properties/rural.css';
const props = defineProps<{ cropId: string }>();
const { data, loading, error, reload } = useResource(() => crop(props.cropId), null);
const count = useResource(() => cropCount(props.cropId), 0);
const mutation = useMutation(false),
  open = ref(false);
function confirm() {
  if (!data.value || data.value.is_system) return;
  const item = data.value;
  void mutation.run(
    () => toggleCrop(item),
    (result) => {
      data.value = result;
      open.value = false;
    },
  );
}
</script>
<template>
  <div class="rural-vue">
    <a href="/more/crops" class="button button--secondary" data-link>Voltar para culturas</a
    ><RequestState :loading="loading" :error="error" @retry="reload"
      ><template v-if="data"
        ><section class="rural-panel">
          <h2>{{ data.name }}</h2>
          <p>
            {{ data.active ? 'Ativa' : 'Inativa' }} •
            {{ data.is_system ? 'Cultura do sistema' : 'Personalizada' }}
          </p>
          <dl>
            <dt>Categoria</dt>
            <dd>{{ data.category || 'Não informada' }}</dd>
            <dt>Ciclo médio</dt>
            <dd>
              {{ data.average_cycle_days ? data.average_cycle_days + ' dias' : 'Não informado' }}
            </dd>
            <dt>Observações</dt>
            <dd>{{ data.notes || 'Nenhuma observação informada.' }}</dd>
          </dl>
          <div class="rural-actions">
            <a
              v-if="!data.is_system"
              :href="`/more/crops/${encodeURIComponent(data.id)}/edit`"
              class="button button--secondary"
              data-link
              >Editar cultura</a
            ><button
              v-if="!data.is_system"
              class="button button--secondary"
              :disabled="mutation.busy.value"
              @click="
                open = true;
                mutation.error.value = '';
              "
            >
              {{ data.active ? 'Desativar' : 'Reativar' }}</button
            ><button
              class="button button--secondary"
              :disabled="mutation.busy.value"
              @click="reload"
            >
              Atualizar ficha
            </button>
          </div>
          <p v-if="data.is_system">
            Culturas do sistema são compartilhadas e não podem ser alteradas.
          </p>
        </section>
        <section class="rural-panel">
          <h3>Plantios desta cultura</h3>
          <RequestState
            :loading="count.loading.value"
            :error="count.error.value"
            retry-label="Tentar carregar contagem"
            @retry="count.reload"
            ><p>{{ count.data.value }} plantios em aberto</p></RequestState
          ><a
            :href="`/plantings?crop=${encodeURIComponent(data.id)}`"
            class="button button--secondary"
            data-link
            >Ver plantios</a
          >
        </section></template
      >
      <section v-else class="rural-panel"><h2>Cultura não encontrada</h2></section></RequestState
    ><RuralDialog
      v-if="open && data"
      :title="data.active ? 'Desativar cultura?' : 'Reativar cultura?'"
      :busy="mutation.busy.value"
      @close="open = false"
      ><p>O histórico dos plantios será preservado.</p>
      <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
      <div class="rural-actions">
        <button
          class="button button--secondary"
          :disabled="mutation.busy.value"
          @click="open = false"
        >
          Cancelar</button
        ><button class="button button--primary" :disabled="mutation.busy.value" @click="confirm">
          {{ mutation.busy.value ? 'Salvando…' : 'Confirmar' }}
        </button>
      </div></RuralDialog
    >
  </div>
</template>
