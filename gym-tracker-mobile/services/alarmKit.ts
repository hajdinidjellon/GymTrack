import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { t } from '@/i18n';

/**
 * La fin du repos en vraie alarme, app quittée (modules/okilo-alarm, AlarmKit) :
 * plein écran par-dessus TikTok, sonne même en silencieux, « Arrêter » et
 * « Ouvrir Okilo ». iOS 26 et un build seulement : ailleurs (Expo Go, Android,
 * iOS plus ancien) tout renvoie false et la notification fait le travail.
 */

interface OkiloAlarmModule {
  isSupported(): boolean;
  requestAuthorization(): Promise<'authorized' | 'denied' | 'notDetermined' | 'unsupported'>;
  schedule(id: string, at: number, title: string, stopLabel: string, openLabel: string): Promise<boolean>;
  cancel(id: string): Promise<void>;
}

const native = Platform.OS === 'ios' ? requireOptionalNativeModule<OkiloAlarmModule>('OkiloAlarm') : null;

/** One rest at a time: always the same alarm. */
const REST_ALARM_ID = '6F1C2B8E-4A3D-4E5F-9B7A-0C1D2E3F4A5B';

export function alarmKitAvailable(): boolean {
  try {
    return native?.isSupported() ?? false;
  } catch {
    return false;
  }
}

/** Asked with the notifications, at the first session. */
export async function requestAlarmPermission(): Promise<boolean> {
  if (!native || !alarmKitAvailable()) return false;
  try {
    return (await native.requestAuthorization()) === 'authorized';
  } catch {
    return false;
  }
}

/** Rings at `at` (epoch ms). False when it could not: the notification stays. */
export async function scheduleRestAlarm(at: number): Promise<boolean> {
  if (!native || !alarmKitAvailable()) return false;
  try {
    return await native.schedule(
      REST_ALARM_ID,
      at,
      t('domain.notifications.restOverTitle'),
      t('domain.alarm.stop'),
      t('domain.alarm.open'),
    );
  } catch {
    return false;
  }
}

export async function cancelRestAlarm(): Promise<void> {
  if (!native || !alarmKitAvailable()) return;
  try {
    await native.cancel(REST_ALARM_ID);
  } catch {
    // ignore
  }
}
