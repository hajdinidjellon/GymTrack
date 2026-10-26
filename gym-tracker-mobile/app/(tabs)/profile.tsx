import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';
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
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { FadeIn } from '@/components/ui/FadeIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { StatTile } from '@/components/stats/StatTile';
import { Chip } from '@/components/ui/Chip';
import { Check, ChevronRight } from '@/components/ui/icons';
import { PlateFace } from '@/components/disc/PlateFace';

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
        <StickerCard style={{ gap: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <PlateFace kg={20} size={60} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text size={20} weight="black" numberOfLines={1}>
                {goal?.title ?? 'Ton entraînement'}
              </Text>
              <Text size={14} color={colors.inkMuted} numberOfLines={1}>
                {split ? `${split.title} · ${profile?.program.perWeek}×/semaine` : ''}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <StatTile value={String(stats.sessions)} label={stats.sessions > 1 ? 'séances' : 'séance'} />
            <StatTile value={`${formatKg(Math.round(stats.tonnage / 100) / 10)} t`} label="soulevées" />
            <StatTile value={stats.since ? formatMonth(stats.since) : '—'} label="depuis" />
          </View>
        </StickerCard>
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
          <Row label="Mes séances" value="Exercices et ordre" onPress={() => router.push('/days')} chevron />
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
        <SectionTitle title="Disques de ta salle" right={<Chip tone="sun" label="Touche pour choisir" />} />
        <Text size={14} color={colors.inkMuted} style={{ marginBottom: space.md, lineHeight: 19 }}>
          On s'en sert pour te dire quoi mettre de chaque côté de la barre.
        </Text>
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
                  width: 78,
                  paddingTop: 10,
                  paddingBottom: 8,
                  borderRadius: radius.md,
                  borderCurve: 'continuous',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: on ? colors.card : 'transparent',
                  borderWidth: border.base,
                  borderColor: on ? colors.ink : colors.line,
                  borderStyle: on ? 'solid' : 'dashed',
                  ...(on ? hardShadow(2) : {}),
                }}
              >
                <View>
                  <PlateFace kg={kg} size={56} off={!on} />
                  {on ? (
                    <View
                      style={{
                        position: 'absolute',
                        right: -2,
                        top: -2,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: colors.success,
                        borderWidth: 2,
                        borderColor: colors.ink,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={13} />
                    </View>
                  ) : null}
                </View>
                <Text size={13} weight="black" color={on ? colors.ink : colors.inkFaint}>
                  {formatKg(kg)} kg
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <SectionTitle title="Compte" />
        <StickerCard style={{ gap: space.md }}>
          <Text size={15} color={colors.inkMuted} style={{ lineHeight: 21 }}>
            {signedIn
              ? 'Connecté : tes séances sont sauvegardées dans ton compte.'
              : 'Sans compte : tes séances restent sur ce téléphone.'}
          </Text>
          <StickerButton
            label="Se déconnecter"
            variant="secondary"
            size="small"
            onPress={() => confirmLogout(signedIn)}
          />
        </StickerCard>
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
    <View style={{ borderRadius: radius.card, ...hardShadow(5) }}>
      <View
        style={{
          borderRadius: radius.card,
          borderCurve: 'continuous',
          borderWidth: border.strong,
          borderColor: colors.ink,
          backgroundColor: colors.card,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
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
        borderBottomWidth: last ? 0 : 2,
        borderBottomColor: colors.line,
        backgroundColor: pressed ? colors.coralSoft : 'transparent',
      })}
    >
      <Text size={16} weight="bold">
        {label}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
        <Text
          size={chevron ? 14 : 16}
          weight={chevron ? 'semibold' : 'black'}
          color={chevron ? colors.inkMuted : colors.ink}
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {value}
        </Text>
        {chevron ? <ChevronRight size={18} /> : null}
      </View>
    </Pressable>
  );
}
