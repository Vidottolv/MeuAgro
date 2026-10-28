<script setup>
import { ref, reactive, watch } from 'vue';
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc, workspaceFunction } from '../../services/workspaceService.js';
import { localDay, downloadVisitFile } from '../visits/visitFollowup.js';
import { simpleCsv } from '../planning/planningModel.js';
import '../properties/rural.css';
const property = ref(''),
  station = ref('Principal'),
  from = ref(localDay(new Date(Date.now() - 30 * 86400000))),
  to = ref(localDay()),
  forecast = ref(null),
  fetching = ref(false),
  voiding = ref(''),
  reason = ref('');
const site = reactive({ latitude: '', longitude: '' }),
  rain = reactive({ day: localDay(), millimeters: '', note: '' });
let fetchEpoch = 0;
const w = useWorkspace(() =>
  workspaceRpc('weather_context', {
    p_property: property.value || null,
    p_station: station.value,
    p_from: from.value,
    p_to: to.value,
  }),
);
const { data, error, busy, loading, status, notice } = w;
watch(property, () => {
  ++fetchEpoch;
  forecast.value = null;
  fetching.value = false;
});
watch(w.invalidated, () => {
  forecast.value = null;
  voiding.value = '';
  fetching.value = false;
  ++fetchEpoch;
});
watch(data, (value, previous) => {
  if (value?.site?.version !== previous?.site?.version) {
    ++fetchEpoch;
    fetching.value = false;
  }
  site.latitude = value?.site?.latitude == null ? '' : String(value.site.latitude);
  site.longitude = value?.site?.longitude == null ? '' : String(value.site.longitude);
  forecast.value = value?.cache
    ? { data: value.cache.data, fetched_at: value.cache.fetched_at }
    : null;
});
async function saveSite() {
  await w.command('weather_command', {
    p_action: 'site',
    p_data: {
      property_id: property.value,
      version: data.value?.site?.version || 0,
      latitude: site.latitude.trim().replace(',', '.'),
      longitude: site.longitude.trim().replace(',', '.'),
    },
  });
}
async function saveRain() {
  await w.command(
    'weather_command',
    {
      p_action: 'rain',
      p_data: {
        property_id: property.value,
        station: station.value,
        day: rain.day,
        millimeters: rain.millimeters.trim().replace(',', '.'),
        note: rain.note,
      },
    },
    () => Object.assign(rain, { day: localDay(), millimeters: '', note: '' }),
  );
}
async function update() {
  const token = ++fetchEpoch;
  fetching.value = true;
  error.value = '';
  try {
    const result = await workspaceFunction('weather-forecast', { property_id: property.value });
    if (token === fetchEpoch) forecast.value = result;
  } catch (e) {
    if (token === fetchEpoch) error.value = e.message;
  } finally {
    if (token === fetchEpoch) fetching.value = false;
  }
}
async function voidRain() {
  await w.command(
    'weather_command',
    { p_action: 'void', p_data: { id: voiding.value, reason: reason.value } },
    () => {
      voiding.value = '';
      reason.value = '';
    },
  );
}
function exportRain() {
  downloadVisitFile(
    simpleCsv(
      ['Dia', 'Estação', 'Chuva mm', 'Observação', 'Anulada', 'Motivo'],
      data.value.rain.map((r) => [
        r.day,
        r.station,
        r.millimeters,
        r.note,
        r.voided_at ? 'Sim' : 'Não',
        r.void_reason,
      ]),
    ),
    'text/csv;charset=utf-8',
    'meuagro-chuvas.csv',
  );
}
</script>
<template>
  <div class="rural-vue">
    <h2>Clima e chuva da propriedade</h2>
    <p>
      Previsão regional e medições de campo têm fontes diferentes. A previsão não determina sozinha
      uma aplicação ou irrigação.
    </p>
    <p v-if="!status.online">Conecte-se para consultar clima e registrar chuva.</p>
    <template v-else
      ><p v-if="error" role="alert">{{ error }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <form
        class="rural-panel"
        @submit.prevent="
          forecast = null;
          w.load();
        "
      >
        <div class="field">
          <label for="weather-property">Propriedade</label
          ><select
            id="weather-property"
            v-model="property"
            @change="
              forecast = null;
              w.load();
            "
          >
            <option value="">Selecione</option>
            <option v-for="p in data?.properties || []" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="weather-station">Estação / pluviômetro</label
          ><input id="weather-station" v-model="station" maxlength="80" required />
        </div>
        <div class="field">
          <label for="weather-from">Leituras de</label
          ><input id="weather-from" v-model="from" type="date" required />
        </div>
        <div class="field">
          <label for="weather-to">Leituras até</label
          ><input id="weather-to" v-model="to" type="date" required />
        </div>
        <button class="button button--secondary" :disabled="loading || busy">
          Atualizar histórico
        </button>
      </form>
      <p v-if="loading">Carregando…</p>
      <template v-if="data && property"
        ><section class="rural-panel">
          <h3>Localização da previsão</h3>
          <p>
            Coordenadas WGS84 do ponto de referência da propriedade. Isso não altera o contorno
            georreferenciado.
          </p>
          <form @submit.prevent="saveSite">
            <div class="field">
              <label for="weather-lat">Latitude</label
              ><input id="weather-lat" v-model="site.latitude" required placeholder="-23,5505" />
            </div>
            <div class="field">
              <label for="weather-lon">Longitude</label
              ><input id="weather-lon" v-model="site.longitude" required placeholder="-46,6333" />
            </div>
            <button class="button button--secondary" :disabled="busy || loading">
              Salvar ponto meteorológico
            </button>
          </form>
          <button class="button" :disabled="fetching || busy || !data.site" @click="update">
            {{ fetching ? 'Consultando…' : 'Consultar previsão de sete dias' }}
          </button>
          <p>
            Consulta manual com cache de duas horas. A ativação do provedor depende da chave
            comercial no servidor. Não há consulta automática ao abrir a tela.
          </p>
        </section>
        <section v-if="forecast" class="rural-panel">
          <h3>Previsão regional</h3>
          <p>
            Fonte: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>.
            Atualizada em {{ new Date(forecast.fetched_at).toLocaleString('pt-BR') }} • fuso
            {{ forecast.data.timezone }}. Valores ausentes não equivalem a zero.
          </p>
          <article v-for="d in forecast.data.days" :key="d.day" class="rural-card">
            <h4>{{ d.day.split('-').reverse().join('/') }}</h4>
            <p>
              {{ d.min ?? '—' }} a {{ d.max ?? '—' }} °C • precipitação prevista
              {{ d.rain ?? '—' }} mm • vento máximo {{ d.wind ?? '—' }} km/h
            </p>
          </article>
        </section>
        <section class="rural-panel">
          <h3>Registrar chuva observada — {{ station }}</h3>
          <form @submit.prevent="saveRain">
            <div class="field">
              <label for="rain-day">Dia da leitura</label
              ><input id="rain-day" v-model="rain.day" type="date" :max="localDay()" required />
            </div>
            <div class="field">
              <label for="rain-mm">Chuva (mm)</label
              ><input id="rain-mm" v-model="rain.millimeters" inputmode="decimal" required />
            </div>
            <div class="field">
              <label for="rain-note">Observação da leitura</label
              ><textarea id="rain-note" v-model="rain.note" maxlength="1000" />
            </div>
            <button class="button" :disabled="busy || loading">Salvar leitura de chuva</button>
          </form>
          <p>
            Uma leitura ativa por dia e estação. Registre 0 mm apenas quando houve medição sem
            chuva. Para corrigir, anule a leitura com motivo e registre novamente.
          </p>
        </section>
        <section class="rural-panel">
          <h3>Histórico de chuva observada</h3>
          <p>
            {{ data.rain_days }} dia(s) medidos • total
            {{ data.rain_total === null ? 'Não há medições' : data.rain_total + ' mm' }} nesta
            estação e período. Dias sem registro são desconhecidos; esta soma não comprova o total
            de chuva do período.
          </p>
          <p v-if="data.rain_count > 1000">
            Mostrando as 1000 leituras mais recentes; totais abrangem todo o período.
          </p>
          <article v-for="r in data.rain" :key="r.id" class="rural-card">
            <h4>{{ r.day.split('-').reverse().join('/') }} — {{ r.millimeters }} mm</h4>
            <p>{{ r.station }} • {{ r.note }}</p>
            <p v-if="r.voided_at">Anulada: {{ r.void_reason }}</p>
            <button
              v-else
              class="button button--secondary"
              :disabled="busy"
              @click="voiding = r.id"
            >
              Anular leitura
            </button>
          </article>
          <form v-if="voiding" @submit.prevent="voidRain">
            <label for="rain-void">Motivo da anulação</label
            ><textarea
              id="rain-void"
              v-model="reason"
              minlength="2"
              maxlength="1000"
              required
            /><button class="button" :disabled="busy">Confirmar anulação</button
            ><button type="button" class="button button--secondary" @click="voiding = ''">
              Voltar
            </button>
          </form>
          <button
            class="button button--secondary"
            :disabled="!data.rain.length"
            @click="exportRain"
          >
            Exportar leituras exibidas (CSV)
          </button>
        </section></template
      ></template
    >
  </div>
</template>
<style scoped>
input,
select,
textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
  padding: 0.75rem;
  border: 1px solid #d7dfd4;
  border-radius: 0.75rem;
  font: inherit;
}
button {
  margin: 0.25rem;
}
p {
  overflow-wrap: anywhere;
}
</style>
