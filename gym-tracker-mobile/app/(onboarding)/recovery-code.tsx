import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useLocale } from '@/hooks/useLocale';
import { useRecoveryStore } from '@/stores/recoveryStore';
import { RecoveryCodeView } from '@/components/account/RecoveryCodeView';
import { resetTo } from '@/components/navigation/resetTo';
import { Screen } from '@/components/ui/Screen';

function leave() {
  const { then, forget } = useRecoveryStore.getState();
  forget();
  if (then === 'login') router.replace('/login');
  else if (then === 'goal') router.replace('/setup');
  else resetTo('/(tabs)');
}

/** The recovery code, once. Kept only in memory: gone as soon as the user leaves. */
export default function RecoveryCode() {
  useLocale();
  const code = useRecoveryStore((s) => s.code);
  const username = useRecoveryStore((s) => s.username);

  useEffect(() => {
    // Nothing to show (the app was reopened here): the code is not kept, move on
    if (!useRecoveryStore.getState().code) leave();
    // Forgotten when the screen goes, whatever the way out
    return () => useRecoveryStore.getState().forget();
  }, []);

  if (!code) return null;
  return (
    <Screen scroll>
      <RecoveryCodeView code={code} username={username} onKept={leave} />
    </Screen>
  );
}
