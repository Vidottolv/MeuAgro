<script setup>
import { computed, ref, watch } from 'vue';
import { helpArticles, helpCategories, helpVersion, searchHelp } from './helpContent.js';
import '../properties/rural.css';
defineProps({ publicMode: { type: Boolean, default: false } });
const topic = new URLSearchParams(location.search).get('topic');
const initial = helpArticles.find((article) => article.id === topic);
const category = ref(initial?.category || 'comecar'),
  query = ref(''),
  limit = ref(12),
  copied = ref('');
const matches = computed(() =>
  searchHelp(query.value, query.value.trim() ? 'all' : category.value),
);
const visible = computed(() => matches.value.slice(0, limit.value));
const counts = (id) => helpArticles.filter((article) => article.category === id).length;
watch([query, category], () => {
  limit.value = 12;
  copied.value = '';
});
function choose(id) {
  category.value = id;
  query.value = '';
}
async function copy(article) {
  try {
    await navigator.clipboard.writeText(
      new URL('/help?topic=' + encodeURIComponent(article.id), location.origin).href,
    );
    copied.value = 'Link do tópico copiado.';
  } catch {
    copied.value =
      'Não foi possível copiar automaticamente. Abra a ajuda pelo endereço /help e busque pelo título do tópico.';
  }
}
</script>
<template>
  <div class="rural-vue help-page" :class="{ 'help-page--public': publicMode }">
    <header class="help-heading">
      <a :href="publicMode ? '/login' : '/more'" data-link class="button button--secondary">{{
        publicMode ? 'Voltar à entrada' : 'Voltar a Mais'
      }}</a>
      <h2>Central de ajuda do MeuAgro</h2>
      <p>
        Encontre o passo a passo das funcionalidades, o que cada informação significa e como
        resolver dúvidas comuns.
      </p>
      <label for="help-search">O que você precisa fazer?</label>
      <div class="help-search">
        <input
          id="help-search"
          v-model="query"
          type="search"
          placeholder="Ex.: NDVI, rascunho, estoque, gerente…"
          autocomplete="off"
        />
        <button v-if="query" type="button" class="button button--secondary" @click="query = ''">
          Limpar busca
        </button>
      </div>
      <p class="help-caption">
        Você pode ler esta ajuda sem conexão depois que a abertura offline estiver preparada. Os
        acessos às funções continuam sujeitos a conexão e permissões.
      </p>
    </header>
    <label class="help-mobile-nav" for="help-topic"
      >Tema da ajuda
      <select id="help-topic" v-model="category" @change="query = ''">
        <option v-for="group in helpCategories" :key="group.id" :value="group.id">
          {{ group.title }} ({{ counts(group.id) }})
        </option>
        <option value="all">Todos os temas ({{ helpArticles.length }})</option>
      </select>
    </label>
    <div class="help-layout">
      <nav class="help-topics" aria-label="Temas da central de ajuda">
        <button
          v-for="group in helpCategories"
          :key="group.id"
          type="button"
          :aria-pressed="!query && category === group.id"
          @click="choose(group.id)"
        >
          <strong>{{ group.title }}</strong
          ><span>{{ counts(group.id) }} tópicos</span>
        </button>
        <button type="button" :aria-pressed="!query && category === 'all'" @click="choose('all')">
          <strong>Todos os temas</strong><span>{{ helpArticles.length }} tópicos</span>
        </button>
      </nav>
      <section class="help-results" aria-labelledby="help-results-title">
        <h3 id="help-results-title">
          {{
            query.trim()
              ? 'Resultados da busca'
              : category === 'all'
                ? 'Todas as funcionalidades'
                : helpCategories.find((group) => group.id === category)?.title
          }}
        </h3>
        <p role="status">{{ matches.length }} tópico(s) encontrado(s). {{ copied }}</p>
        <p v-if="!matches.length">
          Nenhum tópico encontrado. Tente outra palavra, como foto, compra, sincronização ou plano.
        </p>
        <details
          v-for="article in visible"
          :id="'help-' + article.id"
          :key="article.id"
          class="help-article"
          :open="initial?.id === article.id"
        >
          <summary>
            <span>{{ article.title }}</span
            ><small>{{
              article.mode === 'mixed'
                ? 'Parte do fluxo pode funcionar offline'
                : 'A função precisa de conexão'
            }}</small>
          </summary>
          <p>{{ article.summary }}</p>
          <ol>
            <li v-for="step in article.steps" :key="step">{{ step }}</li>
          </ol>
          <aside v-if="article.notes.length" class="help-notes" aria-label="Pontos de atenção">
            <strong>Confira também</strong>
            <ul>
              <li v-for="note in article.notes" :key="note">{{ note }}</li>
            </ul>
          </aside>
          <div class="rural-actions">
            <a :href="article.route" data-link class="button button--secondary"
              >Abrir funcionalidade</a
            >
            <button
              type="button"
              class="button button--secondary"
              :aria-label="'Copiar link: ' + article.title"
              @click="copy(article)"
            >
              Copiar link deste tópico
            </button>
          </div>
        </details>
        <button
          v-if="visible.length < matches.length"
          type="button"
          class="button button--secondary"
          @click="limit += 12"
        >
          Mostrar mais tópicos ({{ visible.length }} de {{ matches.length }})
        </button>
      </section>
    </div>
    <footer class="help-footer">
      <p>
        Manual de uso • revisão {{ helpVersion }}. Recursos podem depender de perfil, plano, versão
        e ativação. Este manual não altera suas permissões nem substitui avaliação técnica.
      </p>
      <p>
        Não encontrou a resposta? Anote a tela, a ação e a mensagem de erro, sem incluir senhas ou
        chaves. Consulte <a href="/more/operations" data-link>Diagnóstico e privacidade</a> ou fale
        com o responsável pelo seu atendimento.
      </p>
    </footer>
  </div>
</template>
<style scoped>
.help-page--public {
  width: min(1160px, 100%);
  margin: auto;
  padding: 1.25rem max(1rem, env(safe-area-inset-right)) 2rem max(1rem, env(safe-area-inset-left));
}
.help-heading {
  margin-bottom: 1.25rem;
}
.help-heading h2 {
  margin: 1rem 0 0.5rem;
}
.help-heading label {
  display: block;
  margin: 1rem 0 0.4rem;
  font-weight: 700;
}
.help-search {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.help-search input {
  min-width: 0;
  flex: 1 1 230px;
}
.help-search input,
.help-mobile-nav select {
  width: 100%;
  min-height: 48px;
  padding: 0.8rem;
  font-size: 16px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
}
.help-mobile-nav {
  display: none;
  font-weight: 700;
  margin-bottom: 1rem;
}
.help-mobile-nav select {
  display: block;
  margin-top: 0.4rem;
}
.help-caption,
.help-footer {
  font-size: 0.9rem;
  color: var(--color-text-soft);
  margin-top: 0.7rem;
}
.help-layout {
  display: grid;
  grid-template-columns: 245px minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}
.help-topics {
  display: grid;
  gap: 0.45rem;
  position: sticky;
  top: 140px;
}
.help-topics button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text);
  background: var(--color-surface);
  text-align: left;
}
.help-topics button[aria-pressed='true'] {
  color: var(--color-primary-900);
  background: var(--color-primary-100);
  border-color: var(--color-primary-600);
}
.help-topics span {
  font-size: 0.75rem;
  white-space: nowrap;
}
.help-results {
  min-width: 0;
}
.help-article {
  margin: 0.75rem 0;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  scroll-margin-top: 140px;
}
.help-article summary {
  cursor: pointer;
  font-weight: 700;
}
.help-article summary small {
  display: block;
  margin: 0.35rem 0 0 1rem;
  font-weight: 400;
  color: var(--color-text-soft);
}
.help-article p,
.help-article ol,
.help-article aside {
  margin: 1rem 0;
}
.help-article li {
  margin: 0.5rem 0;
}
.help-article ol,
.help-article ul {
  padding-left: 1.3rem;
}
.help-notes {
  padding: 0.8rem;
  border-left: 3px solid var(--color-primary-600);
  background: var(--color-surface-soft);
  border-radius: 0 10px 10px 0;
}
.help-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
@media (max-width: 760px) {
  .help-mobile-nav {
    display: block;
  }
  .help-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .help-topics {
    display: none;
  }
  .help-topics button {
    flex-direction: column;
    align-items: start;
  }
}
@media (max-width: 380px) {
  .help-topics {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
