import * as Speech from 'expo-speech';

/** Says the line in French, cutting off whatever was being said. */
export function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'fr-FR', rate: 1.05 });
}
