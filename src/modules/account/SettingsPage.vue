<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useResource } from '../inventory/shared/useResource';
import { useMutation } from '../production/useMutation';
import RequestState from '../properties/components/RequestState.vue';
import {
  getNotificationPreferences,
  getNotificationRuntimeStatus,
  listScheduledHarvestNotifications,
  requestExactAlarmPermission,
  requestLocalNotificationPermission,
  scheduleTestNotification,
  syncHarvestNotifications,
  updateNotificationPreferences,
} from '../../services/notificationService.js';
import { THEME_OPTIONS, getCurrentTheme, setTheme } from '../../services/themeService.js';
const theme = ref(getCurrentTheme()),
  message = ref('');
const preferences = useResource(getNotificationPreferences, null),
  runtime = useResource(getNotificationRuntimeStatus, null),
  scheduled = useResource(() => listScheduledHarvestNotifications(), []);
const f = reactive({ enabled: true, time: '08:00', days: '7', timezone: 'America/Sao_Paulo' });
watch(preferences.data, (p) => {
  if (p)
    Object.assign(f, {
      enabled: p.harvest_reminders_enabled,
      time:
        String(p.harvest_reminder_hour).padStart(2, '0') +
        ':' +
        String(p.harvest_reminder_minute).padStart(2, '0'),
      days: String(p.harvest_alert_days_before),
      timezone: p.timezone,
    });
});
const mutation = useMutation(false),
  action = useMutation(false);
const permission = (s: string) =>
  ({
    granted: 'Permitida',
    denied: 'Negada',
    prompt: 'Aguardando permissão',
    'prompt-with-rationale': 'Aguardando permissão',
    web: 'Disponível no Android',
  })[s] || 'Não verificada';
function sync() {
  message.value = '';
  void action.run(
    () => syncHarvestNotifications(),
    (r) => {
      message.value = `${r.queueCount} lembretes preparados.`;
      void scheduled.reload();
      void runtime.reload();
    },
  );
}
function save() {
  if (
    action.busy.value ||
    preferences.loading.value ||
    preferences.error.value ||
    !preferences.data.value
  )
    return;
  mutation.error.value = '';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.time)) {
    mutation.error.value = 'Informe um horário válido.';
    return;
  }
  if (!/^\d+$/.test(f.days) || Number(f.days) > 60) {
    mutation.error.value = 'Informe de 0 a 60 dias de antecedência.';
    return;
  }
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: f.timezone.trim() }).format();
  } catch {
    mutation.error.value = 'Informe um fuso horário válido.';
    return;
  }
  const [hour, minute] = f.time.split(':').map(Number);
  void mutation.run(
    () =>
      updateNotificationPreferences({
        harvestRemindersEnabled: f.enabled,
        harvestReminderHour: hour,
        harvestReminderMinute: minute,
        harvestAlertDaysBefore: Number(f.days),
        timezone: f.timezone,
      }),
    () => {
      message.value = 'Preferências salvas.';
      void action.run(
        () => syncHarvestNotifications(),
        (r) => {
          message.value = `Preferências salvas. ${r.queueCount} lembretes preparados.`;
          void scheduled.reload();
          void runtime.reload();
        },
      );
    },
  );
}
function run(kind: 'permission' | 'exact' | 'test') {
  message.value = '';
  const work = async () => {
    if (kind === 'permission') await requestLocalNotificationPermission();
    else if (kind === 'exact') await requestExactAlarmPermission();
    else await scheduleTestNotification();
  };
  void action.run(work, () => {
    message.value =
      kind === 'test'
        ? 'Notificação de teste agendada.'
        : 'Solicitação concluída. Confira a permissão abaixo.';
    void runtime.reload();
  });
}
</script>
<template>
  <div class="rural-vue">
    <h2>Configurações</h2>
    <section class="rural-panel">
      <h3>Aparência</h3>
      <div class="rural-actions">
        <button
          v-for="t in THEME_OPTIONS"
          :key="t.value"
          class="button button--secondary"
          :aria-pressed="theme === t.value"
          @click="theme = setTheme(t.value)"
        >
          {{ t.label }}
        </button>
      </div>
    </section>
    <RequestState
      :loading="preferences.loading.value"
      :error="preferences.error.value"
      @retry="preferences.reload"
      ><form v-if="preferences.data.value" class="rural-panel" novalidate @submit.prevent="save">
        <h3>Lembretes de colheita</h3>
        <fieldset :disabled="mutation.busy.value || action.busy.value">
          <label
            ><input v-model="f.enabled" type="checkbox" style="width: auto" /> Ativar lembretes de
            colheita</label
          >
          <div class="rural-grid">
            <div class="field">
              <label for="settings-time">Horário diário</label
              ><input id="settings-time" v-model="f.time" type="time" />
            </div>
            <div class="field">
              <label for="settings-days">Dias de antecedência (0 a 60)</label
              ><input id="settings-days" v-model="f.days" inputmode="numeric" />
            </div>
          </div>
          <div class="field">
            <label for="settings-timezone">Fuso horário</label
            ><input id="settings-timezone" v-model="f.timezone" placeholder="America/Sao_Paulo" />
          </div>
          <button class="button button--primary">
            {{ mutation.busy.value ? 'Salvando…' : 'Salvar e sincronizar' }}
          </button>
        </fieldset>
        <p v-if="mutation.error.value" role="alert">{{ mutation.error.value }}</p>
      </form>
      <p v-else>Sessão indisponível. Entre novamente para configurar lembretes.</p></RequestState
    >
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="action.error.value" role="alert">
      {{ action.error.value }} Você pode tentar sincronizar novamente sem salvar as preferências.
    </p>
    <section class="rural-panel">
      <h3>Notificações neste dispositivo</h3>
      <RequestState
        :loading="runtime.loading.value"
        :error="runtime.error.value"
        @retry="runtime.reload"
        ><template v-if="runtime.data.value"
          ><p>
            {{ runtime.data.value.platform }} • {{ permission(runtime.data.value.permission) }}
          </p>
          <p>Horário exato: {{ permission(runtime.data.value.exactAlarm) }}</p>
          <div v-if="runtime.data.value.native" class="rural-actions">
            <button
              class="button button--secondary"
              :disabled="action.busy.value || mutation.busy.value"
              @click="run('permission')"
            >
              Permitir notificações</button
            ><button
              class="button button--secondary"
              :disabled="action.busy.value || mutation.busy.value"
              @click="run('exact')"
            >
              Permitir horário exato</button
            ><button
              class="button button--secondary"
              :disabled="action.busy.value || mutation.busy.value"
              @click="run('test')"
            >
              Enviar teste
            </button>
          </div></template
        ></RequestState
      ><button
        class="button button--secondary"
        :disabled="action.busy.value || mutation.busy.value"
        @click="sync"
      >
        Sincronizar lembretes</button
      ><a href="/notificacoes/compras" data-link class="button button--secondary"
        >Configurar avisos de compras</a
      >
    </section>
    <section class="rural-panel">
      <h3>Próximos lembretes</h3>
      <RequestState
        :loading="scheduled.loading.value"
        :error="scheduled.error.value"
        @retry="scheduled.reload"
        ><p v-if="!scheduled.data.value.length">Nenhum lembrete agendado.</p>
        <article v-for="n in scheduled.data.value" :key="n.id" class="rural-card">
          <h4>{{ n.title }}</h4>
          <p>{{ n.body }}</p>
          <p>{{ new Date(n.scheduled_for).toLocaleString('pt-BR') }}</p>
        </article></RequestState
      >
    </section>
  </div>
</template>
