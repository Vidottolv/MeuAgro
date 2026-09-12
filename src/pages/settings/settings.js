import {
  appShell,
} from '../../components/appShell.js';

import {
  icon,
} from '../../components/icons.js';

import {
  setButtonLoading,
  setFormMessage,
} from '../../components/formHelpers.js';

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

import {
  escapeHtml,
  formatDateTimePtBr,
} from '../../js/html.js';

import {
  showToast,
} from '../../components/toast.js';

import {
  getDataErrorMessage,
} from '../../services/dataErrorService.js';

import {
  THEME_OPTIONS,
  getCurrentTheme,
  setTheme,
} from '../../services/themeService.js';

const refreshCurrentRoute =
  () => {
    window.dispatchEvent(
      new PopStateEvent(
        'popstate',
      ),
    );
  };

function pad2(value) {
  return String(value)
    .padStart(2, '0');
}

function preferenceTime(
  preferences,
) {
  return `${pad2(
    preferences.harvest_reminder_hour,
  )}:${pad2(
    preferences.harvest_reminder_minute,
  )}`;
}

function permissionLabel(
  status,
) {
  switch (status) {
    case 'granted':
      return 'Permitida';

    case 'denied':
      return 'Negada';

    case 'prompt':
    case 'prompt-with-rationale':
      return 'Aguardando permissão';

    case 'web':
      return 'Disponível no Android';

    default:
      return 'Não verificada';
  }
}

function exactAlarmLabel(
  status,
) {
  switch (status) {
    case 'granted':
      return 'Horário exato permitido';

    case 'denied':
      return 'Horário aproximado';

    case 'prompt':
    case 'prompt-with-rationale':
      return 'Pode ser ativado';

    case 'not_applicable':
      return 'Não se aplica';

    default:
      return 'Não verificado';
  }
}

function scheduledReminderItem(
  notification,
) {
  return `
    <a
      href="${
        notification.metadata
          ?.route ||
        `/plantings/${notification.production_cycle_id}`
      }"
      class="notification-preview"
      data-link
    >
      <span class="notification-preview__icon">
        ${icon('bell')}
      </span>

      <span class="notification-preview__content">
        <strong>
          ${escapeHtml(
            notification.title,
          )}
        </strong>

        <span>
          ${escapeHtml(
            notification.body,
          )}
        </span>

        <small>
          ${formatDateTimePtBr(
            notification.scheduled_for,
          )}
        </small>
      </span>

      ${icon('chevronRight')}
    </a>
  `;
}

export async function renderSettingsPage({
  session,
}) {
  const app =
    document.querySelector(
      '#app',
    );

  let preferences;
  let runtime;
  let scheduled = [];

  try {
    [
      preferences,
      runtime,
    ] =
      await Promise.all([
        getNotificationPreferences(),
        getNotificationRuntimeStatus(),
      ]);

    // Atualiza a fila antes de mostrar as próximas notificações.
    await syncHarvestNotifications();

    scheduled =
      await listScheduledHarvestNotifications(
        12,
      );
  } catch (error) {
    console.error(
      'Erro ao carregar configurações:',
      error,
    );

    preferences = {
      harvest_reminders_enabled:
        true,
      harvest_reminder_hour:
        8,
      harvest_reminder_minute:
        0,
      harvest_alert_days_before:
        7,
      timezone:
        'America/Sao_Paulo',
    };

    runtime = {
      native: false,
      platform: 'Navegador',
      permission: 'web',
      exactAlarm:
        'not_applicable',
    };
  }

  const browserTimezone =
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone ||
    'America/Sao_Paulo';


  const currentTheme =
    getCurrentTheme();

  app.innerHTML =
    appShell({
      session,
      title: 'Configurações',
      eyebrow: 'Meu Agro',
      activeNav: 'more',
      content: `
        <section class="page-heading">
          <div>
            <p class="section-eyebrow">
              Configurações
            </p>

            <h2>
              Aparência e preferências
            </h2>

            <p>
              Escolha o tema do aplicativo e configure os lembretes de colheita.
            </p>
          </div>
        </section>

        <section class="appearance-card">
          <div class="appearance-card__header">
            <p class="section-eyebrow">
              Aparência
            </p>

            <h2>
              Tema do aplicativo
            </h2>

            <p>
              Escolha entre o visual claro padrão e o tema escuro. A preferência fica salva neste dispositivo.
            </p>
          </div>

          <div
            class="appearance-options"
            role="radiogroup"
            aria-label="Tema do aplicativo"
          >
            ${THEME_OPTIONS
              .map(
                (option) => `
                  <label class="appearance-option">
                    <input
                      type="radio"
                      name="appearanceTheme"
                      value="${option.value}"
                      ${
                        option.value ===
                        currentTheme
                          ? 'checked'
                          : ''
                      }
                    />

                    <span class="appearance-option__content">
                      <span
                        class="
                          appearance-option__preview
                          appearance-option__preview--${option.value}
                        "
                      >
                        ${icon(
                          option.iconName,
                        )}
                      </span>

                      <span class="appearance-option__text">
                        <strong>
                          ${escapeHtml(
                            option.label,
                          )}
                        </strong>

                        <span>
                          ${escapeHtml(
                            option.description,
                          )}
                        </span>
                      </span>
                    </span>
                  </label>
                `,
              )
              .join('')}
          </div>
        </section>

        <div
          id="settings-feedback"
          class="form-message"
          hidden
        ></div>

        <form
          id="notification-settings-form"
          class="property-form"
          novalidate
        >
          <section class="form-card">
            <div class="settings-toggle-row">
              <div>
                <h2>
                  Lembretes de colheita
                </h2>

                <p>
                  Durante a janela de colheita, o aplicativo agenda um aviso diário até o ciclo ser colhido, encerrado ou cancelado.
                </p>
              </div>

              <label class="switch-control">
                <input
                  id="harvest-reminders-enabled"
                  name="harvestRemindersEnabled"
                  type="checkbox"
                  ${
                    preferences
                      .harvest_reminders_enabled
                      ? 'checked'
                      : ''
                  }
                />

                <span
                  class="switch-control__track"
                  aria-hidden="true"
                ></span>
              </label>
            </div>
          </section>

          <section class="form-card">
            <div class="form-section-title">
              <h2>
                Quando avisar
              </h2>

              <p>
                O padrão do Meu Agro é iniciar os lembretes 7 dias antes da previsão, às 08:00.
              </p>
            </div>

            <div class="form-grid form-grid--two">
              <div class="field">
                <label
                  for="harvest-reminder-time"
                >
                  Horário diário
                </label>

                <input
                  id="harvest-reminder-time"
                  name="harvestReminderTime"
                  type="time"
                  value="${preferenceTime(
                    preferences,
                  )}"
                  required
                />
              </div>

              <div class="field">
                <label
                  for="harvest-alert-days"
                >
                  Antecedência
                </label>

                <div class="field-with-suffix">
                  <input
                    id="harvest-alert-days"
                    name="harvestAlertDaysBefore"
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    value="${
                      preferences
                        .harvest_alert_days_before
                    }"
                    required
                  />

                  <span>
                    dias
                  </span>
                </div>
              </div>
            </div>

            <div class="field">
              <label
                for="notification-timezone"
              >
                Fuso horário
              </label>

              <input
                id="notification-timezone"
                name="timezone"
                type="text"
                value="${escapeHtml(
                  preferences.timezone ||
                  browserTimezone,
                )}"
                list="timezone-suggestions"
                required
              />

              <datalist
                id="timezone-suggestions"
              >
                <option
                  value="${escapeHtml(
                    browserTimezone,
                  )}"
                ></option>
                <option
                  value="America/Sao_Paulo"
                ></option>
              </datalist>

              <small class="field__hint">
                Fuso detectado neste dispositivo:
                ${escapeHtml(
                  browserTimezone,
                )}.
              </small>
            </div>
          </section>

          <div class="property-form-actions">
            <button
              id="settings-save"
              class="button button--primary"
              type="submit"
            >
              Salvar e sincronizar
            </button>
          </div>
        </form>

        <section class="notification-runtime-card">
          <div class="notification-runtime-card__header">
            <div>
              <p class="section-eyebrow">
                Etapa 20
              </p>

              <h2>
                Notificações Android
              </h2>
            </div>

            <span class="notification-platform-badge">
              ${escapeHtml(
                runtime.platform,
              )}
            </span>
          </div>

          <div class="notification-runtime-grid">
            <div>
              <span>
                Permissão
              </span>

              <strong
                id="notification-permission-label"
              >
                ${permissionLabel(
                  runtime.permission,
                )}
              </strong>
            </div>

            <div>
              <span>
                Horário
              </span>

              <strong
                id="exact-alarm-label"
              >
                ${exactAlarmLabel(
                  runtime.exactAlarm,
                )}
              </strong>
            </div>
          </div>

          ${
            runtime.native
              ? `
                <div class="notification-runtime-actions">
                  <button
                    id="request-notification-permission"
                    class="button button--secondary"
                    type="button"
                  >
                    ${icon('bell')}
                    Permitir notificações
                  </button>

                  <button
                    id="request-exact-alarm"
                    class="button button--secondary"
                    type="button"
                  >
                    ${icon('clock')}
                    Ativar horário exato
                  </button>

                  <button
                    id="test-notification"
                    class="button button--secondary"
                    type="button"
                  >
                    ${icon('bell')}
                    Enviar teste
                  </button>

                  <button
                    id="sync-notifications"
                    class="button button--ghost"
                    type="button"
                  >
                    ${icon('refresh')}
                    Sincronizar
                  </button>
                </div>
              `
              : `
                <div class="notification-browser-note">
                  ${icon('info')}

                  <div>
                    <strong>
                      Modo navegador
                    </strong>

                    <p>
                      A fila e as preferências já podem ser testadas aqui. O disparo nativo será executado quando este mesmo projeto estiver rodando no contêiner Android do Capacitor, que será criado na Etapa 24.
                    </p>
                  </div>
                </div>
              `
          }
        </section>

        <section class="scheduled-notifications-card">
          <div class="scheduled-notifications-card__header">
            <div>
              <p class="section-eyebrow">
                Próximos lembretes
              </p>

              <h2>
                Fila de colheita
              </h2>
            </div>

            <span>
              ${scheduled.length}
            </span>
          </div>

          ${
            scheduled.length
              ? `
                <div class="notification-preview-list">
                  ${scheduled
                    .map(
                      scheduledReminderItem,
                    )
                    .join('')}
                </div>
              `
              : `
                <div class="settings-empty-state">
                  ${icon('bell')}

                  <p>
                    Nenhum lembrete está agendado neste momento.
                  </p>
                </div>
              `
          }
        </section>
      `,
    });

  const form =
    document.querySelector(
      '#notification-settings-form',
    );

  const feedback =
    document.querySelector(
      '#settings-feedback',
    );

  const saveButton =
    document.querySelector(
      '#settings-save',
    );

  const permissionButton =
    document.querySelector(
      '#request-notification-permission',
    );

  const exactButton =
    document.querySelector(
      '#request-exact-alarm',
    );

  const testButton =
    document.querySelector(
      '#test-notification',
    );

  const syncButton =
    document.querySelector(
      '#sync-notifications',
    );


  const themeInputs =
    [
      ...document.querySelectorAll(
        'input[name="appearanceTheme"]',
      ),
    ];

  const handleThemeChange =
    (event) => {
      const input =
        event.currentTarget;

      if (!input.checked) {
        return;
      }

      const theme =
        setTheme(
          input.value,
        );

      showToast(
        theme === 'dark'
          ? 'Tema escuro ativado.'
          : 'Tema claro ativado.',
        {
          type: 'success',
        },
      );
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setFormMessage(
        feedback,
        '',
      );

      const formData =
        new FormData(form);

      const time =
        String(
          formData.get(
            'harvestReminderTime',
          ) || '08:00',
        );

      const [
        hour,
        minute,
      ] =
        time
          .split(':')
          .map(Number);

      const data = {
        harvestRemindersEnabled:
          form.querySelector(
            '#harvest-reminders-enabled',
          ).checked,
        harvestReminderHour:
          hour,
        harvestReminderMinute:
          minute,
        harvestAlertDaysBefore:
          Number(
            formData.get(
              'harvestAlertDaysBefore',
            ),
          ),
        timezone:
          String(
            formData.get(
              'timezone',
            ) ||
            browserTimezone,
          ).trim(),
      };

      setButtonLoading(
        saveButton,
        true,
        'Sincronizando…',
      );

      try {
        await updateNotificationPreferences(
          data,
        );

        const result =
          await syncHarvestNotifications();

        showToast(
          result.nativeResult
            ?.native
            ? `${result.queueCount} lembretes sincronizados com o dispositivo.`
            : `${result.queueCount} lembretes preparados na fila.`,
          {
            type: 'success',
          },
        );

        refreshCurrentRoute();
      } catch (error) {
        console.error(
          'Erro ao salvar preferências:',
          error,
        );

        setFormMessage(
          feedback,
          getDataErrorMessage(
            error,
          ),
        );
      } finally {
        setButtonLoading(
          saveButton,
          false,
        );
      }
    };

  const handlePermission =
    async () => {
      try {
        const result =
          await requestLocalNotificationPermission();

        showToast(
          result.display ===
            'granted'
            ? 'Permissão de notificações concedida.'
            : 'A permissão de notificações não foi concedida.',
          {
            type:
              result.display ===
                'granted'
                ? 'success'
                : 'error',
          },
        );

        await syncHarvestNotifications();

        refreshCurrentRoute();
      } catch (error) {
        showToast(
          getDataErrorMessage(
            error,
          ),
          {
            type: 'error',
          },
        );
      }
    };

  const handleExact =
    async () => {
      try {
        await requestExactAlarmPermission();

        showToast(
          'Configuração de horário exato atualizada. O aplicativo pode reiniciar ao alterar essa permissão.',
        );

        window.setTimeout(
          () => {
            refreshCurrentRoute();
          },
          700,
        );
      } catch (error) {
        showToast(
          getDataErrorMessage(
            error,
          ),
          {
            type: 'error',
          },
        );
      }
    };

  const handleTest =
    async () => {
      try {
        await scheduleTestNotification();

        showToast(
          'Notificação de teste agendada para daqui a alguns segundos.',
          {
            type: 'success',
          },
        );
      } catch (error) {
        showToast(
          getDataErrorMessage(
            error,
          ),
          {
            type: 'error',
          },
        );
      }
    };

  const handleSync =
    async () => {
      try {
        const result =
          await syncHarvestNotifications();

        showToast(
          `${result.queueCount} lembretes sincronizados.`,
          {
            type: 'success',
          },
        );
      } catch (error) {
        showToast(
          getDataErrorMessage(
            error,
          ),
          {
            type: 'error',
          },
        );
      }
    };

  themeInputs.forEach(
    (input) => {
      input.addEventListener(
        'change',
        handleThemeChange,
      );
    },
  );

  form.addEventListener(
    'submit',
    handleSubmit,
  );

  permissionButton?.addEventListener(
    'click',
    handlePermission,
  );

  exactButton?.addEventListener(
    'click',
    handleExact,
  );

  testButton?.addEventListener(
    'click',
    handleTest,
  );

  syncButton?.addEventListener(
    'click',
    handleSync,
  );

  return () => {
    themeInputs.forEach(
      (input) => {
        input.removeEventListener(
          'change',
          handleThemeChange,
        );
      },
    );

    form.removeEventListener(
      'submit',
      handleSubmit,
    );

    permissionButton?.removeEventListener(
      'click',
      handlePermission,
    );

    exactButton?.removeEventListener(
      'click',
      handleExact,
    );

    testButton?.removeEventListener(
      'click',
      handleTest,
    );

    syncButton?.removeEventListener(
      'click',
      handleSync,
    );
  };
}
