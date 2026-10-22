import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notifications locales — fin du repos quand l'app est en arrière-plan.
 * Les notifications locales marchent dans Expo Go, pas les push.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
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
        name: 'GymTrack',
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

/** Handled by the OS, so it fires even with the app in the background. */
export async function scheduleRestCompleteNotification(seconds: number, body: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REST_COMPLETE_ID).catch(() => null);
    await Notifications.scheduleNotificationAsync({
      identifier: REST_COMPLETE_ID,
      content: { title: 'Repos terminé', body, sound: 'default', data: { type: 'rest-complete' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
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
