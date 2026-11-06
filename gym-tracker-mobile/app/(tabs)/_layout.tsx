import React, { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { colors } from '@/constants/theme';
import { isStale } from '@/domain/sessionTime';
import { TabBar } from '@/components/navigation/TabBar';
import { useLocale } from '@/hooks/useLocale';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';

// Une séance restée ouverte (app tuée en plein milieu) se rouvre une seule fois au lancement
let resumeChecked = false;

export default function TabsLayout() {
  useLocale();
  const hasProfile = useProfileStore((s) => !!s.profile);
  const signedOut = useSettingsStore((s) => s.settings.signedOut);

  useEffect(() => {
    if (resumeChecked || !hasProfile || signedOut) return;
    resumeChecked = true;
    const session = useSessionStore.getState().activeSession;
    // Left open for hours: the home asks what to do with it instead
    if (session && !isStale(session, Date.now())) router.push('/session');
  }, [hasProfile, signedOut]);

  if (!hasProfile || signedOut) return <Redirect href="/welcome" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.paper } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
