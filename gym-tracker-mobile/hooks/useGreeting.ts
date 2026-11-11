import { useEffect, useState } from 'react';
import { displayName, isEvening } from '@/domain/greeting';
import { getUsername } from '@/services/supabase';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/i18n';

/** « Bonjour Djellon », « Bonsoir » without an account. The hour is read once, when the home opens. */
export function useGreeting(): string {
  const [evening] = useState(() => isEvening(new Date().getHours()));
  const [name, setName] = useState<string | null>(null);
  const signedOut = useSettingsStore((s) => s.settings.signedOut);
  useEffect(() => {
    let alive = true;
    getUsername()
      .then((n) => {
        if (alive) setName(displayName(n));
      })
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, [signedOut]);
  if (name) return t(evening ? 'home.greeting.eveningName' : 'home.greeting.dayName', { name });
  return t(evening ? 'home.greeting.evening' : 'home.greeting.day');
}
