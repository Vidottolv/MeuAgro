<script setup>
import { ref, watch, onMounted, onScopeDispose } from 'vue';
import { useOffline } from '../../offline/useOffline.js';
import { satelliteRpc, satelliteFunction } from '../../services/satelliteService.js';
import { visitSatelliteReference } from './visitSatellite.js';
const props = defineProps({
  modelValue: Object,
  propertyId: String,
  areaId: String,
  readonly: Boolean,
});
const emit = defineEmits(['update:modelValue']);
const { status } = useOffline();
const loaded = ref(false);
const choices = ref([]),
  busy = ref(false),
  error = ref(''),
  url = ref('');
let version = 0,
  disposed = false,
  timer;
function clear() {
  ++version;
  if (url.value) URL.revokeObjectURL(url.value);
  url.value = '';
  busy.value = false;
}
function hide() {
  clear();
  choices.value = [];
  loaded.value = false;
}
function visibility() {
  if (document.hidden) hide();
}
watch(
  () => props.modelValue?.image_id,
  () => {
    clear();
    error.value = '';
  },
);
watch([() => props.propertyId, () => props.areaId], () => {
  hide();
  error.value = '';
  if (
    !props.readonly &&
    props.modelValue &&
    (props.modelValue.property_id !== props.propertyId || props.modelValue.area_id !== props.areaId)
  )
    emit('update:modelValue', null);
});
watch(
  () => status.value.online,
  (online) => {
    if (!online) hide();
  },
);
onMounted(() => {
  document.addEventListener('visibilitychange', visibility);
  timer = setInterval(async () => {
    if (!url.value || document.hidden) return;
    const token = version;
    try {
      await satelliteRpc('satellite_image_access', {
        p_id: props.modelValue.image_id,
        p_share: null,
      });
    } catch {
      if (token === version) {
        hide();
        error.value = 'Imagem ocultada. Confira sua conexão e permissão de acesso.';
      }
    }
  }, 30000);
});
onScopeDispose(() => {
  disposed = true;
  hide();
  clearInterval(timer);
  document.removeEventListener('visibilitychange', visibility);
});
async function load() {
  clear();
  error.value = '';
  busy.value = true;
  const token = version;
  try {
    const images = await satelliteRpc('satellite_image_list', {
      p_property: props.propertyId,
      p_area: props.areaId,
      p_share: null,
    });
    if (!disposed && token === version) {
      choices.value = images.filter((i) => i.status === 'ready');
      loaded.value = true;
    }
  } catch (e) {
    if (!disposed && token === version) error.value = e.message;
  } finally {
    if (token === version) busy.value = false;
  }
}
function choose(id) {
  if (!id) {
    emit('update:modelValue', null);
    return;
  }
  const image = choices.value.find((i) => i.id === id);
  if (!image) return;
  const reference = visitSatelliteReference(
    {
      image_id: image.id,
      property_id: props.propertyId,
      area_id: props.areaId,
      day: image.day,
      layer: image.layer,
      ...image.metadata,
      note: props.modelValue?.image_id === id ? props.modelValue.note : '',
    },
    props.propertyId,
    props.areaId,
  );
  emit('update:modelValue', reference);
}
async function open() {
  clear();
  error.value = '';
  busy.value = true;
  const token = version;
  try {
    const blob = await satelliteFunction({
      action: 'view',
      id: props.modelValue.image_id,
      share_id: null,
    });
    if (!disposed && token === version) url.value = URL.createObjectURL(blob);
  } catch (e) {
    if (!disposed && token === version) error.value = e.message;
  } finally {
    if (token === version) busy.value = false;
  }
}
const date = (value) => value?.split('-').reverse().join('/');
</script>
<template>
  <section class="visit-satellite" aria-label="Imagem de satélite na visita">
    <h3>Imagem de satélite na visita</h3>
    <template v-if="!readonly">
      <p>
        Opcional: vincule uma imagem já disponível do talhão e descreva o que deseja conferir no
        campo. Carregar a lista ou abrir a imagem não solicita novo processamento ao Copernicus.
      </p>
      <p v-if="!propertyId || !areaId">
        Selecione uma propriedade e um talhão cadastrados na sua conta para escolher a imagem.
      </p>
      <button
        v-else
        type="button"
        class="button button--secondary"
        :disabled="!status.online || busy"
        @click="load"
      >
        Carregar imagens do talhão
      </button>
      <p v-if="loaded && !choices.length">
        Nenhuma imagem pronta encontrada para o contorno atual. Gere uma imagem em Mapas e satélite
        antes de vinculá-la.
      </p>
      <p v-if="choices.length">
        Até 30 consultas do contorno atual são consideradas. Escolha uma imagem pronta.
      </p>
      <label v-if="choices.length" for="visit-satellite-image">Imagem de referência</label>
      <select
        v-if="choices.length"
        id="visit-satellite-image"
        :value="modelValue?.image_id || ''"
        :disabled="busy || !status.online"
        @change="choose($event.target.value)"
      >
        <option value="">Sem imagem vinculada</option>
        <option
          v-if="modelValue && !choices.some((i) => i.id === modelValue.image_id)"
          :value="modelValue.image_id"
        >
          Referência já selecionada — {{ date(modelValue.day) }}
        </option>
        <option v-for="image in choices" :key="image.id" :value="image.id">
          {{ date(image.day) }} • {{ image.layer === 'ndvi' ? 'NDVI' : 'Cores naturais (RGB)' }}
        </option>
      </select>
    </template>
    <template v-if="modelValue">
      <p>
        <strong
          >{{ date(modelValue.day) }} •
          {{ modelValue.layer === 'ndvi' ? 'NDVI' : 'Cores naturais (RGB)' }}</strong
        >
      </p>
      <p v-if="modelValue.scene_cloud_percent != null">
        Nuvens na cena: {{ modelValue.scene_cloud_percent }}%.
      </p>
      <label v-if="!readonly" for="visit-satellite-note"
        >O que observar na visita a partir desta imagem?</label
      >
      <textarea
        v-if="!readonly"
        id="visit-satellite-note"
        :value="modelValue.note"
        maxlength="2000"
        rows="3"
        @input="emit('update:modelValue', { ...modelValue, note: $event.target.value })"
      />
      <p v-else class="reference-note">{{ modelValue.note || 'Sem observação sobre a imagem.' }}</p>
      <p>
        Referência histórica. O vínculo não concede acesso à imagem para outras pessoas. Mudanças no
        contorno ou na permissão podem impedir sua abertura, preservando os dados da ficha.
      </p>
      <button
        type="button"
        class="button button--secondary"
        :disabled="!status.online || busy"
        @click="open"
      >
        Abrir imagem de referência
      </button>
      <button
        v-if="!readonly"
        type="button"
        class="button button--secondary"
        @click="emit('update:modelValue', null)"
      >
        Remover vínculo da imagem
      </button>
    </template>
    <p v-if="!status.online">
      Conecte-se para escolher ou abrir a imagem. Uma referência já selecionada e sua observação
      podem continuar na ficha offline.
    </p>
    <p v-if="busy" role="status">Carregando…</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <figure v-if="url">
      <img
        :src="url"
        :alt="'Imagem de referência da visita em ' + date(modelValue.day)"
        @error="
          clear();
          error = 'A imagem não pôde ser exibida.';
        "
      />
      <figcaption>
        Dados Copernicus Sentinel. A imagem orienta a observação; não identifica sozinha a causa de
        uma alteração.
      </figcaption>
      <button type="button" class="button button--secondary" @click="clear">
        Ocultar imagem de referência
      </button>
    </figure>
  </section>
</template>
<style scoped>
.visit-satellite {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--border, #d7dfd4);
  border-radius: 1rem;
}
.reference-note {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
figure {
  margin: 1rem 0;
}
img {
  display: block;
  width: 100%;
  max-height: 24rem;
  object-fit: contain;
  background: repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 0 0 / 16px 16px;
}
</style>
