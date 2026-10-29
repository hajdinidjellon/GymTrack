import { useEffect } from 'react';
import { Platform } from 'react-native';
import { lockScreenProps, type LockScreenProps } from '@/domain/lockScreen';
import { findCurrent } from '@/domain/sessionCursor';
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
      const props: LockScreenProps = lockScreenProps(session, useSettingsStore.getState().settings, Date.now());
      const json = JSON.stringify(props);
      if (json === shown) return;
      try {
        // Après un redémarrage de l'app, on reprend l'activité déjà affichée
        activity ??= factory.getInstances()[0] ?? null;
        if (activity) void activity.update(props).catch((error: unknown) => logger.warn('live activity update', error));
        else activity = factory.start(props, 'gymtrack://session');
        shown = json;
      } catch (error) {
        // Live Activities coupées dans les réglages de l'iPhone : l'app marche sans
        logger.warn('live activity unavailable', error);
      }
    };

    sync(useSessionStore.getState().activeSession);
    const unsubscribe = useSessionStore.subscribe((state, previous) => {
      if (state.activeSession !== previous.activeSession) sync(state.activeSession);
    });

    const interactions = widgets.addUserInteractionListener((event) => {
      if (event.source !== 'WorkoutActivity' || event.target !== validate) return;
      const { activeSession, completeSet } = useSessionStore.getState();
      const cursor = activeSession && findCurrent(activeSession.exercises);
      if (cursor && !cursor.exercise.needsWeight) completeSet(cursor.exercise.id, cursor.setIndex);
    });

    return () => {
      unsubscribe();
      interactions.remove();
    };
  }, []);
}
