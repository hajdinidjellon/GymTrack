import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/global.css';

import { supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db';
import { colors } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor={colors.bg.primary} />
          <AppNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  const { loadWorkouts } = useWorkoutStore();
  const { loadProfile } = useProfileStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    let mounted = true;

    async function init() {
      // 1. Init base de données locale + settings
      await Promise.all([getDb(), loadSettings()]);

      // 2. Charge les données locales immédiatement (offline-first)
      await loadWorkouts();
      const profile = await loadProfile().then(() => useProfileStore.getState().profile);

      // 3. Supabase session — optionnelle (sync cloud)
      // L'app fonctionne entièrement hors-ligne sans compte
      const {
        data: { session },
      } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));

      if (!mounted) return;

      setIsAuthenticated(!!session);
      setHasProfile(!!profile);
      setIsReady(true);
    }

    init().catch(console.error);

    // Écoute les changements de session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setIsAuthenticated(!!session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Redirect une fois l'état connu
  useEffect(() => {
    if (!isReady) return;

    // On ne bloque plus sur l'auth Supabase.
    // Seul le profil local compte pour le routing.
    if (!hasProfile) {
      router.replace('/(auth)/onboarding/goal');
    } else {
      router.replace('/(tabs)');
    }
  }, [isReady, isAuthenticated, hasProfile]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="workout/[id]"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="exercise/[id]"
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
