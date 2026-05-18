import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { DayOfWeek, OnboardingPreferences } from '@/types';

/**
 * Notifications locales — pas de serveur requis.
 *
 * Cas couverts :
 *   1. Rappel quotidien d'entraînement (sur jours préférés à heure choisie)
 *   2. Alerte streak en danger (si pas trained depuis 2 jours)
 *   3. Notification d'objectif atteint (one-shot immédiat)
 *   4. Notification de badge débloqué (one-shot immédiat)
 *
 * Limitations :
 *   - iOS : nécessite permission utilisateur (cf requestPermissions)
 *   - Expo Go iOS : les push notifs ne marchent pas, mais les LOCAL OUI
 */

// ── Configuration globale du handler ─────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Mapping jour → expo (1 = dimanche, 2 = lundi…) ────────────────
const DAY_TO_EXPO_WEEKDAY: Record<DayOfWeek, number> = {
  sun: 1, mon: 2, tue: 3, wed: 4, thu: 5, fri: 6, sat: 7,
};

const DAY_LABEL: Record<DayOfWeek, string> = {
  mon: 'lundi', tue: 'mardi', wed: 'mercredi', thu: 'jeudi',
  fri: 'vendredi', sat: 'samedi', sun: 'dimanche',
};

// ── Identifiants pour annuler les notifs par catégorie ────────────
const REMINDER_ID_PREFIX = 'training-reminder-';
const STREAK_WARNING_ID  = 'streak-warning';

// ── Permissions ──────────────────────────────────────────────────
/**
 * Demande la permission de notifier. À appeler au lancement de l'app.
 * Retourne true si l'utilisateur a accepté (ou déjà accepté).
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    // Android : channel par défaut pour les notifs
    if (Platform.OS === 'android' && status === 'granted') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'GymTrack',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#38bdf8',
      });
    }

    return status === 'granted';
  } catch {
    return false;
  }
}

export async function hasPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ── Helpers ──────────────────────────────────────────────────────
function parseHHmm(time: string): { h: number; m: number } | null {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if ((h as number) < 0 || (h as number) > 23) return null;
  if ((m as number) < 0 || (m as number) > 59) return null;
  return { h: h as number, m: m as number };
}

const ENCOURAGEMENTS = [
  "C'est l'heure de soulever de la fonte 💪",
  "Ta séance t'attend, montre-leur qui c'est le boss",
  "Une rep de plus que hier — c'est ça la règle",
  "Le canapé peut attendre, tes muscles non",
  "Ton futur toi te remerciera",
];

function pickEncouragement(): string {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)] ?? ENCOURAGEMENTS[0]!;
}

// ── Rappels d'entraînement quotidiens ────────────────────────────
/**
 * Schedule les rappels hebdomadaires selon les préférences d'onboarding.
 * Annule d'abord tous les rappels existants pour éviter les doublons.
 */
export async function scheduleTrainingReminders(
  prefs: OnboardingPreferences | undefined,
): Promise<void> {
  // Toujours annuler avant pour ne pas accumuler
  await cancelAllTrainingReminders();

  if (!prefs?.preferredDays?.length || !prefs.reminderTime) return;

  const time = parseHHmm(prefs.reminderTime);
  if (!time) return;

  for (const day of prefs.preferredDays) {
    const weekday = DAY_TO_EXPO_WEEKDAY[day];
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_ID_PREFIX}${day}`,
        content: {
          title: `Séance prévue ce ${DAY_LABEL[day]} 🏋️`,
          body:  pickEncouragement(),
          sound: 'default',
          data: { type: 'training-reminder', day },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour:   time.h,
          minute: time.m,
        },
      });
    } catch (err) {
      console.warn('Failed to schedule reminder for', day, err);
    }
  }
}

export async function cancelAllTrainingReminders(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(REMINDER_ID_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {
    // ignore
  }
}

// ── Alerte streak en danger ──────────────────────────────────────
/**
 * À appeler au lancement de l'app ou après chaque séance.
 * Schedule une notif "ta streak est en danger" pour demain soir
 * si l'utilisateur a une streak ≥ 2 jours et n'a pas trained aujourd'hui.
 */
export async function scheduleStreakWarning(streak: number, hoursSinceLastWorkout: number): Promise<void> {
  // Annule l'ancienne notif streak
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_WARNING_ID);
  } catch {
    // ignore
  }

  // Conditions :
  //   - streak >= 2 (ça vaut la peine de prévenir)
  //   - dernière séance entre 20h et 40h (risque de la perdre dans les 24h)
  if (streak < 2) return;
  if (hoursSinceLastWorkout < 20 || hoursSinceLastWorkout > 40) return;

  // Schedule pour demain à 19h
  const trigger = new Date();
  trigger.setHours(19, 0, 0, 0);
  if (trigger.getTime() < Date.now()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_WARNING_ID,
      content: {
        title: `🔥 Ta streak de ${streak} jours est en danger`,
        body:  'Une rapide séance suffit à la préserver. On compte sur toi.',
        sound: 'default',
        data: { type: 'streak-warning' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  } catch (err) {
    console.warn('Failed to schedule streak warning', err);
  }
}

// ── Notifications immédiates (objectif / badge) ──────────────────
export async function notifyGoalAchieved(goalLabel: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 Objectif atteint !`,
        body:  `Tu as accompli : ${goalLabel}. Bravo, tu es une machine.`,
        sound: 'default',
        data: { type: 'goal-achieved', goal: goalLabel },
      },
      trigger: null, // immédiat
    });
  } catch {
    // ignore
  }
}

export async function notifyBadgeUnlocked(badgeName: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🏅 Badge débloqué : ${badgeName}`,
        body:  'Tu progresses sérieusement — un nouveau jalon est franchi.',
        sound: 'default',
        data: { type: 'badge-unlocked', badge: badgeName },
      },
      trigger: null,
    });
  } catch {
    // ignore
  }
}

// ── Helper : vérifie l'état et schedule ce qu'il faut ────────────
/**
 * À appeler depuis le _layout au launch.
 * Reschedule les rappels + check streak warning.
 */
export async function refreshAllNotifications(
  prefs: OnboardingPreferences | undefined,
  streak: number,
  lastWorkoutISO: string | undefined,
): Promise<void> {
  const granted = await hasPermission();
  if (!granted) return;

  await scheduleTrainingReminders(prefs);

  if (lastWorkoutISO) {
    const hoursSince = (Date.now() - new Date(lastWorkoutISO).getTime()) / (1000 * 60 * 60);
    await scheduleStreakWarning(streak, hoursSince);
  }
}
