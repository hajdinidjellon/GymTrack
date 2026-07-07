/**
 * SFX — les blips HUD de l'interface (MOBILE_PREMIUM.md : l'haptique ponctue,
 * le son renforce). Assets 100% procéduraux : WAV synthétisés (assets/sounds),
 * cohérents avec la DA « compagnon de vaisseau » de NEXUS.
 *
 * Lecture fire-and-forget : un son ne doit JAMAIS casser l'UI ni faire
 * attendre l'utilisateur. Pools de lecteurs pour les retrigger rapides
 * (ticks du typewriter). Respecte le mode silencieux iOS (défaut expo-audio).
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

const SOURCES = {
  /** Tick de frappe du typewriter NEXUS. */
  type: require('@/assets/sounds/type.wav') as number,
  /** Tap sur une option, un segment, un stepper. */
  select: require('@/assets/sounds/select.wav') as number,
  /** Retour en arrière / skip. */
  back: require('@/assets/sounds/back.wav') as number,
  /** CTA principal — validation. */
  confirm: require('@/assets/sounds/confirm.wav') as number,
  /** Réaction de NEXUS : réponse verrouillée, il calcule la suite. */
  processing: require('@/assets/sounds/processing.wav') as number,
  /** Célébration : fin d'onboarding, records. */
  celebrate: require('@/assets/sounds/celebrate.wav') as number,
} as const;

export type SfxName = keyof typeof SOURCES;

/** Lecteurs par son — >1 uniquement pour les sons retriggés très vite. */
const POOL_SIZE: Record<SfxName, number> = {
  type: 3, select: 2, back: 1, confirm: 1, processing: 1, celebrate: 1,
};

const pools = new Map<SfxName, { players: AudioPlayer[]; next: number }>();
let enabled = true;

/** Coupe/rétablit tous les blips UI (futur réglage dans settingsStore). */
export function setSfxEnabled(value: boolean): void {
  enabled = value;
}

function acquire(name: SfxName): AudioPlayer {
  let pool = pools.get(name);
  if (!pool) {
    pool = { players: [], next: 0 };
    pools.set(name, pool);
  }
  if (pool.players.length < POOL_SIZE[name]) {
    const player = createAudioPlayer(SOURCES[name]);
    pool.players.push(player);
    return player;
  }
  const player = pool.players[pool.next % pool.players.length]!;
  pool.next += 1;
  return player;
}

/** Joue un blip UI. Ne jette jamais. */
export function playSfx(name: SfxName, volume = 1): void {
  if (!enabled) return;
  try {
    const player = acquire(name);
    player.volume = volume;
    player.seekTo(0);
    player.play();
  } catch {
    // fire-and-forget : le son ne bloque jamais l'UI
  }
}
