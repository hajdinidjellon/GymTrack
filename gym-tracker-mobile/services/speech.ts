import * as Speech from 'expo-speech';
import type { Spoken } from '@/domain/voiceClips';
import { getLocale, localeTag } from '@/i18n';
import { hasClips, playClips, stopClips } from '@/services/voicePack';

/** After the app stops talking, the microphone still ignores what it hears for this long. */
export const ECHO_GUARD_MS = 1500;

let speaking = false;
let quietFrom = 0;

function done() {
  speaking = false;
  quietFrom = Date.now() + ECHO_GUARD_MS;
}

function say(text: string) {
  Speech.speak(text, { language: localeTag(getLocale()), rate: 1.05, onDone: done, onStopped: done, onError: done });
}

/**
 * Says the line, cutting off whatever was being said. In French, the recorded
 * voice when it has every clip of the line; otherwise the phone's voice says
 * all of it, never half a line in each.
 */
export function speak(line: string | Spoken) {
  const { text, clips, tail } = typeof line === 'string' ? { text: line, clips: null, tail: undefined } : line;
  Speech.stop();
  stopClips();
  speaking = true;
  if (getLocale() === 'fr' && clips && hasClips(clips)) {
    playClips(clips, () => (tail ? say(tail) : done()));
    return;
  }
  say(text);
}

/** The app is talking, or just stopped: what the microphone hears now is probably its own voice. */
export function appIsSpeaking(now = Date.now()): boolean {
  return speaking || now < quietFrom;
}
