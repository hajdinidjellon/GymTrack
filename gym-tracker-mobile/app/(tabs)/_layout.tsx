import React, { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { colors } from '@/constants/theme';
import { TabBar } from '@/components/navigation/TabBar';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';

// Une séance restée ouverte (app tuée en plein milieu) se rouvre une seule fois au lancement
let resumeChecked = false;

export default function TabsLayout() {
  const hasProfile = useProfileStore((s) => !!s.profile);
  const signedOut = useSettingsStore((s) => s.settings.signedOut);

  useEffect(() => {
    if (resumeChecked || !hasProfile || signedOut) return;
    resumeChecked = true;
    if (useSessionStore.getState().activeSession) router.push('/session');
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
