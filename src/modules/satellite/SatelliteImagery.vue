<script setup>
import { ref, onScopeDispose, watch, onMounted } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import { satelliteRpc, satelliteFunction } from '../../services/satelliteService.js';
import SatelliteGuide from './SatelliteGuide.vue';
import SatelliteComparison from './SatelliteComparison.vue';
const props = defineProps({
  propertyId: String,
  areaId: String,
  shareId: String,
  owner: Boolean,
  revision: String,
  enabled: Boolean,
  eligible: Boolean,
});
const emit = defineEmits(['overlay', 'consumption']);
const yesterday = new Date();
yesterday.setUTCDate(yesterday.getUTCDate() - 1);
const minimum = new Date();
minimum.setUTCDate(minimum.getUTCDate() - 366);
const dateFromDefault = new Date(yesterday);
dateFromDefault.setUTCDate(dateFromDefault.getUTCDate() - 30);
const from = ref(dateFromDefault.toISOString().slice(0, 10)),
  to = ref(yesterday.toISOString().slice(0, 10));
const search = ref(null),
  selectedScene = ref('');
const day = ref(yesterday.toISOString().slice(0, 10)),
  layer = ref('ndvi'),
  shown = ref(null),
  imageUrl = ref(''),
  notice = ref('');
const images = useResource(
  () =>
    props.owner && !props.eligible
      ? Promise.resolve([])
      : satelliteRpc('satellite_image_list', {
          p_property: props.propertyId,
          p_area: props.areaId,
          p_share: props.shareId || null,
        }),
  [],
);
const mutation = useMutation(false);
let disposed = false,
  version = 0;
let permissionTimer;
onMounted(() => {
  permissionTimer = setInterval(() => {
    if (!shown.value || document.hidden) return;
    const token = version,
      id = shown.value.id;
    void satelliteRpc('satellite_image_access', { p_id: id, p_share: props.shareId || null }).catch(
      () => {
        if (token === version) {
          clear();
          images.reset();
          notice.value = 'Imagem ocultada. Atualize o histórico para conferir sua permissão.';
        }
      },
    );
  }, 30000);
});
watch(
  () => props.eligible,
  () => {
    clear();
    images.reset();
    void images.reload();
  },
);
watch([from, to, () => props.revision, () => props.eligible], () => {
  search.value = null;
  selectedScene.value = '';
  ++version;
});
async function searchScenes() {
  clear();
  search.value = null;
  selectedScene.value = '';
  notice.value = '';
  const token = version;
  await mutation.run(
    async () => {
      const result = await billableCall({
        action: 'search',
        area_id: props.areaId,
        from: from.value,
        to: to.value,
      });
      if (disposed || token !== version) return;
      if (result.status !== 'ready') {
        notice.value =
          result.status === 'failed'
            ? 'Esta busca falhou. O resultado fica preservado por uma hora; revise a configuração antes de outra busca.'
            : 'Busca pendente. Aguarde e consulte o mesmo intervalo para verificar o resultado.';
        return;
      }
      search.value = result;
      notice.value = result.cached
        ? 'Resultado do catálogo reutilizado, sem nova chamada ao provedor.'
        : 'Busca concluída. Escolha uma cena para processar.';
    },
    () => {},
  );
}
async function billableCall(body) {
  try {
    return await satelliteFunction(body);
  } finally {
    if (!disposed) emit('consumption');
  }
}
function clear() {
  ++version;
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = '';
  shown.value = null;
  emit('overlay', null);
}
watch(
  () => props.revision,
  () => {
    clear();
    images.reset();
    void images.reload();
  },
);
onScopeDispose(() => {
  clearInterval(permissionTimer);
  disposed = true;
  clear();
});
async function show(image) {
  clear();
  const token = version;
  await mutation.run(
    async () => {
      const blob = await satelliteFunction({
        action: 'view',
        id: image.id,
        share_id: props.shareId || null,
      });
      if (disposed || token !== version) return;
      if (!(blob instanceof Blob) || blob.type !== 'image/png')
        throw Error('A função não retornou uma imagem PNG válida.');
      imageUrl.value = URL.createObjectURL(blob);
      shown.value = image;
      emit('overlay', { url: imageUrl.value, bounds: image.metadata.bounds });
    },
    () => {},
  );
}
async function process() {
  const scene = search.value?.result?.scenes?.find((s) => s.id === selectedScene.value);
  if (!scene || scene.properties['eo:cloud_cover'] > 30 || !props.enabled) return;
  day.value = scene.properties.datetime.slice(0, 10);
  const searchId = search.value.id;
  clear();
  notice.value = '';
  await mutation.run(
    async () => {
      const result = await billableCall({
        action: 'process',
        search_id: searchId,
        scene_id: scene.id,
        area_id: props.areaId,
        day: day.value,
        layer: layer.value,
      });
      if (disposed) return;
      await images.reload();
      notice.value =
        result.status === 'ready'
          ? 'Imagem disponível no histórico. Abra para visualizar.'
          : result.status === 'no_data'
            ? 'Nenhuma cena elegível encontrada para essa data. Tente outra data.'
            : result.status === 'failed'
              ? 'Esta consulta falhou anteriormente. Ela não será repetida automaticamente.'
              : 'Consulta em processamento ou com resposta pendente. Atualize o histórico; não será criada outra execução para a mesma consulta.';
    },
    () => {},
  );
}
const labels = {
  ready: 'Disponível',
  processing: 'Processamento / resposta pendente',
  no_data: 'Sem cena elegível nesta consulta',
  failed: 'Falha; requer revisão',
};
</script>
<template>
  <section class="rural-panel">
    <h3>Imagens Sentinel-2 e NDVI</h3>
    <SatelliteGuide :layer="shown?.layer || layer" />
    <p v-if="shown">
      O guia acompanha a imagem aberta:
      {{ shown.layer === 'rgb' ? 'Cores naturais (RGB)' : 'NDVI' }}. Oculte a imagem para acompanhar
      a camada selecionada.
    </p>
    <p>
      Busque cenas nos últimos 366 dias, até ontem, e escolha uma antes de processar. Cenas com mais
      de 30% de nuvens não podem ser processadas; a porcentagem é da cena e não mede a cobertura
      exata do talhão. Nuvens e pixels sem qualidade ficam transparentes.
    </p>
    <form v-if="owner" @submit.prevent="searchScenes">
      <label for="satellite-from">Início (UTC)</label>
      <input
        id="satellite-from"
        v-model="from"
        type="date"
        required
        :min="minimum.toISOString().slice(0, 10)"
        :max="to"
        :disabled="mutation.busy.value"
      />
      <label for="satellite-to">Fim (UTC)</label>
      <input
        id="satellite-to"
        v-model="to"
        type="date"
        required
        :min="from"
        :max="yesterday.toISOString().slice(0, 10)"
        :disabled="mutation.busy.value"
      />
      <p>
        Até 31 dias por busca. Uma busca nova reserva 1 requisição e 0,1 PU; o mesmo intervalo e
        contorno são reutilizados por 24 horas. A busca não gera imagens. Aguarde um minuto entre
        novas buscas.
      </p>
      <button class="button button--secondary" :disabled="!enabled || mutation.busy.value">
        Buscar cenas disponíveis
      </button>
      <p v-if="search?.result?.truncated">
        Lista limitada a 100 cenas. Reduza o intervalo para uma busca mais completa.
      </p>
      <p v-if="search && !search.result.scenes.length">
        Nenhuma cena encontrada nesse intervalo. Tente outro período.
      </p>
      <label v-if="search?.result?.scenes?.length" for="satellite-scene"
        >Cena disponível — data e nuvens da cena</label
      >
      <select
        v-if="search?.result?.scenes?.length"
        id="satellite-scene"
        v-model="selectedScene"
        :disabled="mutation.busy.value"
      >
        <option value="">Escolha uma cena</option>
        <option
          v-for="scene in search.result.scenes"
          :key="scene.id"
          :value="scene.id"
          :disabled="scene.properties['eo:cloud_cover'] > 30"
        >
          {{ scene.properties.datetime }} • {{ scene.properties['eo:cloud_cover'] }}% de nuvens{{
            scene.properties['eo:cloud_cover'] > 30 ? ' — acima do limite' : ''
          }}
          • {{ scene.id }}
        </option>
      </select>
      <label for="satellite-layer">Camada</label
      ><select id="satellite-layer" v-model="layer" :disabled="mutation.busy.value">
        <option value="ndvi">NDVI</option>
        <option value="rgb">Cores naturais</option>
      </select>
      <p>
        Processar uma cena usa uma chamada de processamento, sem nova busca no catálogo. A reserva é
        de 1 requisição e 10 PUs. Consultas já processadas para o mesmo contorno, data e camada são
        reutilizadas. Aguarde um minuto entre novas consultas do mesmo talhão.
      </p>
      <button
        type="button"
        class="button button--primary"
        :disabled="!enabled || !selectedScene || mutation.busy.value"
        @click="process"
      >
        {{ mutation.busy.value ? 'Consultando…' : 'Consultar imagem' }}
      </button>
      <p v-if="!enabled">
        O administrador precisa habilitar o piloto e provisionar sua franquia. Nenhuma assinatura é
        contratada nesta tela.
      </p>
    </form>
    <p v-else>
      O produtor solicita novas imagens. Você pode consultar as imagens autorizadas já disponíveis.
    </p>
    <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <button
      class="button button--secondary"
      :disabled="mutation.busy.value || images.loading.value"
      @click="
        images.reset();
        images.reload();
      "
    >
      Atualizar histórico de imagens
    </button>
    <p v-if="images.error.value" role="alert">{{ images.error.value }}</p>
    <p v-if="images.loading.value" role="status">Carregando imagens…</p>
    <p v-else-if="!images.data.value.length">Nenhuma consulta para o contorno atual.</p>
    <article v-for="image in images.data.value" :key="image.id">
      <p>
        {{ image.day.split('-').reverse().join('/') }} •
        {{ image.layer === 'ndvi' ? 'NDVI' : 'Cores naturais' }} • {{ labels[image.status] }}
      </p>
      <button
        v-if="image.status === 'ready'"
        class="button button--secondary"
        :disabled="mutation.busy.value"
        @click="show(image)"
      >
        Visualizar {{ image.layer === 'ndvi' ? 'NDVI' : 'cores naturais' }} de {{ image.day }}
      </button>
      <p v-if="image.status === 'processing'">
        Se a consulta não terminar, peça revisão ao administrador. Uma resposta perdida não dispara
        outra chamada ao provedor.
      </p>
    </article>
    <SatelliteComparison :images="images.data.value" :revision="revision" :share-id="shareId" />
    <figure v-if="shown">
      <img
        :src="imageUrl"
        :alt="
          shown.layer === 'ndvi'
            ? 'Índice de vegetação do talhão'
            : 'Imagem em cores naturais do talhão'
        "
        @error="
          notice =
            'Não foi possível exibir a imagem. Atualize o histórico para tentar abri-la novamente.';
          clear();
        "
      />
      <figcaption>
        {{ shown.metadata.source }} • aquisição de referência
        {{ new Date(shown.metadata.acquisition_at).toLocaleString('pt-BR') }} • nuvens na cena
        {{ shown.metadata.scene_cloud_percent }}% • resolução aproximada da prévia
        {{ shown.metadata.resolution_m }} m.
      </figcaption>
      <div
        v-if="shown.layer === 'ndvi'"
        class="ndvi-legend"
        role="img"
        aria-label="Escala NDVI: azul menos um, marrom zero, amarelo zero vírgula dois, verde claro zero vírgula cinco e verde escuro um"
      >
        <div class="ndvi-gradient" />
        <div class="ndvi-ticks">
          <span style="left: 0">−1</span><span style="left: 50%">0</span
          ><span style="left: 60%">0,2</span><span style="left: 75%">0,5</span
          ><span style="left: 100%">1</span>
        </div>
      </div>
      <p v-if="shown.layer === 'ndvi'">
        NDVI: azul −1, marrom 0, amarelo 0,2, verde claro 0,5 e verde escuro 1. Transparência
        significa pixel descartado ou sem dados, não vegetação ausente. O índice não identifica
        sozinho pragas, doenças ou necessidade de aplicação.
      </p>
      <p>
        Imagem recortada ao polígono. Prévia de até 512 × 512 pixels; áreas maiores usam resolução
        mais baixa. Sobreposição exibida no mapa acima. Contém dados Copernicus Sentinel modificados
        pelo MeuAgro.
      </p>
      <button class="button button--secondary" @click="clear">Ocultar imagem</button>
    </figure>
  </section>
</template>
<style scoped>
.ndvi-legend {
  margin: 1rem 0 2rem;
}
.ndvi-gradient {
  height: 1rem;
  border-radius: 0.25rem;
  background: linear-gradient(
    to right,
    #1e50a0 0%,
    #a05a28 50%,
    #e0bf46 60%,
    #71ab3a 75%,
    #005a26 100%
  );
}
.ndvi-ticks {
  position: relative;
  font-size: 0.75rem;
}
.ndvi-ticks span {
  position: absolute;
  transform: translateX(-50%);
}
.ndvi-ticks span:first-child {
  transform: none;
}
.ndvi-ticks span:last-child {
  transform: translateX(-100%);
}
form {
  display: grid;
  gap: 0.7rem;
}
input,
select {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 0.65rem;
  background: var(--color-surface-soft);
  color: var(--color-text);
  font: inherit;
}
img {
  display: block;
  width: 100%;
  max-height: 420px;
  object-fit: contain;
  background: repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 / 16px 16px;
}
figure {
  margin: 0;
  overflow-wrap: anywhere;
}
.button {
  margin: 0.3rem;
}
</style>
