<script setup>
import { onMounted, onScopeDispose, watch, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
const props = defineProps({
  geometry: Object,
  contextGeometry: Object,
  overlay: Object,
  disabled: Boolean,
});
const emit = defineEmits(['change']);
const element = ref(null),
  drawing = ref(false),
  error = ref('');
let map,
  layer,
  referenceLayer,
  tiles,
  imageLayer,
  points = [];
function render(g) {
  layer?.clearLayers();
  if (!g) return;
  if (g.type === 'Point')
    L.circleMarker([g.coordinates[1], g.coordinates[0]], { radius: 7 }).addTo(layer);
  else L.polygon(g.coordinates[0].map((p) => [p[1], p[0]])).addTo(layer);
}
function renderImage(value) {
  if (imageLayer) {
    imageLayer.remove();
    imageLayer = null;
  }
  if (!value?.url || !Array.isArray(value.bounds) || value.bounds.length !== 4 || !map) return;
  const [west, south, east, north] = value.bounds;
  imageLayer = L.imageOverlay(
    value.url,
    [
      [south, west],
      [north, east],
    ],
    { opacity: 0.85, interactive: false },
  ).addTo(map);
}
watch(
  () => props.overlay,
  (value) => renderImage(value),
);
function fit() {
  const bounds = props.geometry ? layer?.getBounds() : referenceLayer?.getBounds();
  if (bounds?.isValid()) map.fitBounds(bounds, { padding: [25, 25], maxZoom: 17, animate: false });
}
watch(
  () => props.geometry,
  (g) => {
    if (map) {
      render(g);
      fit();
    }
  },
  { deep: true },
);
function renderReference(g) {
  referenceLayer?.clearLayers();
  if (!g || !referenceLayer) return;
  if (g.type === 'Point')
    L.circleMarker([g.coordinates[1], g.coordinates[0]], {
      radius: 6,
      color: '#666',
      interactive: false,
    }).addTo(referenceLayer);
  else
    L.polygon(
      g.coordinates[0].map((p) => [p[1], p[0]]),
      { color: '#666', weight: 2, dashArray: '6 5', fillOpacity: 0.04, interactive: false },
    ).addTo(referenceLayer);
}
watch(
  () => props.contextGeometry,
  (g) => {
    if (map) {
      renderReference(g);
      fit();
    }
  },
  { deep: true },
);
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      drawing.value = false;
      points = [];
      render(props.geometry);
    }
  },
);
function begin() {
  points = [];
  drawing.value = true;
  layer.clearLayers();
}
function undo() {
  points.pop();
  render(
    points.length
      ? {
          type: points.length === 1 ? 'Point' : 'Polygon',
          coordinates: points.length === 1 ? points[0] : [points],
        }
      : null,
  );
}
function finish() {
  if (points.length < 3) {
    error.value = 'Marque pelo menos três vértices.';
    return;
  }
  emit('change', { type: 'Polygon', coordinates: [[...points, points[0]]] });
  drawing.value = false;
  error.value = '';
}
function locate() {
  if (!navigator.geolocation) {
    error.value = 'Localização indisponível. Use o centro por coordenadas.';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (p) => {
      if (map) map.setView([p.coords.latitude, p.coords.longitude], 16, { animate: false });
    },
    () => {
      error.value = 'Não foi possível obter a localização. Use coordenadas para centralizar.';
    },
    { timeout: 10000 },
  );
}
onMounted(() => {
  map = L.map(element.value, {
    worldCopyJump: false,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
  }).setView([-15.8, -47.9], 5);
  tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    noWrap: true,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  tiles.on('tileerror', () => {
    error.value = 'Mapa-base indisponível. As coordenadas ainda podem ser informadas manualmente.';
  });
  referenceLayer = L.featureGroup().addTo(map);
  layer = L.featureGroup().addTo(map);
  map.on('click', (e) => {
    if (!drawing.value || props.disabled) return;
    if (points.length >= 200) {
      error.value = 'Limite de 200 vértices.';
      return;
    }
    points.push([Number(e.latlng.lng.toFixed(7)), Number(e.latlng.lat.toFixed(7))]);
    render(
      points.length === 1
        ? { type: 'Point', coordinates: points[0] }
        : { type: 'Polygon', coordinates: [points] },
    );
  });
  renderImage(props.overlay);
  renderReference(props.contextGeometry);
  render(props.geometry);
  fit();
});
onScopeDispose(() => {
  map?.stop();
  map?.remove();
  map = null;
});
</script>
<template>
  <div>
    <p>
      {{
        overlay
          ? 'Imagem de satélite sobre o mapa de referência.'
          : 'Mapa de referência. Imagens consultadas podem ser sobrepostas ao contorno.'
      }}
      Arraste para navegar e use o zoom. Para desenhar, toque nos vértices e finalize pelo botão.
    </p>
    <div ref="element" class="boundary-map" aria-label="Mapa para delimitar o contorno" />
    <button type="button" class="button button--secondary" :disabled="disabled" @click="locate">
      Ir para minha localização
    </button>
    <button type="button" class="button button--secondary" :disabled="disabled" @click="begin">
      Iniciar novo desenho
    </button>
    <template v-if="drawing"
      ><button type="button" class="button button--secondary" @click="undo">
        Desfazer último vértice</button
      ><button type="button" class="button button--primary" @click="finish">
        Finalizar desenho</button
      ><button
        type="button"
        class="button button--secondary"
        @click="
          drawing = false;
          render(geometry);
        "
      >
        Cancelar desenho
      </button></template
    >
    <p v-if="error" role="status">{{ error }}</p>
  </div>
</template>
<style scoped>
.boundary-map {
  height: 380px;
  max-height: 60vh;
  width: 100%;
  z-index: 0;
  border-radius: 0.75rem;
}
.button {
  margin: 0.25rem;
}
</style>
