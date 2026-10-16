<script setup>
import { computed, reactive, ref, watch, onScopeDispose } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import {
  listTechnicalVisits,
  listTechnicalVisitPhotos,
  saveTechnicalVisit,
  addTechnicalVisitPhoto,
  technicalVisitCompanies,
} from '../../services/technicalVisitService.js';
import { listActiveProperties } from '../../services/propertyService.js';
import { listAreasByProperty } from '../../services/areaService.js';
import { listActiveCrops } from '../../services/cropService.js';
import { listProductionCycles } from '../../services/productionCycleService.js';
import { isNativeCameraPlatform, takePhotoWithCamera } from '../../services/cameraService.js';
import { validatePhotoFile } from '../../services/photoService.js';
import { offlineUserId, isOnline } from '../../offline/runtime.js';
import { useOffline } from '../../offline/useOffline.js';
import { anamnesisFields, priorities } from './visitModel.js';
import { matchesReturn, visitsCsv, returnCalendar, downloadVisitFile } from './visitFollowup.js';
import VisitReport from './VisitReport.vue';
import { toDateTimeLocalValue } from '../../js/html.js';
import RequestState from '../properties/components/RequestState.vue';
import RuralDialog from '../properties/components/RuralDialog.vue';
import '../properties/rural.css';
const emit = defineEmits(['navigate']);
const q = new URLSearchParams(location.search),
  creating = q.has('new'),
  visitId = q.get('id');
const { status } = useOffline();
const team = ref(q.has('team')),
  search = ref(''),
  priority = ref(''),
  returnFilter = ref(''),
  reportOpen = ref(false),
  exportError = ref('');
const visits = useResource(() => listTechnicalVisits(team.value), []);
const selected = computed(() => visits.data.value.find((v) => v.id === visitId));
const options = useResource(async () => {
  if (!creating) return null;
  const [properties, crops, cycles, companies] = await Promise.all([
    listActiveProperties(),
    listActiveCrops(),
    listProductionCycles(),
    technicalVisitCompanies(),
  ]);
  return { properties, crops, cycles, companies };
}, null);
const f = reactive({
  producer_name: '',
  site_name: '',
  area_name: '',
  crop_name: '',
  property_id: '',
  area_id: '',
  crop_id: '',
  production_cycle_id: '',
  seller_id: '',
  visited_at: toDateTimeLocalValue(new Date()),
  next_visit: '',
  priority: 'medium',
  anamnesis: Object.fromEntries(anamnesisFields.map(([key]) => [key, ''])),
});
const areas = useResource(
  () => (f.property_id ? listAreasByProperty(f.property_id) : Promise.resolve([])),
  [],
);
watch(
  () => f.property_id,
  () => {
    areas.reset();
    void areas.reload();
  },
);
watch(team, () => {
  visits.reset();
  void visits.reload();
});
const gallery = useResource(
  () => (selected.value ? listTechnicalVisitPhotos(selected.value) : Promise.resolve([])),
  [],
);
watch(selected, () => {
  gallery.reset();
  void gallery.reload();
});
const mutation = useMutation(),
  photoMutation = useMutation(false),
  attachments = ref([]),
  previewed = ref(null),
  picking = ref(false);
const filterText = (value) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
const filtered = computed(() =>
  visits.data.value.filter(
    (v) =>
      (!priority.value || v.priority === priority.value) &&
      matchesReturn(v, returnFilter.value) &&
      filterText(
        [v.producer_name, v.site_name, v.area_name, v.crop_name, v.anamnesis.reason].join(' '),
      ).includes(filterText(search.value)),
  ),
);
const when = (value) => new Date(value).toLocaleString('pt-BR');
const native = isNativeCameraPlatform();
function exportCsv() {
  exportError.value = '';
  try {
    downloadVisitFile(visitsCsv(filtered.value), 'text/csv;charset=utf-8', 'meuagro-visitas.csv');
  } catch {
    exportError.value = 'Não foi possível exportar. Tente pela versão no navegador.';
  }
}
function exportReturn() {
  exportError.value = '';
  try {
    downloadVisitFile(
      returnCalendar(selected.value),
      'text/calendar;charset=utf-8',
      'meuagro-retorno.ics',
    );
  } catch (error) {
    exportError.value = error.message;
  }
}
function propertyChanged() {
  f.site_name =
    options.data.value?.properties.find((p) => p.id === f.property_id)?.name || f.site_name;
  f.area_id = '';
  f.area_name = '';
  f.production_cycle_id = '';
}
function areaChanged() {
  f.area_name = areas.data.value.find((a) => a.id === f.area_id)?.name || '';
  f.production_cycle_id = '';
}
function cropChanged() {
  f.crop_name = options.data.value?.crops.find((c) => c.id === f.crop_id)?.name || '';
  f.production_cycle_id = '';
}
function cycleChanged() {
  const c = options.data.value?.cycles.find((c) => c.id === f.production_cycle_id);
  if (!c) return;
  f.property_id = c.property_id;
  f.area_id = c.area_id;
  f.crop_id = c.crop_id;
  f.site_name = c.property?.name || f.site_name;
  f.area_name = c.area?.name || f.area_name;
  f.crop_name = c.crop?.name || f.crop_name;
}
function attach(file) {
  const error = validatePhotoFile(file);
  if (error) throw Error(error);
  if (attachments.value.length >= 5) throw Error('Adicione até cinco fotos por envio.');
  attachments.value.push({ file, description: '', preview: URL.createObjectURL(file) });
}
function filesSelected(event) {
  const input = event.target;
  photoMutation.error.value = '';
  try {
    for (const file of input.files || []) attach(file);
  } catch (error) {
    photoMutation.error.value = error.message;
  }
  input.value = '';
}
async function camera() {
  if (picking.value) return;
  picking.value = true;
  photoMutation.error.value = '';
  try {
    const result = await takePhotoWithCamera();
    if (result) attach(result.file);
  } catch (error) {
    photoMutation.error.value = error.message;
  } finally {
    picking.value = false;
  }
}
function removeAttachment(index) {
  URL.revokeObjectURL(attachments.value[index].preview);
  attachments.value.splice(index, 1);
  photoMutation.error.value = '';
}
onScopeDispose(() => attachments.value.forEach((a) => URL.revokeObjectURL(a.preview)));
function submit() {
  if (
    options.loading.value ||
    options.error.value ||
    areas.loading.value ||
    mutation.busy.value ||
    photoMutation.error.value
  )
    return;
  void mutation.run(
    () => saveTechnicalVisit(f, attachments.value),
    (id) => emit('navigate', '/more/visits?id=' + encodeURIComponent(id)),
  );
}
async function saveMorePhotos() {
  if (!selected.value || !attachments.value.length || photoMutation.busy.value) return;
  // One at a time so a failed second save never duplicates the first attachment.
  await photoMutation.run(
    async () => {
      while (attachments.value.length) {
        await addTechnicalVisitPhoto(selected.value, attachments.value[0]);
        removeAttachment(0);
      }
      await gallery.reload();
      if (gallery.error.value)
        throw Error('As fotos foram salvas. Atualize a galeria para conferir.');
    },
    () => {},
  );
}
</script>
<template>
  <div class="rural-vue visits-page">
    <header class="rural-header">
      <h2>
        {{
          creating
            ? 'Nova visita técnica'
            : visitId
              ? 'Ficha de visita técnica'
              : 'Visitas técnicas'
        }}
      </h2>
      <a
        v-if="!creating && !visitId"
        href="/more/visits?new=1"
        data-link
        class="button button--primary"
        >Registrar visita</a
      ><a v-else href="/more/visits" data-link class="button button--secondary"
        >Voltar às visitas</a
      >
    </header>
    <template v-if="creating">
      <RequestState
        :loading="options.loading.value"
        :error="options.error.value"
        @retry="options.reload"
      >
        <form v-if="options.data.value" class="rural-panel" @submit.prevent="submit">
          <p>
            A ficha e suas fotos ficam salvas neste dispositivo até a sincronização. Revise antes de
            registrar: fichas salvas preservam o histórico e não são sobrescritas.
          </p>
          <fieldset :disabled="mutation.busy.value || mutation.done.value || picking">
            <h3>Identificação e local da visita</h3>
            <div class="field">
              <label for="visit-date">Data e horário da visita *</label
              ><input id="visit-date" v-model="f.visited_at" type="datetime-local" required />
            </div>
            <div class="field">
              <label for="visit-producer">Produtor / pessoa atendida *</label
              ><input
                id="visit-producer"
                v-model="f.producer_name"
                required
                minlength="2"
                maxlength="120"
              />
            </div>
            <div class="field">
              <label for="visit-company">Atuação nesta visita</label
              ><select id="visit-company" v-model="f.seller_id">
                <option value="">Pessoal / independente — ficha privada</option>
                <option v-for="c in options.data.value.companies" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
            <p v-if="f.seller_id">
              Ao vincular à empresa, seus gerentes e o dono poderão acompanhar esta ficha e suas
              fotos. Outros representantes não terão acesso.
            </p>
            <div class="field">
              <label for="visit-property">Propriedade cadastrada na minha conta</label
              ><select id="visit-property" v-model="f.property_id" @change="propertyChanged">
                <option value="">Informar o local pelo nome</option>
                <option v-for="p in options.data.value.properties" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="visit-site">Sítio / propriedade visitada *</label
              ><input
                id="visit-site"
                v-model="f.site_name"
                required
                minlength="2"
                maxlength="160"
              />
            </div>
            <p>
              Para propriedades de clientes não cadastradas na sua conta, informe os nomes do local,
              talhão e cultura abaixo.
            </p>
            <div v-if="f.property_id" class="field">
              <label for="visit-area">Talhão cadastrado</label
              ><select
                id="visit-area"
                v-model="f.area_id"
                :disabled="areas.loading.value"
                @change="areaChanged"
              >
                <option value="">Visita geral à propriedade</option>
                <option v-for="a in areas.data.value" :key="a.id" :value="a.id">
                  {{ a.name }}
                </option>
              </select>
              <p v-if="areas.error.value" role="alert">{{ areas.error.value }}</p>
            </div>
            <div class="field">
              <label for="visit-area-name">Talhão / setor observado</label
              ><input id="visit-area-name" v-model="f.area_name" maxlength="160" />
            </div>
            <div class="field">
              <label for="visit-crop">Cultura cadastrada</label
              ><select id="visit-crop" v-model="f.crop_id" @change="cropChanged">
                <option value="">Sem cultura específica / informar pelo nome</option>
                <option v-for="c in options.data.value.crops" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="visit-crop-name">Cultura / variedade observada</label
              ><input id="visit-crop-name" v-model="f.crop_name" maxlength="120" />
            </div>
            <div v-if="f.property_id" class="field">
              <label for="visit-cycle">Plantio acompanhado</label
              ><select id="visit-cycle" v-model="f.production_cycle_id" @change="cycleChanged">
                <option value="">Sem vínculo com um plantio</option>
                <option
                  v-for="c in options.data.value.cycles.filter(
                    (c) => c.property_id === f.property_id,
                  )"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.area?.name }} • {{ c.crop?.name }} {{ c.variety || '' }}
                </option>
              </select>
            </div>
            <h3>Anamnese da visita</h3>
            <div v-for="[key, label] in anamnesisFields" :key="key" class="field">
              <label :for="'visit-' + key">{{ label }}{{ key === 'reason' ? ' *' : '' }}</label
              ><textarea
                :id="'visit-' + key"
                v-model="f.anamnesis[key]"
                :required="key === 'reason'"
                maxlength="4000"
                rows="3"
              />
            </div>
            <div class="field">
              <label for="visit-priority">Prioridade do acompanhamento</label
              ><select id="visit-priority" v-model="f.priority">
                <option v-for="(label, key) in priorities" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="visit-next">Data sugerida para retorno</label
              ><input
                id="visit-next"
                v-model="f.next_visit"
                type="date"
                :min="f.visited_at.slice(0, 10)"
              />
            </div>
          </fieldset>
          <section class="visit-attachments">
            <h3>Fotos de problemas e observações</h3>
            <p>
              Até cinco fotos JPG, PNG ou WebP, com até 8 MB cada. As legendas identificam o
              problema observado.
            </p>
            <button
              v-if="native"
              type="button"
              class="button button--secondary"
              :disabled="mutation.busy.value || picking"
              @click="camera"
            >
              Tirar foto
            </button>
            <label class="field"
              >Escolher fotos<input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                :disabled="mutation.busy.value || picking"
                @change="filesSelected"
            /></label>
            <article v-for="(item, index) in attachments" :key="item.preview" class="rural-card">
              <img class="visit-photo" :src="item.preview" alt="Prévia da foto anexada" /><label
                class="field"
                >Legenda da foto {{ index + 1
                }}<textarea
                  v-model="item.description"
                  maxlength="1600"
                  :disabled="mutation.busy.value"
                /></label
              ><button
                type="button"
                class="button button--secondary"
                :disabled="mutation.busy.value"
                @click="removeAttachment(index)"
              >
                Remover foto
              </button>
            </article>
          </section>
          <p v-if="mutation.error.value || photoMutation.error.value" role="alert">
            {{ mutation.error.value || photoMutation.error.value }}
          </p>
          <button
            class="button button--primary"
            :disabled="mutation.busy.value || mutation.done.value || picking || areas.loading.value"
          >
            {{ mutation.busy.value ? 'Salvando no dispositivo…' : 'Registrar anamnese' }}
          </button>
        </form>
      </RequestState>
    </template>
    <template v-else-if="visitId">
      <RequestState
        :loading="visits.loading.value"
        :error="visits.error.value"
        @retry="visits.reload"
      >
        <template v-if="selected">
          <section class="rural-panel">
            <h3>{{ selected.site_name }}</h3>
            <p>{{ selected.producer_name }} • {{ when(selected.visited_at) }}</p>
            <p>Registrada por {{ selected.technician_name }}</p>
            <p>
              {{ selected.area_name || 'Visita geral' }} •
              {{ selected.crop_name || 'Sem cultura específica' }}
            </p>
            <p>Prioridade: {{ priorities[selected.priority] }}</p>
            <p v-if="selected.offline_pending" role="status">
              Salva neste dispositivo • aguardando envio
            </p>
            <p>
              {{
                selected.seller_id
                  ? 'Ficha vinculada à empresa — acesso do autor e da gestão autorizada.'
                  : 'Ficha pessoal / independente — acesso privado.'
              }}
            </p>
            <p v-if="selected.next_visit">
              Retorno sugerido: {{ selected.next_visit.split('-').reverse().join('/') }}
            </p>
            <button
              class="button button--secondary"
              :disabled="gallery.loading.value || !!gallery.error.value"
              @click="reportOpen = true"
            >
              Visualizar relatório
            </button>
            <p v-if="gallery.error.value">
              Atualize as fotos abaixo para gerar o relatório completo.
            </p>
            <button
              v-if="selected.next_visit"
              class="button button--secondary"
              @click="exportReturn"
            >
              Exportar retorno para calendário
            </button>
            <p v-if="selected.next_visit">
              O arquivo deve ser importado no seu calendário. A data é sugerida; não há lembrete
              automático nem atualização posterior do evento.
            </p>
            <p v-if="exportError" role="alert">{{ exportError }}</p>
            <a
              v-if="selected.production_cycle_id && selected.author_id === offlineUserId()"
              :href="'/plantings/' + encodeURIComponent(selected.production_cycle_id)"
              class="button button--secondary"
              data-link
              >Ver plantio vinculado</a
            >
          </section>
          <section v-for="[key, label] in anamnesisFields" :key="key" class="rural-panel">
            <h3>{{ label }}</h3>
            <p class="visit-text">{{ selected.anamnesis[key] || 'Não informado' }}</p>
          </section>
          <section class="rural-panel">
            <h3>Fotos da visita</h3>
            <RequestState
              :loading="gallery.loading.value"
              :error="gallery.error.value"
              @retry="gallery.reload"
              ><p v-if="!gallery.data.value.length">Nenhuma foto registrada.</p>
              <article v-for="photo in gallery.data.value" :key="photo.id" class="rural-card">
                <button
                  v-if="photo.signed_url"
                  class="visit-photo-button"
                  type="button"
                  :aria-label="'Ampliar foto: ' + (photo.description || 'Visita técnica')"
                  @click="previewed = photo"
                >
                  <img
                    class="visit-photo"
                    :src="photo.signed_url"
                    :alt="photo.description || 'Foto da visita técnica'"
                  />
                </button>
                <p v-else>Imagem indisponível neste dispositivo.</p>
                <p class="visit-text">{{ photo.description || 'Sem legenda' }}</p>
                <p v-if="photo.offline_pending">Foto aguardando envio.</p>
              </article></RequestState
            >
          </section>
          <section v-if="selected.author_id === offlineUserId()" class="rural-panel">
            <h3>Acrescentar fotos</h3>
            <button
              v-if="native"
              class="button button--secondary"
              :disabled="photoMutation.busy.value || picking"
              @click="camera"
            >
              Tirar foto</button
            ><label class="field"
              >Escolher fotos<input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                :disabled="photoMutation.busy.value"
                @change="filesSelected"
            /></label>
            <article v-for="(item, index) in attachments" :key="item.preview" class="rural-card">
              <img class="visit-photo" :src="item.preview" alt="Prévia da foto" /><label
                class="field"
                >Legenda da foto {{ index + 1
                }}<textarea
                  v-model="item.description"
                  maxlength="1600"
                  :disabled="photoMutation.busy.value"
                /></label
              ><button
                class="button button--secondary"
                :disabled="photoMutation.busy.value"
                @click="removeAttachment(index)"
              >
                Remover foto
              </button>
            </article>
            <p v-if="photoMutation.error.value" role="alert">{{ photoMutation.error.value }}</p>
            <button
              class="button button--primary"
              :disabled="!attachments.length || photoMutation.busy.value || picking"
              @click="saveMorePhotos"
            >
              Salvar fotos no dispositivo
            </button>
          </section>
        </template>
        <section v-else class="rural-panel">
          <h3>Visita indisponível</h3>
          <p>
            Volte à lista e atualize o histórico. A ficha precisa estar disponível para sua conta.
          </p>
        </section>
      </RequestState>
    </template>
    <template v-else>
      <section class="rural-panel">
        <p>
          Histórico das 200 visitas mais recentes carregadas, além dos registros locais pendentes.
        </p>
        <div class="field">
          <label for="visit-search">Buscar produtor, propriedade, talhão, cultura ou motivo</label
          ><input id="visit-search" v-model="search" type="search" />
        </div>
        <div class="field">
          <label for="visit-filter">Filtrar prioridade</label
          ><select id="visit-filter" v-model="priority">
            <option value="">Todas</option>
            <option v-for="(label, key) in priorities" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <label
          ><input v-model="team" type="checkbox" :disabled="!status.online" /> Incluir visitas da
          equipe disponíveis para meu acesso (internet)</label
        ><button
          class="button button--secondary"
          :disabled="visits.loading.value"
          @click="visits.reload"
        >
          Atualizar visitas
        </button>
        <div class="field">
          <label for="visit-return-filter">Retorno sugerido</label>
          <select id="visit-return-filter" v-model="returnFilter">
            <option value="">Todos</option>
            <option value="overdue">Data anterior a hoje</option>
            <option value="today">Hoje</option>
            <option value="week">Próximos sete dias (a partir de amanhã)</option>
            <option value="none">Sem retorno definido</option>
          </select>
        </div>
        <p>
          Datas sugeridas não indicam conclusão ou atraso de uma tarefa. Os filtros e a exportação
          abrangem somente as visitas carregadas.
        </p>
        <button
          class="button button--secondary"
          :disabled="!filtered.length || visits.loading.value || !!visits.error.value"
          @click="exportCsv"
        >
          Exportar lista filtrada (CSV)
        </button>
        <p v-if="native">
          Se o download não estiver disponível no aplicativo, use a versão pelo navegador.
        </p>
        <p v-if="exportError" role="alert">{{ exportError }}</p>
      </section>
      <RequestState
        :loading="visits.loading.value"
        :error="visits.error.value"
        @retry="visits.reload"
        ><section v-if="!filtered.length" class="rural-panel">
          <h3>Nenhuma visita encontrada</h3>
          <p>Registre sua primeira anamnese ou ajuste a busca.</p>
        </section>
        <article v-for="v in filtered" :key="v.id" class="rural-panel">
          <h3>{{ v.site_name }}</h3>
          <p>{{ v.producer_name }} • {{ when(v.visited_at) }}</p>
          <p>Registrada por {{ v.technician_name }}</p>
          <p>{{ v.area_name || 'Visita geral' }} • {{ v.crop_name || 'Sem cultura específica' }}</p>
          <p>{{ priorities[v.priority] }} • {{ v.anamnesis.reason }}</p>
          <p v-if="v.next_visit">
            Retorno sugerido: {{ v.next_visit.split('-').reverse().join('/') }}
          </p>
          <p v-if="v.offline_pending">Aguardando envio</p>
          <a
            :href="'/more/visits?id=' + encodeURIComponent(v.id) + (team ? '&team=1' : '')"
            class="button button--secondary"
            data-link
            >Abrir anamnese</a
          >
        </article></RequestState
      >
    </template>
    <VisitReport
      v-if="reportOpen && selected"
      :visit="selected"
      :photos="gallery.data.value"
      :native="native"
      @close="reportOpen = false"
    />
    <RuralDialog
      v-if="previewed"
      title="Foto da visita técnica"
      :busy="false"
      @close="previewed = null"
      ><img
        class="visit-photo"
        :src="previewed.signed_url"
        :alt="previewed.description || 'Foto da visita técnica'"
      />
      <p>{{ previewed.description }}</p>
      <button class="button button--secondary" @click="previewed = null">
        Fechar foto
      </button></RuralDialog
    >
  </div>
</template>
<style scoped>
.visit-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.visit-photo {
  display: block;
  width: 100%;
  max-height: 28rem;
  object-fit: contain;
  border-radius: 0.75rem;
}
.visit-photo-button {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
}
.visit-attachments {
  margin-block: 1.5rem;
}
.visits-page select,
.visits-page input,
.visits-page textarea {
  max-width: 100%;
}
.visits-page input[type='checkbox'] {
  width: auto;
}
</style>
