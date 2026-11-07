<script setup>
import { onMounted } from 'vue';
import { usePwa } from './usePwa.js';
const { status, pwa } = usePwa();
const mb = (value) =>
  value == null
    ? 'Não informado'
    : (value / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB';
onMounted(() => {
  if (!status.value.native) void pwa.refreshStorage();
});
</script>
<template>
  <section v-if="!status.native" id="pwa" class="rural-panel">
    <h3>MeuAgro na tela inicial</h3>
    <details>
      <summary>Instalação e acesso</summary>
      <p v-if="status.installed">
        O MeuAgro foi adicionado ao dispositivo. Abra-o pelo ícone da tela inicial.
      </p>
      <template v-else>
        <p>Instale para abrir o MeuAgro pelo ícone, em uma janela própria.</p>
        <ol v-if="status.ios">
          <li>Abra este mesmo endereço no Safari do iPhone ou iPad.</li>
          <li>Toque em Compartilhar e depois em Adicionar à Tela de Início.</li>
          <li>Se aparecer Abrir como App da Web, mantenha ativado. Toque em Adicionar.</li>
          <li>
            Abra pelo novo ícone e entre na sua conta. Prepare os dados de campo nesse aplicativo.
          </li>
        </ol>
        <button
          v-if="status.installAvailable"
          type="button"
          class="button button--primary"
          :disabled="status.busy"
          @click="pwa.install()"
        >
          Instalar MeuAgro
        </button>
        <p v-else-if="!status.ios">
          No menu do navegador, procure Instalar aplicativo ou Adicionar à tela inicial. A opção
          varia conforme o navegador.
        </p>
      </template>
      <p>
        Safari e aplicativo instalado podem ter sessões e dados locais separados. Sincronize as
        pendências no local onde foram criadas antes de trocar de acesso.
      </p>
    </details>
    <h4>Abertura e atualizações</h4>
    <p v-if="status.worker === 'ready'">
      Abertura do aplicativo preparada neste navegador. Para usar seus registros offline, prepare
      também os dados de campo abaixo.
    </p>
    <p v-else-if="status.worker === 'preparing'">
      Preparando a abertura offline. Mantenha a conexão enquanto o aplicativo é baixado.
    </p>
    <p v-else>
      O preparo offline depende de um endereço HTTPS, navegador compatível, conexão e espaço livre.
    </p>
    <p v-if="status.updateReady" role="status">
      <strong>Nova versão pronta.</strong> Salve suas edições, feche todas as abas e janelas do
      MeuAgro, incluindo o app instalado, e abra novamente. Não é necessário remover o aplicativo ou
      limpar dados.
    </p>
    <button
      type="button"
      class="button button--secondary"
      :disabled="status.busy || !status.online || status.worker === 'unavailable'"
      @click="pwa.checkUpdate()"
    >
      Verificar atualizações
    </button>
    <details>
      <summary>Dados neste dispositivo e recursos offline</summary>
      <p v-if="status.storage">
        Espaço usado neste endereço: {{ mb(status.storage.usage) }}. Limite estimado pelo navegador:
        {{ mb(status.storage.quota) }}.
      </p>
      <button
        v-if="status.storage?.canRequest && !status.storage.persistent"
        type="button"
        class="button button--secondary"
        @click="pwa.protectStorage()"
      >
        Solicitar proteção do armazenamento
      </button>
      <p>
        O sistema pode remover dados locais por falta de espaço, limpeza do navegador ou remoção do
        app. Sincronize os registros e guarde uma cópia de recuperação das pendências quando
        necessário. Proteção adicional não é um backup.
      </p>
      <p>
        Fotos e registros de campo preparados podem ser usados offline. IA, novas imagens de
        satélite, comércio e financeiro precisam de conexão. O envio das pendências acontece com o
        MeuAgro aberto.
      </p>
      <p>
        Lembretes do aparelho e alertas de compras com o aplicativo fechado ainda não estão
        implementados no PWA. Consulte a central de avisos dentro do MeuAgro.
      </p>
    </details>
    <p v-if="status.message" role="status">{{ status.message }}</p>
    <p v-if="status.error" role="alert">{{ status.error }}</p>
  </section>
</template>
<style scoped>
details {
  margin: 1rem 0;
}
summary {
  cursor: pointer;
  font-weight: 700;
  padding: 0.5rem 0;
}
details p,
details ol {
  margin-top: 0.65rem;
}
</style>
