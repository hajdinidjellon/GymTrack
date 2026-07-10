import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Rajdhani_400Regular,
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import '@/global.css';

import { supabase } from '@/lib/supabase';
import { startSyncConnectivityListener } from '@/lib/sync';
import { getDb } from '@/lib/db';
import { colors } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBadgeQueueStore } from '@/stores/badgeQueueStore';
import { requestPermissions, refreshAllNotifications, cancelAllTrainingReminders, notifyBadgeUnlocked } from '@/lib/notifications';
import { calculateStreakFromWorkouts, getUnlockedBadges, RANKS } from '@/lib/gamification';
import { BadgeUnlockModal } from '@/components/gamification/BadgeUnlockModal';
import { CelebrationToast } from '@/components/ui/CelebrationToast';
import { PRCelebration } from '@/components/gamification/PRCelebration';
import { RankUpOverlay } from '@/components/gamification/RankUpOverlay';
import { useCelebrationStore } from '@/stores/celebrationStore';
import { ErrorFallback } from '@/components/ui/ErrorFallback';

// Boundary global — attrape toute erreur de rendu des routes enfants.
// Ne dépend ni des fonts ni des stores : doit se rendre quoi qu'il arrive.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ErrorFallback error={error} context="[boundary:root]" retry={retry} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.bg.primary} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const [fontsLoaded] = useFonts({
    'Rajdhani-Regular':  Rajdhani_400Regular,
    'Rajdhani-Medium':   Rajdhani_500Medium,
    'Rajdhani-SemiBold': Rajdhani_600SemiBold,
    'Rajdhani-Bold':     Rajdhani_700Bold,
    'Inter-Regular':     Inter_400Regular,
    'Inter-Medium':      Inter_500Medium,
    'Inter-SemiBold':    Inter_600SemiBold,
    'Inter-Bold':        Inter_700Bold,
  });
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [bootError, setBootError] = useState<Error | null>(null);
  const [initAttempt, setInitAttempt] = useState(0);

  const { loadWorkouts, workouts } = useWorkoutStore();
  const { loadProfile, profile } = useProfileStore();
  const { loadSettings } = useSettingsStore();
  const { hydrate: hydrateBadges, checkUnlocks, queue, dismissCurrent } = useBadgeQueueStore();
  const prevRankIdxRef = useRef<number | null>(null);

  // Watcher : détecte les nouveaux badges et notifie + queue le modal
  useEffect(() => {
    if (!isReady) return;
    const totalXP = useProfileStore.getState().getTotalXP();

    // Watcher rank-up : si l'index de rang augmente pendant la session,
    // déclenche l'overlay de montée de rang (DESIGN-GYMTRACK.md §B.9-4).
    const rank = useProfileStore.getState().getCurrentRank();
    if (rank) {
      const idx = RANKS.findIndex((r) => r.tier === rank.tier && r.level === rank.level);
      const prev = prevRankIdxRef.current;
      if (prev !== null && idx > prev) {
        const from = RANKS[prev];
        if (from) useCelebrationStore.getState().showRankUp({ from, to: rank });
      }
      prevRankIdxRef.current = idx;
    }
    const streak  = calculateStreakFromWorkouts(workouts);
    const data    = { workouts, profile: profile ?? null, totalXP, streak };
    const unlocked = getUnlockedBadges(data);

    // Capture les anciens badges avant l'update pour notification push
    const beforeIds = new Set(useBadgeQueueStore.getState().seenIds);
    checkUnlocks(unlocked);

    // Si de nouveaux badges ont été ajoutés à la queue, déclenche aussi
    // une notif push (seulement si l'app est en background ; sinon le modal suffit)
    const newBadges = unlocked.filter((b) => !beforeIds.has(b.id));
    if (newBadges.length > 0 && useSettingsStore.getState().settings.notifications) {
      newBadges.forEach((b) => notifyBadgeUnlocked(b.name));
    }
  }, [isReady, workouts, profile]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // 1. Init base de données locale + settings + badges seen
      await Promise.all([getDb(), loadSettings(), hydrateBadges()]);

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

      // 4. Notifications — demande permission + reschedule
      // Best-effort, ne bloque pas l'app si ça échoue
      (async () => {
        const { settings } = useSettingsStore.getState();
        if (!settings.notifications) {
          await cancelAllTrainingReminders();
          return;
        }
        const granted = await requestPermissions();
        if (!granted || !profile) return;

        const workouts    = useWorkoutStore.getState().workouts;
        const streak      = calculateStreakFromWorkouts(workouts);
        const lastWorkout = workouts[0]?.date;
        await refreshAllNotifications(profile.onboarding, streak, lastWorkout);
      })().catch((err) => console.warn('Notification setup failed', err));
    }

    // Si l'init critique échoue (SQLite corrompue, etc.), on affiche un
    // écran d'erreur avec retry au lieu de rester bloqué sur le spinner.
    init().catch((err) => {
      console.error('[boot] init failed:', err);
      if (mounted) setBootError(err instanceof Error ? err : new Error(String(err)));
    });

    // Écoute les changements de session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setIsAuthenticated(!!session);
    });

    // Draine la sync_queue au retour de connexion
    const unsubscribeNetInfo = startSyncConnectivityListener();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      unsubscribeNetInfo();
    };
  }, [initAttempt]);

  // Redirect une fois l'état connu
  useEffect(() => {
    if (!isReady) return;

    // On ne bloque plus sur l'auth Supabase.
    // Seul le profil local compte pour le routing.
    if (!hasProfile) {
      router.replace('/(auth)/welcome');
    } else {
      router.replace('/(tabs)');
    }
  }, [isReady, isAuthenticated, hasProfile]);

  if (bootError) {
    return (
      <ErrorFallback
        error={bootError}
        context="[boot]"
        titleKey="error.boot.title"
        messageKey="error.boot.message"
        retry={() => {
          setBootError(null);
          setInitAttempt((n) => n + 1);
        }}
      />
    );
  }

  if (!isReady || !fontsLoaded) {
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
    <>
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
        <Stack.Screen
          name="legal/privacy"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="legal/licenses"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>

      {/* Modal de célébration badge — affiche le premier de la queue */}
      <BadgeUnlockModal
        badge={queue[0] ?? null}
        onClose={dismissCurrent}
      />

      {/* Toast de célébration objectif hebdo */}
      <CelebrationToast />

      {/* Célébration PR plein écran (volt + compteur + confettis) */}
      <PRCelebration />

      {/* Montée de rang — cadre tracé, éclat, onde de choc */}
      <RankUpOverlay />
    </>
  );
}
