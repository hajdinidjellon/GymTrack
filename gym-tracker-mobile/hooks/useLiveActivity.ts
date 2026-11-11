import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { lockScreenState } from '@/domain/lockScreen';
import { findCurrent } from '@/domain/sessionCursor';
import { lockScreenTapsAvailable, takeLockScreenTaps } from '@/services/lockScreenTaps';
import { logger } from '@/services/logger';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ActiveSession } from '@/types';
// Types seulement : les modules eux-mêmes ne sont chargés que s'ils existent (voir loadNative)
import type * as WidgetsModule from 'expo-widgets';
import type * as ActivityModule from '@/components/liveActivity/WorkoutActivity';

type Widgets = typeof WidgetsModule;
type Factory = (typeof ActivityModule)['default'];
type Activity = ReturnType<Factory['start']>;

// Absent d'Expo Go, d'Android et des tests : sans module natif, pas d'écran verrouillé
function loadNative(): { widgets: Widgets; factory: Factory; validate: string } | null {
  if (Platform.OS !== 'ios') return null;
  // Checked first: requiring a missing module throws, and in development Metro shows it as an error
  if (!requireOptionalNativeModule('ExpoWidgets')) return null;
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const widgets = require('expo-widgets') as Widgets;
    const activity = require('@/components/liveActivity/WorkoutActivity') as typeof ActivityModule;
    /* eslint-enable @typescript-eslint/no-require-imports */
    return { widgets, factory: activity.default, validate: activity.VALIDATE_TARGET };
  } catch {
    return null;
  }
}

/**
 * Keeps the running session on the lock screen (Live Activity) and turns
 * its "Valider" button into a validated set. Mounted once, at the root.
 * In a build the button works with the app asleep or closed: the native code
 * queues the tap and moves the lock screen on; the app replays the queue here.
 */
export function useLiveActivity(): void {
  useEffect(() => {
    const native = loadNative();
    if (!native) return;
    const { widgets, factory, validate } = native;

    let activity: Activity | null = null;
    let shown = '';

    const end = () => {
      for (const instance of factory.getInstances()) instance.end('immediate').catch(() => null);
      activity = null;
      shown = '';
    };

    const sync = (session: ActiveSession | null) => {
      if (!session) {
        if (activity || factory.getInstances().length > 0) end();
        return;
      }
      const props = lockScreenState(session, useSettingsStore.getState().settings, Date.now());
      const json = JSON.stringify(props);
      if (json === shown) return;
      try {
        // Après un redémarrage de l'app, on reprend l'activité déjà affichée
        activity ??= factory.getInstances()[0] ?? null;
        if (activity) void activity.update(props).catch((error: unknown) => logger.warn('live activity update', error));
        else activity = factory.start(props, 'okilo://session');
        shown = json;
      } catch (error) {
        // Live Activities coupées dans les réglages de l'iPhone : l'app marche sans
        logger.warn('live activity unavailable', error);
      }
    };

    /** The taps made while the app was not running, on the sets they were made on. */
    const replay = () => {
      const taps = takeLockScreenTaps();
      for (const { exerciseId, setIndex, at } of taps) useSessionStore.getState().completeSet(exerciseId, setIndex, at);
      // The native code moved the lock screen on by itself: show the app's own view again
      shown = '';
      sync(useSessionStore.getState().activeSession);
    };

    if (lockScreenTapsAvailable()) replay();
    else sync(useSessionStore.getState().activeSession);
    const unsubscribe = useSessionStore.subscribe((state, previous) => {
      if (state.activeSession !== previous.activeSession) sync(state.activeSession);
    });

    // Les mots de l'écran verrouillé suivent la langue choisie dans Profil
    const unsubscribeLanguage = useSettingsStore.subscribe((state, previous) => {
      if (state.settings.language !== previous.settings.language) sync(useSessionStore.getState().activeSession);
    });

    const interactions = widgets.addUserInteractionListener((event) => {
      if (event.source !== 'WorkoutActivity' || event.target !== validate) return;
      // The native code already queued this tap
      if (lockScreenTapsAvailable()) {
        replay();
        return;
      }
      const { activeSession, completeSet } = useSessionStore.getState();
      const cursor = activeSession && findCurrent(activeSession.exercises);
      if (cursor && !cursor.exercise.needsWeight) completeSet(cursor.exercise.id, cursor.setIndex);
    });

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active' && lockScreenTapsAvailable()) replay();
    });

    return () => {
      appState.remove();
      unsubscribe();
      unsubscribeLanguage();
      interactions.remove();
    };
  }, []);
}
