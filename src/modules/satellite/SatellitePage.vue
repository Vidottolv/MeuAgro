<script setup>
import { ref, computed, watch, onMounted, onScopeDispose } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import { listActiveProperties } from '../../services/propertyService.js';
import { listPropertyShares } from '../../services/propertySharingService.js';
import { satelliteRpc } from '../../services/satelliteService.js';
import { offlineUserId } from '../../offline/runtime.js';
import { useOffline } from '../../offline/useOffline.js';
import { parseCoordinates, normalizeGeometry, coordinatesText } from './geometry.js';
import BoundaryMap from './BoundaryMap.vue';
import SatelliteImagery from './SatelliteImagery.vue';
import RequestState from '../properties/components/RequestState.vue';
import '../properties/rural.css';
const { status } = useOffline();
const choices = useResource(async () => {
  const own = await listActiveProperties();
  const shared = await listPropertyShares();
  return [
    ...own.map((p) => ({ id: p.id, name: p.name, share: null })),
    ...shared
      .filter((s) => s.status === 'active' && s.consultant_id === offlineUserId())
      .map((s) => ({ id: s.property_id, name: s.property_name + ' (compartilhada)', share: s.id })),
  ];
}, []);
const target = ref(''),
  area = ref(''),
  geometry = ref(null),
  text = ref(''),
  system = ref('WGS84'),
  zone = ref(23),
  hemisphere = ref('S'),
  source = ref('map'),
  reference = ref('WGS84'),
  inputError = ref(''),
  notice = ref('');
const selected = computed(() =>
  target.value === '' ? null : choices.data.value[Number(target.value)],
);
const ctx = useResource(
  () =>
    selected.value
      ? satelliteRpc('geo_context', {
          p_property: selected.value.id,
          p_area: area.value || null,
          p_share: selected.value.share,
        })
      : Promise.resolve(null),
  null,
  false,
);
const subscription = useResource(() => satelliteRpc('satellite_status'), null);
const mutation = useMutation(false);
const owner = computed(() => ctx.data.value?.property.owner_id === offlineUserId());
const dirty = ref(false);
const overlay = ref(null);
const baseRevision = ref(null);
const busy = computed(() => mutation.busy.value || ctx.loading.value);
let epoch = 0;
async function reload() {
  overlay.value = null;
  ++epoch;
  ctx.reset();
  geometry.value = null;
  text.value = '';
  dirty.value = false;
  baseRevision.value = null;
  if (!status.value.online || document.hidden) return;
  await ctx.reload();
  const current = ctx.data.value?.current;
  geometry.value = current?.geometry || null;
  reference.value = current?.reference || 'WGS84';
  baseRevision.value = current?.id || null;
  source.value = current?.source || 'map';
  if (geometry.value) text.value = coordinatesText(geometry.value);
  system.value = 'WGS84';
}
watch(target, () => {
  area.value = '';
  void reload();
});
watch(area, () => void reload());
function setGeometry(g, origin = 'map') {
  overlay.value = null;
  try {
    geometry.value = normalizeGeometry(g);
    source.value = origin;
    reference.value =
      origin === 'coordinates'
        ? `${system.value}${system.value.startsWith('UTM') ? ` ${zone.value}${hemisphere.value}` : ''}`
        : 'WGS84';
    text.value = coordinatesText(geometry.value);
    system.value = 'WGS84';
    dirty.value = true;
    inputError.value = '';
  } catch (error) {
    inputError.value = error.message;
  }
}
function applyCoordinates() {
  try {
    setGeometry(
      parseCoordinates(text.value, system.value, zone.value, hemisphere.value),
      'coordinates',
    );
  } catch (error) {
    inputError.value = error.message;
  }
}
async function importFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 100000) throw Error('Use arquivo GeoJSON de até 100 KB.');
    setGeometry(JSON.parse(await file.text()), 'geojson');
  } catch (error) {
    inputError.value = error.message;
  }
}
function action(name, extra = {}) {
  if (!selected.value || !ctx.data.value) return;
  void mutation.run(
    async () => {
      const id = await satelliteRpc('geo_command', {
        p_action: name,
        p_data: {
          property_id: selected.value.id,
          area_id: area.value || null,
          share_id: selected.value.share,
          base_revision: baseRevision.value,
          geometry: geometry.value,
          source: source.value,
          reference: reference.value,
          ...extra,
        },
      });
      await reload();
      return id;
    },
    () => {
      notice.value = owner.value
        ? 'Contorno atualizado.'
        : 'Proposta enviada para aprovação do produtor.';
    },
  );
}
function monitor(enabled) {
  void mutation.run(
    async () => {
      await satelliteRpc('satellite_field', { p_area: area.value, p_enabled: enabled });
      await subscription.reload();
    },
    () => {
      notice.value = enabled
        ? 'Talhão selecionado. As consultas dependem da configuração do piloto no servidor.'
        : 'Talhão retirado do pacote.';
    },
  );
}
function clear() {
  overlay.value = null;
  ++epoch;
  ctx.reset();
  choices.reset();
  subscription.reset();
  target.value = '';
  area.value = '';
  geometry.value = null;
  text.value = '';
  dirty.value = false;
}
function visibility() {
  if (document.hidden) clear();
  else {
    void choices.reload();
    void subscription.reload();
  }
}
watch(
  () => status.value.online,
  (online) => {
    clear();
    if (online) {
      void choices.reload();
      void subscription.reload();
    }
  },
);
let timer;
onMounted(() => {
  document.addEventListener('visibilitychange', visibility);
  timer = setInterval(() => {
    if (!document.hidden && selected.value?.share) {
      const version = epoch,
        propertyId = selected.value.id,
        areaId = area.value;
      void satelliteRpc('geo_context', {
        p_property: propertyId,
        p_area: areaId || null,
        p_share: selected.value.share,
      })
        .then((data) => {
          if (version === epoch && selected.value?.id === propertyId && area.value === areaId) {
            ctx.data.value = data;
            if (!dirty.value && baseRevision.value !== (data.current?.id || null)) {
              overlay.value = null;
              geometry.value = data.current?.geometry || null;
              baseRevision.value = data.current?.id || null;
              text.value = geometry.value ? coordinatesText(geometry.value) : '';
            }
          }
        })
        .catch((error) => {
          if (version === epoch) {
            ctx.reset();
            geometry.value = null;
            text.value = '';
            dirty.value = false;
            notice.value = error.message;
          }
        });
    }
  }, 30000);
});
onScopeDispose(() => {
  clearInterval(timer);
  document.removeEventListener('visibilitychange', visibility);
});
</script>
<template>
  <div class="rural-vue satellite-page">
    <h2>Mapas e satélite</h2>
    <p>
      Cadastre o limite do sítio e depois os contornos dos talhões. Um ponto serve como referência,
      mas não habilita monitoramento. Os desenhos são operacionais e não substituem levantamento
      certificado.
    </p>
    <p v-if="!status.online" role="status">
      Conecte-se para consultar ou salvar contornos. O mapa-base não é preparado para uso offline.
    </p>
    <template v-else>
      <RequestState
        :loading="choices.loading.value"
        :error="choices.error.value"
        @retry="choices.reload"
      >
        <label for="geo-property">Propriedade</label
        ><select id="geo-property" v-model="target">
          <option value="">Selecione</option>
          <option
            v-for="(p, index) in choices.data.value"
            :key="p.id + ':' + p.share"
            :value="String(index)"
          >
            {{ p.name }}
          </option>
        </select>
      </RequestState>
      <RequestState
        v-if="target !== ''"
        :loading="ctx.loading.value"
        :error="ctx.error.value"
        @retry="reload"
      >
        <section v-if="ctx.data.value" class="rural-panel">
          <label for="geo-area">O que delimitar</label
          ><select id="geo-area" v-model="area" :disabled="busy">
            <option value="">Limite do sítio</option>
            <option v-for="a in ctx.data.value.areas" :key="a.id" :value="a.id">
              {{ a.name }}
            </option>
          </select>
          <p v-if="!owner">
            Você pode propor contornos. O produtor precisa aprová-los. A permissão é revalidada a
            cada 30 segundos; envie a proposta antes de trocar de tela. Alterações não enviadas não
            são guardadas.
          </p>
          <BoundaryMap
            :geometry="geometry"
            :overlay="overlay"
            :context-geometry="area ? ctx.data.value.property_boundary : null"
            :disabled="busy"
            @change="setGeometry($event)"
          />
          <p v-if="area && ctx.data.value.property_boundary">
            O traço cinza indica o limite ou ponto de referência do sítio. Confira se o talhão está
            no local correto; não há validação automática de sobreposição ou encaixe entre
            contornos.
          </p>
          <details>
            <summary>Informar coordenadas ou importar GeoJSON</summary>
            <label for="geo-system">Sistema de referência</label
            ><select id="geo-system" v-model="system">
              <option>WGS84</option>
              <option>SIRGAS2000</option>
              <option>UTM-SIRGAS2000</option>
              <option>UTM-WGS84</option>
            </select>
            <template v-if="system.startsWith('UTM')"
              ><label for="geo-zone">Fuso UTM</label
              ><input id="geo-zone" v-model.number="zone" type="number" min="1" max="60" /><label
                for="geo-hemisphere"
                >Hemisfério</label
              ><select id="geo-hemisphere" v-model="hemisphere">
                <option value="S">Sul</option>
                <option value="N">Norte</option>
              </select></template
            >
            <p>
              Um vértice por linha: latitude;longitude em graus decimais ou leste;norte em metros
              para UTM. Use ponto ou vírgula decimal e ponto e vírgula para separar os valores. Um
              vértice gera um ponto; três ou mais geram um polígono. GeoJSON usa longitude/latitude
              WGS84 e precisa vir fechado, sem furos.
            </p>
            <label for="geo-coordinates">Vértices</label
            ><textarea id="geo-coordinates" v-model="text" rows="7" maxlength="15000" />
            <button class="button button--secondary" :disabled="busy" @click="applyCoordinates">
              Aplicar coordenadas
            </button>
            <label class="field"
              >Importar arquivo GeoJSON<input
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                :disabled="busy"
                @change="importFile"
            /></label>
          </details>
          <p v-if="inputError" role="alert">{{ inputError }}</p>
          <p v-if="geometry">
            Geometria: {{ geometry.type === 'Point' ? 'ponto de referência' : 'polígono' }}. Origem:
            {{ reference }}.
          </p>
          <button
            class="button button--primary"
            :disabled="!geometry || !dirty || busy"
            @click="action('save')"
          >
            {{ owner ? 'Salvar contorno' : 'Enviar proposta ao produtor' }}
          </button>
          <button class="button button--secondary" :disabled="busy" @click="reload">
            Recarregar contorno salvo
          </button>
          <p v-if="ctx.data.value.current">
            Área aproximada do contorno aprovado:
            {{
              Number(ctx.data.value.current.hectares).toLocaleString('pt-BR', {
                maximumFractionDigits: 2,
              })
            }}
            ha. Não altera o tamanho cadastrado da propriedade ou do talhão.
          </p>
          <h3>Propostas e histórico — até 50 versões</h3>
          <article v-for="v in ctx.data.value.versions" :key="v.id">
            <p>
              {{ new Date(v.created_at).toLocaleString('pt-BR') }} •
              {{ { pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado' }[v.status] }} •
              {{ Number(v.hectares).toFixed(2) }} ha
            </p>
            <button
              class="button button--secondary"
              :disabled="busy"
              @click="setGeometry(v.geometry, 'geojson')"
            >
              Visualizar esta versão no mapa
            </button>
            <template v-if="owner && v.status === 'pending'"
              ><button
                class="button button--primary"
                :disabled="busy"
                @click="action('approve', { id: v.id })"
              >
                Aprovar proposta</button
              ><button
                class="button button--secondary"
                :disabled="busy"
                @click="action('reject', { id: v.id })"
              >
                Rejeitar proposta
              </button></template
            >
          </article>
          <section v-if="owner && area">
            <h3>Seleção para o pacote de satélite</h3>
            <button
              class="button button--secondary"
              :disabled="busy || !subscription.data.value?.entitlement?.enabled"
              @click="monitor(!subscription.data.value?.fields?.includes(area))"
            >
              {{
                subscription.data.value?.fields?.includes(area)
                  ? 'Retirar talhão do pacote'
                  : 'Selecionar talhão para o pacote'
              }}
            </button>
          </section>
          <SatelliteImagery
            v-if="area && !dirty && ctx.data.value.current?.geometry?.type === 'Polygon'"
            :key="selected.id + ':' + area"
            :property-id="selected.id"
            :area-id="area"
            :share-id="selected.share"
            :owner="owner"
            :revision="ctx.data.value.current.id"
            :eligible="
              !!subscription.data.value?.entitlement?.enabled &&
              !!subscription.data.value?.fields?.includes(area)
            "
            :enabled="
              !!subscription.data.value?.provider_ready &&
              !!subscription.data.value?.entitlement?.enabled &&
              !!subscription.data.value?.fields?.includes(area)
            "
            @overlay="overlay = $event"
            @consumption="subscription.reload()"
          />
        </section>
      </RequestState>
      <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <section class="rural-panel">
        <h3>MeuAgro Satélite — piloto</h3>
        <RequestState
          :loading="subscription.loading.value"
          :error="subscription.error.value"
          @retry="subscription.reload"
        >
          <p>
            Consultas dependem da configuração do provedor no servidor e da franquia provisionada
            pelo administrador. Nenhuma assinatura é contratada nesta tela. A atualização do piloto
            é manual.
          </p>
          <template v-if="subscription.data.value?.entitlement"
            ><p>
              Pacote
              {{
                subscription.data.value.entitlement.enabled ? 'habilitado para seleção' : 'inativo'
              }}
              • Até {{ subscription.data.value.entitlement.max_fields }} talhões • Até
              {{ subscription.data.value.entitlement.max_field_ha }} ha por talhão.
            </p>
            <p>
              Reserva de consumo no mês UTC: {{ subscription.data.value.usage?.requests || 0 }} /
              {{ subscription.data.value.entitlement.requests_month }} requisições e
              {{ subscription.data.value.usage?.pu || 0 }} /
              {{ subscription.data.value.entitlement.pu_month }} PUs.
            </p>
            <template v-if="subscription.data.value.budget">
              <h4>Conferência de consumo — mês UTC</h4>
              <p>
                Operações sem total de requisições confirmado:
                {{ subscription.data.value.budget.requests_unknown }}.
              </p>
              <p>
                Requisições observadas: {{ subscription.data.value.budget.requests_observed }}. PUs
                observadas (mínimo): {{ subscription.data.value.budget.pu_lower_bound }}. Operações
                sem total de PUs confirmado: {{ subscription.data.value.budget.pu_unknown }}.
              </p>
              <p>
                Em processamento: {{ subscription.data.value.budget.processing }} • Falhas:
                {{ subscription.data.value.budget.failed }} • Imagens sem cena elegível:
                {{ subscription.data.value.budget.no_data }}.
              </p>
              <p>
                A reserva acima controla o saldo disponível; o consumo observado não libera a
                diferença. Falhas e operações pendentes preservam a reserva. Estes números não
                representam uma cobrança em reais nem substituem o painel do Copernicus.
              </p>
              <p>
                Para economizar, busque as cenas disponíveis antes de processar. Reabrir uma imagem
                salva ou repetir a mesma consulta em cache não faz nova chamada ao provedor. Buscas
                expiram; mudar o intervalo, a camada ou o contorno pode reservar novo consumo.
              </p>
              <button
                class="button button--secondary"
                :disabled="subscription.loading.value"
                @click="subscription.reload()"
              >
                Atualizar consumo sem consultar o satélite
              </button>
            </template>
          </template>
        </RequestState>
      </section>
    </template>
  </div>
</template>
<style scoped>
.satellite-page select,
.satellite-page textarea,
.satellite-page input {
  max-width: 100%;
  width: 100%;
  margin-bottom: 0.8rem;
  padding: 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 0.65rem;
  font: inherit;
}
.satellite-page .button {
  margin: 0.3rem;
}
.satellite-page p {
  overflow-wrap: anywhere;
}
</style>
