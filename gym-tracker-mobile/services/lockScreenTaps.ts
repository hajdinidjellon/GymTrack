import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import type { LockScreenSet } from '@/domain/lockScreen';

/**
 * Les « Valider » tapés sur l'écran verrouillé, app endormie ou fermée :
 * le code natif (modules/okilo-alarm) les note et avance l'écran verrouillé
 * tout seul ; l'app les rejoue sur la séance quand elle tourne de nouveau.
 */

export interface LockScreenTap extends LockScreenSet {
  /** When it was tapped, epoch ms. */
  at: number;
}

interface TapsModule {
  takeLockScreenTaps(): unknown[];
}

/** Looked up at the first call, not when the file loads. */
const native = (): TapsModule | null =>
  Platform.OS === 'ios' ? requireOptionalNativeModule<TapsModule>('OkiloAlarm') : null;

function isTap(value: unknown): value is LockScreenTap {
  const tap = value as Partial<LockScreenTap> | null;
  return (
    typeof tap?.exerciseId === 'string' &&
    typeof tap.setIndex === 'number' &&
    Number.isInteger(tap.setIndex) &&
    typeof tap.at === 'number'
  );
}

/** True in a build with the native queue (not in Expo Go nor on Android). */
export function lockScreenTapsAvailable(): boolean {
  return typeof native()?.takeLockScreenTaps === 'function';
}

/** The taps not replayed yet, oldest first; the queue is emptied. */
export function takeLockScreenTaps(): LockScreenTap[] {
  if (!lockScreenTapsAvailable()) return [];
  try {
    return native()!
      .takeLockScreenTaps()
      .filter(isTap)
      .sort((a, b) => a.at - b.at);
  } catch {
    return [];
  }
}
