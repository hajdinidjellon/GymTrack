import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { VOICE_CLIPS } from '@/assets/voice/fr/clips';
import { logger } from '@/services/logger';

/**
 * La voix enregistrée : des clips courts joués l'un après l'autre
 * (domain/voiceClips.ts dit lesquels). Un seul lecteur pour toute l'app.
 */

let player: AudioPlayer | null = null;
let queue: string[] = [];
let onFinished: (() => void) | null = null;

/** Every clip of the line is in the pack: the recorded voice can say it all. */
export function hasClips(ids: string[]): boolean {
  return ids.length > 0 && ids.every((id) => id in VOICE_CLIPS);
}

function getPlayer(): AudioPlayer {
  if (player) return player;
  // Comme la cloche : même téléphone en silencieux, par-dessus la musique
  void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => null);
  const created = createAudioPlayer(null);
  created.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) playNext();
  });
  player = created;
  return created;
}

function finish() {
  const done = onFinished;
  onFinished = null;
  done?.();
}

function playNext() {
  const id = queue.shift();
  const source = id ? VOICE_CLIPS[id] : undefined;
  if (source === undefined) return finish();
  try {
    const p = getPlayer();
    p.replace(source);
    p.play();
  } catch (error) {
    logger.warn('voice clip', error);
    queue = [];
    finish();
  }
}

/** Plays the clips in order, then calls `done`. Cuts off whatever was playing. */
export function playClips(ids: string[], done: () => void): void {
  stopClips();
  queue = [...ids];
  onFinished = done;
  playNext();
}

/** Stops the line being played. What was to follow it (a note) is dropped too. */
export function stopClips(): void {
  const wasPlaying = queue.length > 0 || onFinished !== null;
  queue = [];
  onFinished = null;
  if (player && wasPlaying) {
    try {
      player.pause();
    } catch {
      // déjà arrêté
    }
  }
}
