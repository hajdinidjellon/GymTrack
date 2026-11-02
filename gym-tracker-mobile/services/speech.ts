import * as Speech from 'expo-speech';
import { getLocale, localeTag } from '@/i18n';

/** After the app stops talking, the microphone still ignores what it hears for this long. */
export const ECHO_GUARD_MS = 1500;

let speaking = false;
let quietFrom = 0;

/** Says the line in the app's language, cutting off whatever was being said. */
export function speak(text: string) {
  Speech.stop();
  speaking = true;
  const done = () => {
    speaking = false;
    quietFrom = Date.now() + ECHO_GUARD_MS;
  };
  Speech.speak(text, { language: localeTag(getLocale()), rate: 1.05, onDone: done, onStopped: done, onError: done });
}

/** The app is talking, or just stopped: what the microphone hears now is probably its own voice. */
export function appIsSpeaking(now = Date.now()): boolean {
  return speaking || now < quietFrom;
}
