<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { anamnesisFields, priorities } from './visitModel.js';
defineProps({
  visit: { type: Object, required: true },
  photos: { type: Array, default: () => [] },
  native: Boolean,
  photosIncluded: { type: Boolean, default: true },
});
defineEmits(['close']);
const printReport = () => window.print();
const when = (value) => new Date(value).toLocaleString('pt-BR');
const root = ref(null);
const previousFocus = document.activeElement;
const siblings = [];
onMounted(() => {
  for (const element of document.body.children) {
    if (element !== root.value && element instanceof HTMLElement) {
      siblings.push([element, element.inert]);
      element.inert = true;
    }
  }
  root.value?.querySelector('button')?.focus();
});
onBeforeUnmount(() => {
  for (const [element, inert] of siblings) element.inert = inert;
  previousFocus?.focus();
});
function keepFocus(event) {
  const buttons = [...root.value.querySelectorAll('button')];
  const first = buttons[0],
    last = buttons.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>
<template>
  <Teleport to="body">
    <section
      ref="root"
      class="visit-report-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visit-report-title"
      tabindex="-1"
      @keydown.esc="$emit('close')"
      @keydown.tab="keepFocus"
    >
      <nav class="visit-report-actions">
        <button v-if="!native" class="button button--primary" @click="printReport">
          Imprimir / salvar PDF
        </button>
        <button class="button button--secondary" autofocus @click="$emit('close')">
          Fechar relatório
        </button>
        <p v-if="native">A impressão em PDF está disponível na versão pelo navegador.</p>
        <p v-else>No diálogo de impressão, escolha salvar como PDF para gerar o arquivo.</p>
      </nav>
      <h1 id="visit-report-title">MeuAgro — Relatório de visita técnica</h1>
      <p>Registro de acompanhamento técnico. Não substitui receituário agronômico.</p>
      <p v-if="visit.offline_pending">
        <strong>Pendente de sincronização — salvo neste dispositivo.</strong>
      </p>
      <dl>
        <dt>Produtor</dt>
        <dd>{{ visit.producer_name }}</dd>
        <dt>Propriedade</dt>
        <dd>{{ visit.site_name }}</dd>
        <dt>Talhão / setor</dt>
        <dd>{{ visit.area_name || 'Não informado' }}</dd>
        <dt>Cultura / variedade</dt>
        <dd>{{ visit.crop_name || 'Não informada' }}</dd>
        <dt>Profissional</dt>
        <dd>{{ visit.technician_name }}</dd>
        <dt>Data da visita</dt>
        <dd>{{ when(visit.visited_at) }}</dd>
        <dt>Prioridade</dt>
        <dd>{{ priorities[visit.priority] }}</dd>
        <dt>Retorno sugerido</dt>
        <dd>{{ visit.next_visit?.split('-').reverse().join('/') || 'Não informado' }}</dd>
        <dt>Vínculo</dt>
        <dd>
          {{ visit.seller_id ? 'Ficha vinculada à empresa' : 'Ficha pessoal / independente' }}
        </dd>
      </dl>
      <section v-for="[key, label] in anamnesisFields" :key="key">
        <h2>{{ label }}</h2>
        <p class="visit-report-text">{{ visit.anamnesis?.[key] || 'Não informado' }}</p>
      </section>
      <section v-if="visit.satellite_reference">
        <h2>Imagem de satélite de referência</h2>
        <p>
          {{ visit.satellite_reference.day?.split('-').reverse().join('/') }} •
          {{ visit.satellite_reference.layer === 'ndvi' ? 'NDVI' : 'Cores naturais (RGB)' }} •
          {{ visit.area_name || 'Talhão vinculado' }}
        </p>
        <p class="visit-report-text">
          {{ visit.satellite_reference.note || 'Sem observação sobre a imagem.' }}
        </p>
        <p>
          Referência: {{ visit.satellite_reference.image_id }}. Dados Copernicus Sentinel. A imagem
          não está incorporada neste relatório e sua visualização depende da permissão de acesso
          vigente.
        </p>
      </section>
      <section v-if="visit.field_observations?.length">
        <h2>Observações por talhão e cultura</h2>
        <section v-for="(item, index) in visit.field_observations" :key="item.id">
          <h3>
            {{ index + 1 }}. {{ item.area_name }} • {{ item.crop_name || 'Cultura não informada' }}
          </h3>
          <p>
            Prioridade: {{ priorities[item.priority] }} • retorno sugerido:
            {{ item.next_visit?.split('-').reverse().join('/') || 'Não informado' }}
          </p>
          <p class="visit-report-text"><strong>Achados:</strong> {{ item.observation }}</p>
          <p class="visit-report-text">
            <strong>Ação recomendada:</strong> {{ item.recommendation || 'Não informada' }}
          </p>
        </section>
      </section>
      <h2>Fotos e observações</h2>
      <p v-if="!photosIncluded">Fotos não incluídas neste compartilhamento.</p>
      <p v-else-if="!photos.length">Nenhuma foto registrada.</p>
      <figure v-for="photo in photos" :key="photo.id">
        <img
          v-if="photo.signed_url"
          :src="photo.signed_url"
          :alt="photo.description || 'Foto da visita'"
        />
        <p v-else>Imagem indisponível neste dispositivo.</p>
        <figcaption>
          {{ photo.description || 'Sem legenda'
          }}{{ photo.offline_pending ? ' — aguardando envio' : '' }}
        </figcaption>
      </figure>
      <footer>Identificador da ficha: {{ visit.id }}. Documento sem assinatura digital.</footer>
    </section>
  </Teleport>
</template>
<style>
.visit-report-root {
  position: fixed;
  inset: 0;
  z-index: 10000;
  overflow: auto;
  background: white;
  color: #17251b;
  padding: 1.5rem;
  font:
    16px/1.5 system-ui,
    sans-serif;
}
.visit-report-root dt {
  font-weight: bold;
}
.visit-report-root dd {
  margin: 0 0 0.7rem;
}
.visit-report-root h2 {
  font-size: 1.1rem;
}
.visit-report-root img {
  max-width: 100%;
  max-height: 22rem;
  object-fit: contain;
}
.visit-report-root figure {
  margin: 1rem 0;
  break-inside: avoid;
}
.visit-report-text,
.visit-report-root dd,
.visit-report-root figcaption {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.visit-report-root footer {
  margin-top: 2rem;
  font-size: 0.8rem;
  overflow-wrap: anywhere;
}
.visit-report-actions {
  position: sticky;
  top: 0;
  background: white;
  padding-bottom: 0.5rem;
}
@media print {
  @page {
    size: A4;
    margin: 15mm;
  }
  body:has(> .visit-report-root) > :not(.visit-report-root) {
    display: none !important;
  }
  body:has(> .visit-report-root),
  html:has(.visit-report-root) {
    overflow: visible !important;
    height: auto !important;
    background: white !important;
  }
  .visit-report-root {
    position: static;
    overflow: visible;
    height: auto;
    padding: 0;
    font-size: 11pt;
  }
  .visit-report-actions {
    display: none;
  }
  .visit-report-root h2 {
    break-after: avoid;
  }
}
</style>
