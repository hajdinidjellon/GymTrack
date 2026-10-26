import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';

import { getDb } from '@/services/db';
import { logger } from '@/services/logger';
import { requestPermissions } from '@/services/notifications';
import { colors } from '@/constants/theme';
import { LaunchAnimation } from '@/components/brand/LaunchAnimation';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';

SplashScreen.preventAutoHideAsync().catch(() => null);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Bricolage-Regular': BricolageGrotesque_400Regular,
    'Bricolage-SemiBold': BricolageGrotesque_600SemiBold,
    'Bricolage-Bold': BricolageGrotesque_700Bold,
    'Bricolage-ExtraBold': BricolageGrotesque_800ExtraBold,
  });
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Tout est local : l'app démarre sans réseau, la sync cloud suit en arrière-plan
    (async () => {
      await getDb();
      await Promise.all([
        useSettingsStore.getState().loadSettings(),
        useWorkoutStore.getState().loadWorkouts(),
        useProfileStore.getState().loadProfile(),
      ]);
    })()
      .catch((error: unknown) => logger.error('startup load failed', error))
      .finally(() => setDataLoaded(true));
  }, []);

  const fontsDone = fontsLoaded || !!fontError;
  const ready = fontsDone && dataLoaded;
  const [intro, setIntro] = useState(true);
  const endIntro = useCallback(() => setIntro(false), []);

  // L'écran natif (même vert) laisse la place à l'animation dès que la police est là
  useEffect(() => {
    if (fontsDone) SplashScreen.hideAsync().catch(() => null);
  }, [fontsDone]);

  useEffect(() => {
    if (!ready) return;
    if (useSettingsStore.getState().settings.notifications) requestPermissions().catch(() => null);
  }, [ready]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {ready ? (
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}
          >
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="session/preview" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="session/index" options={{ gestureEnabled: false }} />
            <Stack.Screen name="session/summary" options={{ gestureEnabled: false }} />
            <Stack.Screen name="exercise/[name]" options={{ animation: 'slide_from_right' }} />
          </Stack>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.bg }} />
        )}
        {intro && fontsDone ? <LaunchAnimation ready={ready} onDone={endIntro} /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
