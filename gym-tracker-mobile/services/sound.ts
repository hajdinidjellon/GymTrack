import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * La sonnerie de fin du repos, app ouverte. App en arrière-plan, c'est la
 * notification qui sonne (même son, déclaré dans app.json).
 */

let player: AudioPlayer | null = null;

export function playRestBell(): void {
  if (AppState.currentState !== 'active') return;
  try {
    if (!player) {
      // Sonne même téléphone en silencieux, par-dessus la musique sans la couper
      void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => null);
      player = createAudioPlayer(require('@/assets/sounds/rest-bell.wav'));
    }
    void player.seekTo(0).catch(() => null);
    player.play();
  } catch {
    // pas de son plutôt qu'un crash
  }
}

/** How long the bell rings before the voice can speak over it. */
export const REST_BELL_MS = 900;
