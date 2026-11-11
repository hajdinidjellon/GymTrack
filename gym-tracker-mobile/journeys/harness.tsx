/**
 * The bench the journeys run on: the real screens and the real navigation (expo-router's
 * renderRouter), the stores seeded like a phone, every tap, typed letter, screen and sheet
 * counted. Each journey writes its numbers to journeys/results/, read by report.ts.
 *
 * Time is estimated with the Keystroke-Level Model adapted to a phone (see TIME): it says how
 * long an experienced user takes, not how long a first-timer hesitates.
 */
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, fireEvent, renderRouter, screen, type RenderRouterResult } from 'expo-router/testing-library';
import OnboardingLayout from '@/app/(onboarding)/_layout';
import Forgot from '@/app/(onboarding)/forgot';
import Goal from '@/app/(onboarding)/goal';
import Login from '@/app/(onboarding)/login';
import Program from '@/app/(onboarding)/program';
import RecoveryCode from '@/app/(onboarding)/recovery-code';
import Setup from '@/app/(onboarding)/setup';
import Welcome from '@/app/(onboarding)/welcome';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Profile from '@/app/(tabs)/profile';
import Progress from '@/app/(tabs)/progress';
import Account from '@/app/account/index';
import Data from '@/app/data/index';
import Day from '@/app/days/[name]';
import Days from '@/app/days/index';
import Exercise from '@/app/exercise/[name]';
import HistoryDetail from '@/app/history/[id]';
import History from '@/app/history/index';
import Privacy from '@/app/privacy/index';
import SessionScreen from '@/app/session/index';
import AppSettingsScreen from '@/app/settings/app';
import GymSettingsScreen from '@/app/settings/gym';
import Preview from '@/app/session/preview';
import Summary from '@/app/session/summary';
import { DEFAULT_SETTINGS } from '@/domain/settings';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { AppSettings, UserProfile, Workout } from '@/types';

export const ROUTES = {
  '(onboarding)/_layout': OnboardingLayout,
  '(onboarding)/welcome': Welcome,
  '(onboarding)/setup': Setup,
  '(onboarding)/login': Login,
  '(onboarding)/forgot': Forgot,
  '(onboarding)/goal': Goal,
  '(onboarding)/program': Program,
  '(onboarding)/recovery-code': RecoveryCode,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/profile': Profile,
  '(tabs)/progress': Progress,
  'account/index': Account,
  'data/index': Data,
  'days/index': Days,
  'days/[name]': Day,
  'exercise/[name]': Exercise,
  'history/index': History,
  'history/[id]': HistoryDetail,
  'privacy/index': Privacy,
  'settings/gym': GymSettingsScreen,
  'settings/app': AppSettingsScreen,
  'session/preview': Preview,
  'session/index': SessionScreen,
  'session/summary': Summary,
};

/**
 * Seconds per action, from the Keystroke-Level Model (Card, Moran & Newell), phone values:
 * a tap is pointing plus touching (~0.4 s), a letter on a phone keyboard ~0.3 s, and every
 * new screen or sheet costs a moment to read it and decide (the model's "M", 1.35 s).
 */
export const TIME = { tap: 0.4, letter: 0.3, think: 1.35 } as const;

export interface JourneyResult {
  id: string;
  title: string;
  /** The group it belongs to in the report. */
  group: string;
  taps: number;
  letters: number;
  /** Screens reached plus sheets opened: each one read before acting. */
  views: number;
  seconds: number;
  steps: string[];
  /** What could make it shorter, written while running it. */
  notes: string[];
}

export const PROFILE: UserProfile = {
  goal: 'muscle',
  program: { split: 'fb', perWeek: 3 },
  experience: 'months',
  sessionMinutes: 60,
  prs: [],
  bodyStats: [],
};

export function seed({
  profile = PROFILE,
  settings = {},
  workouts = [],
}: { profile?: UserProfile | null; settings?: Partial<AppSettings>; workouts?: Workout[] } = {}) {
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, warmups: false, ...settings }, isLoaded: true });
  useProfileStore.setState({ profile });
  useWorkoutStore.setState({ workouts });
  useSessionStore.getState().discardSession();
}

type Role = 'button' | 'radio' | 'link' | 'checkbox' | 'switch' | 'tab';

export class Journey {
  private taps = 0;
  private letters = 0;
  private views = 1;
  private steps: string[] = [];
  private notes: string[] = [];
  private router!: RenderRouterResult;
  private path = '';

  constructor(
    readonly id: string,
    readonly title: string,
    readonly group: string,
  ) {}

  async open(url: string) {
    // The app's root puts the gesture root around everything (drag to reorder, swipe a set)
    this.router = await renderRouter(ROUTES, {
      initialUrl: url,
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>
      ),
    });
    this.path = this.router.getPathname();
    this.steps.push(`écran ${this.path}`);
    return this;
  }

  get pathname() {
    return this.router.getPathname();
  }

  /** After an action: a new screen is one more thing to read. */
  private moved() {
    const now = this.router.getPathname();
    if (now !== this.path) {
      this.views++;
      this.steps.push(`→ écran ${now}`);
      this.path = now;
    }
  }

  /** A tap on what a person would tap: by role and name, else by visible text. */
  async tap(name: string | RegExp, role: Role = 'button') {
    const target = screen.queryAllByRole(role, { name })[0] ?? screen.getAllByText(name)[0]!;
    await fireEvent.press(target);
    this.taps++;
    this.steps.push(`tap « ${String(name)} »`);
    this.moved();
  }

  async longPress(label: string | RegExp) {
    await fireEvent(screen.getByLabelText(label), 'longPress');
    this.taps++;
    this.steps.push(`appui long « ${String(label)} »`);
  }

  /** Typing in a field: one tap to focus it, then each letter. */
  async type(label: string | RegExp, text: string) {
    await fireEvent.changeText(screen.getByLabelText(label), text);
    this.taps++;
    this.letters += text.length;
    this.steps.push(`saisie « ${text} » dans ${String(label)}`);
  }

  /** A new step on the same screen (the next onboarding question): read before acting. */
  view(name: string) {
    this.views++;
    this.steps.push(`vue « ${name} »`);
  }

  /** A sheet or popup opens: read before the next tap. */
  sheet(name: string) {
    this.views++;
    this.steps.push(`fenêtre « ${name} »`);
  }

  /** The rest runs out: the popup closes by itself, nothing to tap (the clock is not moved). */
  async restEnds() {
    await act(() => useSessionStore.getState().stopRestTimer());
    this.steps.push('(repos écoulé)');
  }

  /** A short pause on the fake clock (a sheet waiting for the previous one to slide away). */
  async pause(ms = 600) {
    await act(() => jest.advanceTimersByTime(ms));
  }

  note(text: string) {
    this.notes.push(text);
  }

  result(): JourneyResult {
    const seconds = this.taps * TIME.tap + this.letters * TIME.letter + this.views * TIME.think;
    return {
      id: this.id,
      title: this.title,
      group: this.group,
      taps: this.taps,
      letters: this.letters,
      views: this.views,
      seconds: Math.round(seconds * 10) / 10,
      steps: this.steps,
      notes: this.notes,
    };
  }

  /** Writes the numbers for the report and returns them for the test's own limits. */
  save(): JourneyResult {
    const r = this.result();
    const dir = join(__dirname, 'results');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${r.id}.json`), JSON.stringify(r, null, 2));
    return r;
  }
}

export { screen };
