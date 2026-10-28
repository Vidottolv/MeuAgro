<script setup>
import { useWorkspace } from '../shared/useWorkspace.js';
import { workspaceRpc } from '../../services/workspaceService.js';
const w = useWorkspace(() => workspaceRpc('app_permissions_context'));
const { data, error, loading, busy } = w;
const roles = { owner: 'Responsável', manager: 'Gerente', representative: 'Representante' };
</script>
<template>
  <section class="rural-panel permissions-panel">
    <h3>Meus acessos de empresa</h3>
    <p v-if="error" role="alert">{{ error }}</p>
    <button class="button button--secondary" :disabled="loading || busy" @click="w.load">
      Atualizar meus acessos
    </button>
    <p v-if="loading">Conferindo permissões…</p>
    <template v-if="data">
      <p>
        O acesso vem do vínculo autorizado pela empresa. Escolher um roteiro ou conhecer o endereço
        de uma tela não concede permissão.
      </p>
      <p v-if="!data.companies.length">
        Nenhum vínculo ativo de empresa. Sua atuação pessoal e os compartilhamentos autorizados pelo
        produtor continuam separados.
      </p>
      <article v-for="c in data.companies" :key="c.id" class="rural-card">
        <h4>{{ c.name }} • {{ roles[c.role] }}</h4>
        <p>
          Atuação comercial: {{ c.can_act ? 'habilitada' : 'ative o módulo Consultor para atuar' }}.
        </p>
        <p>
          Gestão de equipe e carteira: {{ c.can_manage ? 'habilitada' : 'sem acesso gerencial' }}.
        </p>
        <p>
          Custos e comissões da equipe:
          {{ c.can_finance ? 'consulta autorizada' : 'sem autorização financeira gerencial' }}.
        </p>
        <a
          v-if="c.can_manage"
          :href="'/consultor/equipe?seller=' + encodeURIComponent(c.id)"
          data-link
          >Abrir equipe</a
        >
      </article>
      <p>
        Representantes continuam consultando somente suas próprias comissões no relatório de vendas.
        Gerentes precisam de autorização financeira do responsável; sem ela, as comissões também
        ficam ocultas no relatório anterior de vendas.
      </p>
      <p>
        Dados agrícolas do produtor exigem compartilhamento técnico explícito. Participar da empresa
        não libera propriedades, estoque ou finanças pessoais do produtor.
      </p>
      <p>
        Verificação: {{ new Date(data.checked_at).toLocaleString('pt-BR') }}. Atualize após uma
        alteração de vínculo. Toda operação no banco verifica o acesso novamente.
      </p>
    </template>
  </section>
</template>
<style scoped>
p,
h4,
a {
  overflow-wrap: anywhere;
}
button {
  max-width: 100%;
  white-space: normal;
}
</style>
