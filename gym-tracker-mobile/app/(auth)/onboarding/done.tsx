/**
 * FINAL — CONSTRUCTION (MOBILE_PREMIUM.md storyboard).
 * NEXUS en processing pendant ~3.5s : « Analyse du profil… / Génération du
 * programme… / Calibration des charges… » avec la barre HUD qui se remplit,
 * puis celebrate (flash + haptique success) et révélation du CTA.
 * La persistance du profil (buildProfileFromParams → saveProfile) est inchangée.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { JarvisMascot } from '@/components/mascot/JarvisMascot';
import { BevelButton } from '@/components/ui/hud/BevelButton';
import { ProgressRail } from '@/components/ui/hud/ProgressRail';
import { useProfileStore } from '@/stores/profileStore';
import { calculate1RM } from '@/lib/aiPlanner';
import { parseGoal } from '@/lib/onboardingFlow';
import { hud, hudType } from '@/constants/theme';
import { playSfx } from '@/lib/sfx';
import type {
  UserProfile, PersonalRecord, MuscleGroup, DayOfWeek, TimeOfDay,
  HealthFocus, SportBackground, BodyStats,
} from '@/types';

const SESSION_BG = require('@/assets/images/background-session.png') as number;

const STEP_DURATION = 1200;

type DoneParams = {
  name?: string; goal?: string; level?: string; frequency?: string;
  benchW?: string; benchR?: string;
  squatW?: string; squatR?: string;
  deadW?: string;  deadR?: string;
  muscleFocus?: string; height?: string; weight?: string;
  targetWeight?: string; cardioPerWeek?: string;
  preferredDays?: string; timeOfDay?: string;
  reminderTime?: string; defaultReminder?: string;
  healthFocus?: string; sportBackground?: string;
};

export default function OnboardingDoneScreen() {
  const params = useLocalSearchParams<DoneParams>();
  const name   = (params.name ?? '').trim() || 'pilote';
  const { saveProfile } = useProfileStore();
  const [saving, setSaving] = useState(true);

  const buildSteps = [
    'Analyse du profil…',
    `Génération du programme ${name}…`,
    'Calibration des charges initiales…',
  ];

  // ── Séquence de construction : 3 étapes puis célébration ─────────
  const [stepIdx, setStepIdx] = useState(0);
  const [ready, setReady] = useState(false);

  // Persiste le profil au montage de l'écran
  useEffect(() => {
    const profile = buildProfileFromParams(params);
    saveProfile(profile).catch((err) => {
      console.error('Failed to save profile from onboarding', err);
    }).finally(() => {
      setSaving(false);
    });
  }, []);

  useEffect(() => {
    const stepTick = () => playSfx('processing', 0.35);
    const timers = [
      setTimeout(() => { setStepIdx(1); stepTick(); }, STEP_DURATION),
      setTimeout(() => { setStepIdx(2); stepTick(); }, STEP_DURATION * 2),
      setTimeout(() => {
        setReady(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
        playSfx('celebrate', 0.7);
      }, STEP_DURATION * 3),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = ready ? 1 : (stepIdx + 0.5) / buildSteps.length;

  return (
    <View style={{ flex: 1, backgroundColor: hud.bg.app }}>
      <StatusBar style="light" />

      <ImageBackground
        source={SESSION_BG}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.55 }}
      />
      <LinearGradient
        colors={['rgba(5,11,22,0.30)', 'rgba(5,11,22,0.55)', 'rgba(5,11,22,0.95)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: 28, paddingBottom: 24 }}>

          {/* ── NEXUS : processing → celebrate ──────────── */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <JarvisMascot size={150} mood={ready ? 'celebrate' : 'processing'} />
          </View>

          {/* ── Console de construction ─────────────────── */}
          <View style={{ gap: 10, marginBottom: 28, minHeight: 130 }}>
            <ProgressRail progress={progress} height={6} />

            {buildSteps.map((label, i) => {
              if (!ready && i > stepIdx) return null;
              const doneStep = ready || i < stepIdx;
              return (
                <Animated.View
                  key={label}
                  entering={FadeIn.duration(200)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <Ionicons
                    name={doneStep ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={doneStep ? hud.accent.regen : hud.cyan.bright}
                  />
                  <Text style={[hudType.labelHud, {
                    fontSize: 12,
                    color: doneStep ? hud.text.secondary : hud.cyan.bright,
                  }]}>
                    {label}
                  </Text>
                </Animated.View>
              );
            })}
          </View>

          {/* ── Révélation ──────────────────────────────── */}
          {ready && (
            <Animated.View entering={FadeInDown.duration(350)} style={{ gap: 16 }}>
              <View style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 12, paddingVertical: 4,
                  borderWidth: 1, borderColor: hud.accent.regen,
                  backgroundColor: hud.accent.regenDim,
                }}>
                  <Ionicons name="checkmark-circle" size={13} color={hud.accent.regen} />
                  <Text style={[hudType.labelHud, { color: hud.accent.regen }]}>
                    Programme paré
                  </Text>
                </View>

                <Text style={[hudType.displayTitle, { fontSize: 32, textAlign: 'center', lineHeight: 38 }]}>
                  Tout est prêt,{'\n'}
                  <Text style={{ color: hud.cyan.bright }}>{name}</Text>
                </Text>

                <Text style={[hudType.body, { textAlign: 'center' }]}>
                  Ton copilote a tout ce qu'il faut. Première mission : soulever de la fonte.
                </Text>
              </View>

              <BevelButton
                label={saving ? 'Préparation…' : "Commencer l'entraînement"}
                onPress={() => router.replace('/(tabs)')}
                disabled={saving}
                loading={saving}
                heroChevrons
              />
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Helpers : construction du profil depuis les params d'onboarding ──

function num(raw: string | undefined, fallback = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseLevel(raw: string | undefined): UserProfile['experienceLevel'] {
  if (raw === 'beginner' || raw === 'intermediate' || raw === 'advanced' || raw === 'elite') {
    return raw;
  }
  return 'beginner';
}

function parseMuscles(raw: string | undefined): MuscleGroup[] {
  if (!raw) return [];
  const valid: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'calves'];
  return raw.split(',').filter((m): m is MuscleGroup => valid.includes(m as MuscleGroup));
}

function parseDays(raw: string | undefined): DayOfWeek[] {
  if (!raw) return [];
  const valid: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return raw.split(',').filter((d): d is DayOfWeek => valid.includes(d as DayOfWeek));
}

function parseTimeOfDay(raw: string | undefined): TimeOfDay | undefined {
  if (raw === 'morning' || raw === 'midday' || raw === 'evening') return raw;
  return undefined;
}

function parseHealthFocus(raw: string | undefined): HealthFocus | undefined {
  if (raw === 'strength' || raw === 'mobility' || raw === 'cardio' || raw === 'balanced') return raw;
  return undefined;
}

function parseSportBackground(raw: string | undefined): SportBackground[] {
  if (!raw) return [];
  const valid: SportBackground[] = ['none', 'running', 'cycling', 'swimming', 'team_sport', 'combat', 'racket', 'other'];
  return raw.split(',').filter((s): s is SportBackground => valid.includes(s as SportBackground));
}

function buildPR(exercise: string, weightStr: string | undefined, repsStr: string | undefined): PersonalRecord | null {
  const weight = num(weightStr);
  const reps   = num(repsStr, 5);
  if (weight <= 0 || reps <= 0) return null;
  return {
    exercise,
    weight,
    reps,
    oneRepMax: calculate1RM(weight, reps),
    date: new Date().toISOString(),
  };
}

function buildProfileFromParams(params: DoneParams): UserProfile {
  const goal       = parseGoal(params.goal);
  const today      = new Date().toISOString().slice(0, 10);

  // PRs (peuplés uniquement si renseignés)
  const prs: PersonalRecord[] = [];
  const bench = buildPR('Développé couché', params.benchW, params.benchR);
  const squat = buildPR('Squat',            params.squatW, params.squatR);
  const dead  = buildPR('Soulevé de terre', params.deadW,  params.deadR);
  if (bench) prs.push(bench);
  if (squat) prs.push(squat);
  if (dead)  prs.push(dead);

  // BodyStats (poids actuel renseigné dans weight_loss / hypertrophy)
  const weightKg = num(params.weight);
  const bodyStats: BodyStats[] = weightKg > 0
    ? [{ date: today, weight: weightKg }]
    : [];

  const height = num(params.height, 175);

  return {
    name: (params.name ?? '').trim() || 'Athlète',
    height,
    gender: 'other',
    experienceLevel: parseLevel(params.level),
    prs,
    bodyStats,
    trainingFrequency: num(params.frequency, 3),
    goals: [],
    onboarding: {
      primaryGoal:     goal,
      muscleFocus:     parseMuscles(params.muscleFocus),
      targetWeight:    num(params.targetWeight) || undefined,
      cardioPerWeek:   params.cardioPerWeek !== undefined ? num(params.cardioPerWeek) : undefined,
      preferredDays:   parseDays(params.preferredDays),
      timeOfDay:       parseTimeOfDay(params.timeOfDay),
      reminderTime:    params.reminderTime || undefined,
      healthFocus:     parseHealthFocus(params.healthFocus),
      sportBackground: parseSportBackground(params.sportBackground),
    },
  };
}
