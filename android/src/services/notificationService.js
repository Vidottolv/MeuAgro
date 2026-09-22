import {
  supabase,
} from '../js/supabase.js';

import {
  getCurrentUser,
} from './authService.js';

import {
  getExactAlarmPermission,
  getLocalNotificationPermission,
  getNotificationPlatformLabel,
  isNativeNotificationPlatform,
  registerLocalNotificationListeners,
  requestExactAlarmPermission,
  requestLocalNotificationPermission,
  scheduleTestNotification,
  syncNativeHarvestNotifications,
} from './localNotificationService.js';

const DEFAULT_PREFERENCES = {
  harvest_reminders_enabled: true,
  harvest_reminder_hour: 8,
  harvest_reminder_minute: 0,
  harvest_alert_days_before: 7,
  timezone: 'America/Sao_Paulo',
};

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'O Supabase não foi inicializado.',
    );
  }

  return supabase;
}

function normalizePreferences(
  data,
) {
  return {
    harvest_reminders_enabled:
      Boolean(
        data.harvestRemindersEnabled,
      ),
    harvest_reminder_hour:
      Number(
        data.harvestReminderHour,
      ),
    harvest_reminder_minute:
      Number(
        data.harvestReminderMinute,
      ),
    harvest_alert_days_before:
      Number(
        data.harvestAlertDaysBefore,
      ),
    timezone:
      data.timezone?.trim() ||
      'America/Sao_Paulo',
  };
}

export async function getNotificationPreferences() {
  const client =
    requireSupabase();

  const user =
    await getCurrentUser();

  if (!user) {
    return null;
  }

  let {
    data,
    error,
  } =
    await client
      .from(
        'notification_preferences',
      )
      .select('*')
      .eq(
        'user_id',
        user.id,
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const result =
      await client
        .from(
          'notification_preferences',
        )
        .insert({
          user_id:
            user.id,
          ...DEFAULT_PREFERENCES,
        })
        .select('*')
        .single();

    if (result.error) {
      throw result.error;
    }

    data = result.data;
  }

  return data;
}

export async function updateNotificationPreferences(
  formData,
) {
  const client =
    requireSupabase();

  const user =
    await getCurrentUser();

  if (!user) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.',
    );
  }

  const payload =
    normalizePreferences(
      formData,
    );

  if (
    !Number.isInteger(
      payload.harvest_reminder_hour,
    ) ||
    payload.harvest_reminder_hour <
      0 ||
    payload.harvest_reminder_hour >
      23
  ) {
    throw new Error(
      'Informe uma hora válida.',
    );
  }

  if (
    !Number.isInteger(
      payload.harvest_reminder_minute,
    ) ||
    payload.harvest_reminder_minute <
      0 ||
    payload.harvest_reminder_minute >
      59
  ) {
    throw new Error(
      'Informe minutos válidos.',
    );
  }

  if (
    !Number.isInteger(
      payload.harvest_alert_days_before,
    ) ||
    payload.harvest_alert_days_before <
      0 ||
    payload.harvest_alert_days_before >
      60
  ) {
    throw new Error(
      'Os dias de antecedência devem ficar entre 0 e 60.',
    );
  }

  const {
    data,
    error,
  } =
    await client
      .from(
        'notification_preferences',
      )
      .upsert(
        {
          user_id:
            user.id,
          ...payload,
        },
        {
          onConflict:
            'user_id',
        },
      )
      .select('*')
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function refreshHarvestNotificationQueue(
  horizonDays = 30,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client.rpc(
      'refresh_harvest_notification_queue',
      {
        p_horizon_days:
          horizonDays,
      },
    );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listScheduledHarvestNotifications(
  limit = 20,
) {
  const client =
    requireSupabase();

  const {
    data,
    error,
  } =
    await client
      .from('notifications')
      .select(`
        id,
        production_cycle_id,
        notification_type,
        title,
        body,
        scheduled_for,
        delivered_at,
        read_at,
        cancelled_at,
        metadata,
        created_at
      `)
      .eq(
        'notification_type',
        'harvest_reminder',
      )
      .is(
        'cancelled_at',
        null,
      )
      .gte(
        'scheduled_for',
        new Date()
          .toISOString(),
      )
      .order(
        'scheduled_for',
        {
          ascending: true,
        },
      )
      .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function markNotificationDelivered(
  notificationId,
) {
  if (!notificationId) {
    return;
  }

  const client =
    requireSupabase();

  const {
    error,
  } =
    await client
      .from('notifications')
      .update({
        delivered_at:
          new Date()
            .toISOString(),
      })
      .eq(
        'id',
        notificationId,
      )
      .is(
        'delivered_at',
        null,
      );

  if (error) {
    console.warn(
      'Não foi possível registrar entrega da notificação:',
      error,
    );
  }
}

export async function markNotificationRead(
  notificationId,
) {
  if (!notificationId) {
    return;
  }

  const client =
    requireSupabase();

  const now =
    new Date()
      .toISOString();

  const {
    error,
  } =
    await client
      .from('notifications')
      .update({
        delivered_at: now,
        read_at: now,
      })
      .eq(
        'id',
        notificationId,
      );

  if (error) {
    console.warn(
      'Não foi possível marcar a notificação como lida:',
      error,
    );
  }
}

export async function syncHarvestNotifications({
  horizonDays = 30,
} = {}) {
  const user =
    await getCurrentUser();

  if (!user) {
    return {
      authenticated: false,
      queueCount: 0,
      nativeResult: null,
    };
  }

  const notifications =
    await refreshHarvestNotificationQueue(
      horizonDays,
    );

  const nativeResult =
    await syncNativeHarvestNotifications(
      notifications,
    );

  return {
    authenticated: true,
    queueCount:
      notifications.length,
    nativeResult,
  };
}

export function queueHarvestNotificationSync() {
  window.setTimeout(
    () => {
      void syncHarvestNotifications()
        .catch(
          (error) => {
            console.warn(
              'Não foi possível sincronizar lembretes de colheita:',
              error,
            );
          },
        );
    },
    0,
  );
}

export async function getNotificationRuntimeStatus() {
  return {
    native:
      isNativeNotificationPlatform(),
    platform:
      getNotificationPlatformLabel(),
    permission:
      await getLocalNotificationPermission(),
    exactAlarm:
      await getExactAlarmPermission(),
  };
}

export {
  requestExactAlarmPermission,
  requestLocalNotificationPermission,
  scheduleTestNotification,
};

let runtimeInitialized =
  false;

export async function initializeNotificationRuntime({
  navigate,
} = {}) {
  if (runtimeInitialized) {
    return;
  }

  runtimeInitialized =
    true;

  await registerLocalNotificationListeners({
    onReceived:
      (notification) => {
        const notificationId =
          notification.extra
            ?.notificationDbId;

        void markNotificationDelivered(
          notificationId,
        );
      },

    onAction:
      (action) => {
        const notification =
          action.notification;

        const notificationId =
          notification.extra
            ?.notificationDbId;

        const route =
          notification.extra
            ?.route;

        void markNotificationRead(
          notificationId,
        );

        if (
          route &&
          typeof navigate ===
            'function'
        ) {
          window.setTimeout(
            () => {
              navigate(route);
            },
            0,
          );
        }
      },
  });
}

export async function bootstrapNotificationRuntime({
  navigate,
} = {}) {
  try {
    await initializeNotificationRuntime({
      navigate,
    });

    return await syncHarvestNotifications();
  } catch (error) {
    console.warn(
      'Inicialização das notificações não concluída:',
      error,
    );

    return null;
  }
}
