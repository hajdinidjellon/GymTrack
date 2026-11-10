import { AppState, Vibration } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * La sonnerie de fin du repos, app ouverte. App en arrière-plan, c'est la
 * notification qui sonne (même son, déclaré dans app.json).
 */

let player: AudioPlayer | null = null;

function bell(): AudioPlayer {
  if (!player) {
    // Sonne même téléphone en silencieux, par-dessus la musique sans la couper
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => null);
    player = createAudioPlayer(require('@/assets/sounds/rest-bell.wav'));
  }
  return player;
}

function ring(loop: boolean): void {
  const p = bell();
  p.loop = loop;
  void p.seekTo(0).catch(() => null);
  p.play();
}

export function playRestBell(): void {
  if (AppState.currentState !== 'active') return;
  try {
    ring(false);
  } catch {
    // pas de son plutôt qu'un crash
  }
}

/**
 * Like a kitchen timer: buzz, pause, buzz… until stopped. On iOS a buzz lasts
 * about 0.4 s whatever the pattern says, the numbers are the pauses.
 */
const ALARM_VIBRATION = [0, 500, 400];

/** The end of the rest, app open: vibrates over and over, and rings the bell in a loop when `withBell`. */
export function startRestAlarm(withBell: boolean): void {
  if (AppState.currentState !== 'active') return;
  try {
    Vibration.vibrate(ALARM_VIBRATION, true);
  } catch {
    // pas de vibration plutôt qu'un crash
  }
  if (!withBell) return;
  try {
    ring(true);
  } catch {
    // pas de son plutôt qu'un crash
  }
}

export function stopRestAlarm(): void {
  try {
    Vibration.cancel();
  } catch {
    // ignore
  }
  if (!player) return;
  try {
    player.loop = false;
    player.pause();
  } catch {
    // ignore
  }
}

/** How long the bell rings before the voice can speak over it. */
export const REST_BELL_MS = 900;
