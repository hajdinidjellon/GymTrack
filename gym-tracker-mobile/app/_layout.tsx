import React, { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';

import { getDb } from '@/services/db';
import { logger } from '@/services/logger';
import { colors } from '@/constants/theme';
import { LaunchAnimation } from '@/components/brand/LaunchAnimation';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { resumeAccountSync } from '@/stores/accountData';
import { useAppearance } from '@/hooks/useLocale';
import { useLiveActivity } from '@/hooks/useLiveActivity';

SplashScreen.preventAutoHideAsync().catch(() => null);

export default function RootLayout() {
  // Applied first: every screen below reads the colours of this scheme
  const scheme = useAppearance();
  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
    'Fredoka-SemiBold': Fredoka_600SemiBold,
    'Fredoka-Bold': Fredoka_700Bold,
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  useLiveActivity();

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
      .finally(() => {
        setDataLoaded(true);
        // Then the cloud, in the background: what waits goes, what another phone did comes in
        void resumeAccountSync();
      });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void resumeAccountSync();
    });
    return () => subscription.remove();
  }, []);

  const fontsDone = fontsLoaded || !!fontError;
  const ready = fontsDone && dataLoaded;
  const [intro, setIntro] = useState(true);
  const endIntro = useCallback(() => setIntro(false), []);

  // L'écran natif (même papier) laisse la place à l'animation dès que la police est là
  useEffect(() => {
    if (fontsDone) SplashScreen.hideAsync().catch(() => null);
  }, [fontsDone]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {ready ? (
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper }, animation: 'fade' }}
          >
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="session/preview" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="session/index" options={{ gestureEnabled: false }} />
            <Stack.Screen name="session/summary" options={{ gestureEnabled: false }} />
            <Stack.Screen name="exercise/[name]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="days/index" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="days/[name]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="history/index" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="history/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="account/index" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="privacy/index" options={{ animation: 'slide_from_right' }} />
          </Stack>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.paper }} />
        )}
        {intro && fontsDone ? <LaunchAnimation ready={ready} onDone={endIntro} /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
