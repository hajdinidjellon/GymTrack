/**
 * MICRO — speech recognition for the voice commands, on the phone only: a phone that can only
 * recognize through a server (Apple's, Google's) does not offer them. The permission texts
 * promise that nothing heard leaves the phone.
 * The native module is absent from Expo Go and the tests: then nothing
 * listens and `voiceInputAvailable()` says so.
 */

import { requireOptionalNativeModule } from 'expo';
import { logger } from '@/services/logger';
// Types only: the module itself is loaded when it exists (see load)
import type * as RecognitionModule from 'expo-speech-recognition';

type Recognition = (typeof RecognitionModule)['ExpoSpeechRecognitionModule'];

function load(): Recognition | null {
  // Checked first: requiring a missing module throws, and in development Metro shows it as an error
  if (!requireOptionalNativeModule('ExpoSpeechRecognition')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('expo-speech-recognition') as typeof RecognitionModule;
    return module.ExpoSpeechRecognitionModule ?? null;
  } catch {
    return null;
  }
}

/** The phone can recognize speech by itself (development or store build, not Expo Go). */
export function voiceInputAvailable(): boolean {
  try {
    const recognition = load();
    return !!recognition && recognition.isRecognitionAvailable() && recognition.supportsOnDeviceRecognition();
  } catch {
    return false;
  }
}

/** Asks for the microphone and speech recognition. True when both are granted. */
export async function requestVoicePermission(): Promise<boolean> {
  const recognition = load();
  if (!recognition) return false;
  try {
    return (await recognition.requestPermissionsAsync()).granted;
  } catch (error) {
    logger.warn('voice permission failed', error);
    return false;
  }
}

/**
 * Listens until the returned function is called, and hands over each final
 * phrase. The recognizer stops by itself now and then: it starts again.
 */
export function startListening(lang: string, hints: string[], onPhrase: (text: string) => void): () => void {
  const recognition = load();
  // Never through a server: without recognition on the phone, nothing listens
  if (!recognition || !recognition.supportsOnDeviceRecognition()) return () => undefined;
  let active = true;
  const begin = () => {
    if (!active) return;
    try {
      recognition.start({
        lang,
        interimResults: false,
        continuous: true,
        requiresOnDeviceRecognition: true,
        contextualStrings: hints,
        addsPunctuation: false,
      });
    } catch (error) {
      logger.warn('voice start failed', error);
    }
  };
  const subscriptions = [
    recognition.addListener('result', (event) => {
      const text = event.results[0]?.transcript;
      if (event.isFinal && text) onPhrase(text);
    }),
    recognition.addListener('end', () => {
      // Restarted a moment later, not in a tight loop
      if (active) setTimeout(begin, 400);
    }),
    recognition.addListener('error', (event) => logger.warn('voice error', event.error)),
  ];
  begin();
  return () => {
    active = false;
    for (const s of subscriptions) s.remove();
    try {
      recognition.abort();
    } catch {
      // Already stopped
    }
  };
}
