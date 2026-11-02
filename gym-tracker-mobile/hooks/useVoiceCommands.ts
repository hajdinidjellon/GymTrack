import { useEffect, useState } from 'react';
import { COMMAND_WORDS, parseCommand } from '@/domain/voiceCommands';
import { getLocale, localeTag } from '@/i18n';
import { appIsSpeaking } from '@/services/speech';
import { startListening, voiceInputAvailable } from '@/services/voiceInput';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Listens for the voice commands while `active` (the logger is on screen)
 * and the user turned them on. Returns whether the microphone is open, so
 * the screen can say it.
 */
export function useVoiceCommands(active: boolean): boolean {
  const enabled = useSettingsStore((s) => s.settings.voiceCommands);
  const [available] = useState(voiceInputAvailable);
  const listening = active && enabled && available;

  useEffect(() => {
    if (!listening) return;
    return startListening(localeTag(getLocale()), COMMAND_WORDS, (heard) => {
      // The app's own voice ("Série 2. 60 kilos…") is never a command
      if (appIsSpeaking()) return;
      const command = parseCommand(heard);
      if (command) useSessionStore.getState().voiceCommand(command);
    });
  }, [listening]);

  return listening;
}
