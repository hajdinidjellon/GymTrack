import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { colors, radius, space } from '@/constants/theme';
import { ALL_PLATES, formatKg } from '@/domain/plates';
import { GOALS, getSplit } from '@/domain/programs';
import { totals } from '@/domain/stats';
import { hasSession, signOut } from '@/services/supabase';
import { speak } from '@/services/speech';
import { useProfileStore } from '@/stores/profileStore';
import { REST_CHOICES, useSettingsStore } from '@/stores/settingsStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FadeIn } from '@/components/ui/FadeIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { StatTile } from '@/components/stats/StatTile';
import { ChevronRight } from '@/components/ui/icons';
import { plateSize } from '@/components/disc/Barbell';

export default function Profile() {
  const profile = useProfileStore((s) => s.profile);
  const settings = useSettingsStore((s) => s.settings);
  const { updateSettings, togglePlate } = useSettingsStore.getState();
  const workouts = useWorkoutStore((s) => s.workouts);
  const stats = useMemo(() => totals(workouts), [workouts]);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    hasSession()
      .then(setSignedIn)
      .catch(() => null);
  }, []);

  const nextRest = () => {
    const i = REST_CHOICES.indexOf(settings.defaultRestTime);
    updateSettings({ defaultRestTime: REST_CHOICES[(i + 1) % REST_CHOICES.length]! });
  };

  const toggleVoice = () => {
    const voice = !settings.voice;
    updateSettings({ voice });
    if (voice) speak('Voix activée. Je te dirai quoi charger.');
  };

  const goal = GOALS.find((g) => g.id === profile?.goal);
  const split = profile ? getSplit(profile.program.split) : null;

  return (
    <Screen tabs scroll>
      <FadeIn>
        <ScreenHeader title="Profil" subtitle="Ton programme et les réglages de ta salle." />
      </FadeIn>

      <FadeIn index={1}>
        <Card style={{ gap: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                borderWidth: 6,
                borderColor: colors.cream,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.brass }} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text size={20} weight="black" numberOfLines={1}>
                {goal?.title ?? 'Ton entraînement'}
              </Text>
              <Text size={14} color={colors.muted} numberOfLines={1}>
                {split ? `${split.title} · ${profile?.program.perWeek}×/semaine` : ''}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <StatTile value={String(stats.sessions)} label={stats.sessions > 1 ? 'séances' : 'séance'} />
            <StatTile value={`${formatKg(Math.round(stats.tonnage / 100) / 10)} t`} label="soulevées" />
            <StatTile value={stats.since ? formatMonth(stats.since) : '—'} label="depuis" />
          </View>
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <SectionTitle title="Entraînement" />
        <Group>
          <Row
            label="Programme"
            value={split ? `${split.title} · ${profile?.program.perWeek}×` : ''}
            onPress={() => router.push({ pathname: '/program', params: { edit: '1' } })}
            chevron
          />
          <Row
            label="Objectif"
            value={goal?.title ?? ''}
            onPress={() => router.push({ pathname: '/goal', params: { edit: '1' } })}
            chevron
            last
          />
        </Group>

        <SectionTitle title="Pendant la séance" />
        <Group>
          <Row
            label="Repos par défaut"
            value={`${settings.defaultRestTime} s`}
            onPress={nextRest}
            hint="Touche pour changer"
          />
          <Row
            label="Voix"
            value={settings.voice ? 'Activée' : 'Coupée'}
            onPress={toggleVoice}
            hint="Touche pour changer"
            last
          />
        </Group>
      </FadeIn>

      <FadeIn index={3}>
        <SectionTitle
          title="Disques de ta salle"
          right={
            <Text size={13} color={colors.faint}>
              pour le calcul par côté
            </Text>
          }
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ALL_PLATES.map((kg) => {
            const on = settings.plates.includes(kg);
            return (
              <PressableScale
                key={kg}
                haptic="selection"
                onPress={() => togglePlate(kg)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`Disque de ${formatKg(kg)} kg`}
                style={{
                  width: 72,
                  height: 68,
                  borderRadius: radius.sm,
                  borderCurve: 'continuous',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: on ? colors.surface : 'transparent',
                  borderWidth: 1.5,
                  borderStyle: on ? 'solid' : 'dashed',
                  borderColor: on ? colors.cream : colors.line,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: plateSize(kg, 0.34).height,
                    borderRadius: 2,
                    backgroundColor: on ? colors.cream : colors.line,
                  }}
                />
                <Text size={14} weight="black" color={on ? colors.cream : colors.faint}>
                  {formatKg(kg)}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <SectionTitle title="Compte" />
        <Card style={{ gap: space.md }}>
          <Text size={15} color={colors.muted} style={{ lineHeight: 21 }}>
            {signedIn
              ? 'Connecté : tes séances sont sauvegardées dans ton compte.'
              : 'Sans compte : tes séances restent sur ce téléphone.'}
          </Text>
          <Button label="Se déconnecter" variant="outline" height={52} onPress={() => confirmLogout(signedIn)} />
        </Card>
      </FadeIn>
    </Screen>
  );
}

/** "oct. 26" */
function formatMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR', { month: 'short' })} ${String(d.getFullYear()).slice(2)}`;
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ borderRadius: radius.md + 2, backgroundColor: colors.surface, overflow: 'hidden' }}>{children}</View>
  );
}

/** Back to the login page. Workouts stay on the phone, nothing is deleted. */
function confirmLogout(signedIn: boolean) {
  const message = signedIn
    ? 'Tes séances sont sauvegardées dans ton compte.'
    : "Tu n'as pas de compte : tes séances restent sur ce téléphone.";
  Alert.alert('Se déconnecter ?', message, [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Se déconnecter',
      style: 'destructive',
      onPress: async () => {
        if (signedIn) await signOut().catch(() => null);
        useSettingsStore.getState().updateSettings({ signedOut: true });
        router.replace('/login');
      },
    },
  ]);
}

interface RowProps {
  label: string;
  value: string;
  onPress: () => void;
  chevron?: boolean;
  last?: boolean;
  hint?: string;
}

function Row({ label, value, onPress, chevron, last, hint }: RowProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => null);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label} : ${value}`}
      accessibilityHint={hint}
      style={({ pressed }) => ({
        height: 56,
        gap: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
        backgroundColor: pressed ? colors.surfaceHigh : 'transparent',
      })}
    >
      <Text size={16} weight="bold">
        {label}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
        <Text
          size={chevron ? 14 : 16}
          weight={chevron ? 'semibold' : 'black'}
          color={chevron ? colors.muted : colors.cream}
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {value}
        </Text>
        {chevron ? <ChevronRight size={16} color={colors.faint} /> : null}
      </View>
    </Pressable>
  );
}
