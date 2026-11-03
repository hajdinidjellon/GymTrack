import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { t } from '@/i18n';

/**
 * Notifications locales — fin du repos quand l'app est en arrière-plan.
 * Les notifications locales marchent dans Expo Go, pas les push.
 */

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowAlert: true,
    // App ouverte, la fin du repos sonne déjà dans l'app (services/sound.ts)
    shouldPlaySound: notification.request.content.data?.type !== 'rest-complete',
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });

    if (Platform.OS === 'android' && status === 'granted') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Okilo',
        // eslint-plugin-import misreads the compiled enum of expo-notifications 58
        // eslint-disable-next-line import/namespace
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    return status === 'granted';
  } catch {
    return false;
  }
}

const REST_COMPLETE_ID = 'rest-complete';
const REST_CHANNEL = 'rest';
/** Declared in the expo-notifications plugin of app.json. */
const REST_BELL = 'rest-bell.wav';

/** Handled by the OS, so it fires even with the app in the background. `ring`: the bell, else silent. */
export async function scheduleRestCompleteNotification(seconds: number, body: string, ring = true): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REST_COMPLETE_ID).catch(() => null);
    // Android : le son d'une notification vient de son canal
    if (ring && Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(REST_CHANNEL, {
        name: t('domain.notifications.restChannel'),
        // eslint-disable-next-line import/namespace
        importance: Notifications.AndroidImportance.HIGH,
        sound: REST_BELL,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    await Notifications.scheduleNotificationAsync({
      identifier: REST_COMPLETE_ID,
      content: {
        title: t('domain.notifications.restOverTitle'),
        body,
        sound: ring ? REST_BELL : false,
        data: { type: 'rest-complete' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
        ...(ring ? { channelId: REST_CHANNEL } : {}),
      },
    });
  } catch {
    // ignore
  }
}

export async function cancelRestCompleteNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REST_COMPLETE_ID);
  } catch {
    // ignore
  }
}
