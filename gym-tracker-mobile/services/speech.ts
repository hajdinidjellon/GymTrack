import * as Speech from 'expo-speech';
import { getLocale, localeTag } from '@/i18n';

/** Says the line in the app's language, cutting off whatever was being said. */
export function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: localeTag(getLocale()), rate: 1.05 });
}
