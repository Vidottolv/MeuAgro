<script setup>
import { computed, ref, watch, onMounted, onScopeDispose } from 'vue';
import { satelliteFunction, satelliteRpc } from '../../services/satelliteService.js';

const props = defineProps({
  images: { type: Array, default: () => [] },
  revision: String,
  shareId: String,
});
const layer = ref('ndvi'),
  first = ref(''),
  second = ref(''),
  busy = ref(false),
  error = ref(''),
  opened = ref([]);
const available = computed(() =>
  props.images
    .filter((i) => i.status === 'ready' && i.layer === layer.value)
    .slice()
    .sort((a, b) => a.day.localeCompare(b.day)),
);
const selected = computed(() =>
  [first.value, second.value].map((id) => available.value.find((i) => i.id === id)),
);
const valid = computed(
  () => selected.value.every(Boolean) && selected.value[0].day !== selected.value[1].day,
);
let version = 0,
  disposed = false,
  timer;
function clear() {
  ++version;
  for (const image of opened.value) URL.revokeObjectURL(image.url);
  opened.value = [];
  busy.value = false;
}
function reset() {
  clear();
  first.value = '';
  second.value = '';
  error.value = '';
}
watch([first, second], () => {
  clear();
  error.value = '';
});
watch([layer, () => props.revision], reset);
watch(
  () => props.images,
  () => {
    if (opened.value.some((i) => !available.value.some((a) => a.id === i.id))) reset();
  },
);
function visibility() {
  if (document.hidden) reset();
}
onMounted(() => {
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('offline', reset);
  timer = setInterval(async () => {
    if (!opened.value.length || document.hidden) return;
    const token = version;
    const results = await Promise.allSettled(
      opened.value.map((i) =>
        satelliteRpc('satellite_image_access', { p_id: i.id, p_share: props.shareId || null }),
      ),
    );
    if (token === version && results.some((r) => r.status === 'rejected')) {
      reset();
      error.value = 'Comparação ocultada. Atualize o histórico para conferir sua permissão.';
    }
  }, 30000);
});
onScopeDispose(() => {
  disposed = true;
  clear();
  clearInterval(timer);
  document.removeEventListener('visibilitychange', visibility);
  window.removeEventListener('offline', reset);
});
async function compare() {
  if (!valid.value || busy.value) return;
  clear();
  error.value = '';
  busy.value = true;
  const token = version,
    snapshots = selected.value.slice().sort((a, b) => a.day.localeCompare(b.day));
  try {
    const results = await Promise.allSettled(
      snapshots.map((i) =>
        satelliteFunction({ action: 'view', id: i.id, share_id: props.shareId || null }),
      ),
    );
    if (disposed || token !== version) return;
    if (results.some((r) => r.status === 'rejected'))
      throw Error(
        'Não foi possível abrir as duas imagens. Atualize o histórico e confira sua conexão e permissão.',
      );
    if (results.some((r) => !(r.value instanceof Blob) || r.value.type !== 'image/png'))
      throw Error('Uma das imagens não retornou um PNG válido.');
    opened.value = results.map((r, index) => ({
      ...snapshots[index],
      url: URL.createObjectURL(r.value),
    }));
  } catch (e) {
    if (!disposed && token === version) {
      clear();
      error.value = e.message;
    }
  } finally {
    if (token === version) busy.value = false;
  }
}
function unavailable() {
  clear();
  error.value =
    'Uma imagem não pôde ser exibida. Atualize o histórico antes de abrir a comparação novamente.';
}
const date = (value) => value.split('-').reverse().join('/');
</script>

<template>
  <section class="comparison" aria-labelledby="comparison-title">
    <h4 id="comparison-title">Comparar datas do talhão</h4>
    <p>
      Abra duas imagens já disponíveis da mesma camada e do contorno atual. Nenhuma busca ou
      processamento novo será solicitado ao Copernicus. O carregamento das imagens usa sua conexão
      com o Supabase.
    </p>
    <label for="comparison-layer">Camada da comparação</label>
    <select id="comparison-layer" v-model="layer" :disabled="busy">
      <option value="ndvi">NDVI</option>
      <option value="rgb">Cores naturais (RGB)</option>
    </select>
    <p v-if="available.length < 2">
      São necessárias imagens disponíveis de duas datas diferentes nesta camada. O histórico
      carregado contém até 30 consultas do contorno atual. Use a busca de cenas acima se precisar
      gerar imagens de outras datas.
    </p>
    <form @submit.prevent="compare">
      <label for="comparison-first">Primeira data</label>
      <select id="comparison-first" v-model="first" :disabled="busy" required>
        <option value="">Escolha uma data disponível</option>
        <option v-for="image in available" :key="image.id" :value="image.id">
          {{ date(image.day) }}
        </option>
      </select>
      <label for="comparison-second">Segunda data</label>
      <select id="comparison-second" v-model="second" :disabled="busy" required>
        <option value="">Escolha outra data disponível</option>
        <option
          v-for="image in available"
          :key="image.id"
          :value="image.id"
          :disabled="selected[0]?.day === image.day"
        >
          {{ date(image.day) }}
        </option>
      </select>
      <p v-if="first && second && !valid">Escolha duas datas diferentes.</p>
      <button class="button button--secondary" :disabled="!valid || busy">
        {{ busy ? 'Abrindo imagens…' : 'Abrir comparação' }}
      </button>
    </form>
    <p v-if="error" role="alert">{{ error }}</p>
    <template v-if="opened.length === 2">
      <p>
        <strong>{{
          layer === 'ndvi' ? 'Comparação de NDVI' : 'Comparação em cores naturais (RGB)'
        }}</strong>
        • imagens organizadas da mais antiga para a mais recente.
      </p>
      <div class="comparison-images">
        <figure v-for="image in opened" :key="image.id">
          <figcaption>
            <strong>{{ date(image.day) }}</strong> • nuvens na cena:
            {{ image.metadata.scene_cloud_percent }}% • resolução aproximada:
            {{ image.metadata.resolution_m }} m
          </figcaption>
          <img
            :src="image.url"
            :alt="`${layer === 'ndvi' ? 'NDVI' : 'RGB'} do talhão em ${date(image.day)}`"
            @error="unavailable"
          />
        </figure>
      </div>
      <p v-if="layer === 'ndvi'">
        As duas imagens usam a mesma escala de cores do NDVI. Observe mudanças e regiões com
        comportamento diferente; cultura, maturação, colheita, solo e condições de aquisição também
        influenciam o resultado.
      </p>
      <p v-else>
        Compare cobertura vegetal, solo exposto e mudanças visíveis. Iluminação e condições da cena
        podem alterar a aparência das cores.
      </p>
      <p>
        O quadriculado é transparência, não ausência de vegetação. Diferenças de nuvens, pixels
        válidos e resolução podem limitar a comparação. Esta visualização não calcula variação
        numérica de NDVI nem identifica a causa de uma mudança.
      </p>
      <p>
        Use o mapa do talhão para localizar as regiões e registre suas observações na visita
        técnica. Contém dados Copernicus Sentinel modificados pelo MeuAgro.
      </p>
      <button type="button" class="button button--secondary" @click="clear">
        Fechar comparação
      </button>
    </template>
  </section>
</template>

<style scoped>
.comparison {
  margin: 1.5rem 0;
  padding: 1rem;
  border: 1px solid var(--border, #d7dfd4);
  border-radius: 1rem;
}
.comparison-images {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.comparison-images figure {
  margin: 0;
  min-width: 0;
}
.comparison-images img {
  display: block;
  width: 100%;
  height: 18rem;
  object-fit: contain;
  background: repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 0 0 / 16px 16px;
}
figcaption {
  overflow-wrap: anywhere;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}
@media (max-width: 600px) {
  .comparison-images {
    grid-template-columns: 1fr;
  }
  .comparison-images img {
    height: 14rem;
  }
}
</style>
