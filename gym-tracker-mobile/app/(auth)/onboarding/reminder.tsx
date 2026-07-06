import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { Stepper } from '@/components/onboarding/Stepper';
import { HudCard } from '@/components/ui/hud';
import { getTotalSteps, parseGoal } from '@/lib/onboardingFlow';
import { hud, hudType } from '@/constants/theme';

function parseHHmm(raw: string | undefined, fallback: { h: number; m: number }) {
  if (!raw) return fallback;
  const [hStr, mStr] = raw.split(':');
  const h = Number(hStr); const m = Number(mStr);
  if (Number.isFinite(h) && Number.isFinite(m)) return { h, m };
  return fallback;
}

export default function OnboardingReminderScreen() {
  const params = useLocalSearchParams<{
    name: string; goal: string; level: string; frequency: string;
    preferredDays: string; timeOfDay: string; defaultReminder: string;
  }>();
  const total = getTotalSteps(parseGoal(params.goal));

  const defaults = parseHHmm(params.defaultReminder, { h: 7, m: 0 });
  const [hour,   setHour]   = useState(defaults.h);
  const [minute, setMinute] = useState(defaults.m);

  const formatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <OnboardingFrame
      question="Quand veux-tu être rappelé ?"
      subtext="Une petite notification pour ne pas oublier ta séance."
      step={7}
      total={total}
      canContinue={true}
      skipLabel="Pas de rappel"
      onSkip={() => router.push({
        pathname: '/(auth)/onboarding/connect',
        params: { ...params, reminderTime: '' },
      })}
      onContinue={() => router.push({
        pathname: '/(auth)/onboarding/connect',
        params: { ...params, reminderTime: formatted },
      })}
    >
      {/* Aperçu de l'heure */}
      <HudCard level="g1" cut={hud.cut.md} padding={0}>
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 18 }}>
          <Text style={{
            fontFamily: 'Rajdhani-Bold', fontSize: 48,
            color: hud.cyan.bright, fontVariant: ['tabular-nums'],
            letterSpacing: 1,
          }}>
            {formatted}
          </Text>
          <Text style={{ ...hudType.labelHud, marginTop: 2 }}>
            Tous les jours d'entraînement
          </Text>
        </View>
      </HudCard>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stepper value={hour}   onChange={setHour}   min={0} max={23} step={1}  label="Heure"   unit="h"   />
        <Stepper value={minute} onChange={setMinute} min={0} max={45} step={15} label="Minutes" unit="min" />
      </View>

      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: hud.bg.surfaceDeep,
        borderWidth: 1, borderColor: hud.border.hairline,
        borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16,
        marginTop: 4,
      }}>
        <Ionicons name="notifications-outline" size={16} color={hud.text.muted} />
        <Text style={{
          flex: 1, fontFamily: 'Rajdhani-Medium', fontSize: 13,
          color: hud.text.secondary, lineHeight: 18,
        }}>
          Tu pourras modifier ce rappel à tout moment depuis les paramètres.
        </Text>
      </View>
    </OnboardingFrame>
  );
}
