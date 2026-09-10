import {
  Capacitor,
} from '@capacitor/core';

import {
  LocalNotifications,
} from '@capacitor/local-notifications';

const HARVEST_CHANNEL_ID =
  'harvest-reminders';


const NOTIFICATION_SMALL_ICON =
  'ic_stat_meu_agro';

const NOTIFICATION_ICON_COLOR =
  '#39705F';

function isAndroid() {
  return (
    Capacitor.getPlatform() ===
    'android'
  );
}

export function isNativeNotificationPlatform() {
  return Capacitor.isNativePlatform();
}

export function getNotificationPlatformLabel() {
  if (
    !isNativeNotificationPlatform()
  ) {
    return 'Navegador';
  }

  return isAndroid()
    ? 'Android'
    : Capacitor.getPlatform();
}

export function nativeNotificationId(
  value,
) {
  const text =
    String(value || '');

  let hash =
    2166136261;

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    hash ^=
      text.charCodeAt(index);

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  // Android exige int32; mantemos IDs positivos e diferentes de zero.
  return (
    (hash >>> 0) %
      2147483646
  ) + 1;
}

export async function getLocalNotificationPermission() {
  if (
    !isNativeNotificationPlatform()
  ) {
    return 'web';
  }

  const result =
    await LocalNotifications
      .checkPermissions();

  return result.display;
}

export async function requestLocalNotificationPermission() {
  if (
    !isNativeNotificationPlatform()
  ) {
    return {
      display: 'web',
    };
  }

  return LocalNotifications
    .requestPermissions();
}

export async function getExactAlarmPermission() {
  if (
    !isNativeNotificationPlatform() ||
    !isAndroid()
  ) {
    return 'not_applicable';
  }

  try {
    const result =
      await LocalNotifications
        .checkExactNotificationSetting();

    return result.exact_alarm;
  } catch (error) {
    console.warn(
      'Não foi possível consultar alarmes exatos:',
      error,
    );

    return 'unknown';
  }
}

export async function requestExactAlarmPermission() {
  if (
    !isNativeNotificationPlatform() ||
    !isAndroid()
  ) {
    return {
      exact_alarm:
        'not_applicable',
    };
  }

  return LocalNotifications
    .changeExactNotificationSetting();
}

async function ensureHarvestChannel() {
  if (
    !isNativeNotificationPlatform() ||
    !isAndroid()
  ) {
    return;
  }

  await LocalNotifications
    .createChannel({
      id:
        HARVEST_CHANNEL_ID,
      name:
        'Lembretes de colheita',
      description:
        'Avisos diários sobre ciclos próximos da colheita.',
      importance: 4,
      visibility: 1,
      vibration: true,
    });
}

function isMeuAgroHarvestNotification(
  notification,
) {
  return (
    notification?.extra
      ?.meuAgroType ===
    'harvest_reminder'
  );
}

export async function syncNativeHarvestNotifications(
  notifications,
) {
  if (
    !isNativeNotificationPlatform()
  ) {
    return {
      native: false,
      scheduled:
        notifications.length,
      permission: 'web',
      exactAlarm:
        'not_applicable',
      warning: null,
    };
  }

  const permission =
    await getLocalNotificationPermission();

  if (
    permission !== 'granted'
  ) {
    return {
      native: true,
      scheduled: 0,
      permission,
      exactAlarm:
        await getExactAlarmPermission(),
      warning:
        'Permissão de notificações ainda não concedida.',
    };
  }

  await ensureHarvestChannel();

  const exactAlarm =
    await getExactAlarmPermission();

  const pending =
    await LocalNotifications
      .getPending();

  const harvestPending =
    pending.notifications.filter(
      isMeuAgroHarvestNotification,
    );

  if (harvestPending.length) {
    await LocalNotifications.cancel({
      notifications:
        harvestPending.map(
          (item) => ({
            id: item.id,
          }),
        ),
    });
  }

  if (!notifications.length) {
    return {
      native: true,
      scheduled: 0,
      permission,
      exactAlarm,
      warning: null,
    };
  }

  const scheduleItems =
    notifications
      .map(
        (notification) => ({
          title:
            notification.title,
          body:
            notification.body,
          id:
            nativeNotificationId(
              notification.id,
            ),
          schedule: {
            at:
              new Date(
                notification.scheduled_for,
              ),
            allowWhileIdle: true,
          },
          smallIcon:
            NOTIFICATION_SMALL_ICON,
          iconColor:
            NOTIFICATION_ICON_COLOR,
          channelId:
            HARVEST_CHANNEL_ID,
          autoCancel: true,
          foreground: true,
          isExactNotification:
            exactAlarm ===
            'granted',
          isExactMandatory: false,
          extra: {
            meuAgroType:
              'harvest_reminder',
            notificationDbId:
              notification.id,
            route:
              notification.metadata
                ?.route ||
              (
                notification
                  .production_cycle_id
                  ? `/plantings/${notification.production_cycle_id}`
                  : '/more/harvest-forecast'
              ),
          },
        }),
      )
      .filter(
        (item) =>
          item.schedule.at >
          new Date(),
      );

  if (!scheduleItems.length) {
    return {
      native: true,
      scheduled: 0,
      permission,
      exactAlarm,
      warning: null,
    };
  }

  const result =
    await LocalNotifications.schedule({
      notifications:
        scheduleItems,
    });

  return {
    native: true,
    scheduled:
      result.notifications
        ?.length ??
      scheduleItems.length,
    permission,
    exactAlarm,
    warning:
      result.warning || null,
  };
}

export async function scheduleTestNotification() {
  if (
    !isNativeNotificationPlatform()
  ) {
    throw new Error(
      'O teste nativo estará disponível quando o projeto estiver executando dentro do aplicativo Android.',
    );
  }

  const permission =
    await requestLocalNotificationPermission();

  if (
    permission.display !==
    'granted'
  ) {
    throw new Error(
      'A permissão de notificações não foi concedida.',
    );
  }

  await ensureHarvestChannel();

  const exactAlarm =
    await getExactAlarmPermission();

  return LocalNotifications.schedule({
    notifications: [
      {
        id:
          nativeNotificationId(
            `test-${Date.now()}`,
          ),
        title:
          'Meu Agro',
        body:
          'As notificações de colheita estão funcionando.',
        schedule: {
          at:
            new Date(
              Date.now() +
              3000,
            ),
          allowWhileIdle: true,
        },
        smallIcon:
          NOTIFICATION_SMALL_ICON,
        iconColor:
          NOTIFICATION_ICON_COLOR,
        channelId:
          HARVEST_CHANNEL_ID,
        autoCancel: true,
        foreground: true,
        isExactNotification:
          exactAlarm ===
          'granted',
        isExactMandatory: false,
        extra: {
          meuAgroType:
            'test',
          route:
            '/more/settings',
        },
      },
    ],
  });
}

export async function registerLocalNotificationListeners({
  onReceived,
  onAction,
}) {
  if (
    !isNativeNotificationPlatform()
  ) {
    return [];
  }

  const handles = [];

  handles.push(
    await LocalNotifications.addListener(
      'localNotificationReceived',
      (notification) => {
        onReceived?.(
          notification,
        );
      },
    ),
  );

  handles.push(
    await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action) => {
        onAction?.(
          action,
        );
      },
    ),
  );

  return handles;
}
