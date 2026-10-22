import React, { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, space } from '@/constants/theme';
import { ALL_PLATES, formatKg } from '@/domain/plates';
import { GOALS, getSplit } from '@/domain/programs';
import { hasSession, signOut } from '@/services/supabase';
import { speak } from '@/services/speech';
import { useProfileStore } from '@/stores/profileStore';
import { REST_CHOICES, useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ChevronRight } from '@/components/ui/icons';
import { plateSize } from '@/components/disc/Barbell';

export default function Profile() {
  const profile = useProfileStore((s) => s.profile);
  const settings = useSettingsStore((s) => s.settings);
  const { updateSettings, togglePlate } = useSettingsStore.getState();
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

  return (
    <Screen tabs scroll>
      <ScreenHeader title="Profil" subtitle="Ton programme et les réglages de ta salle." />

      <SectionTitle title="Entraînement" first />
      <Group>
        <Row
          label="Programme"
          value={profile ? `${getSplit(profile.program.split).title} · ${profile.program.perWeek}×/sem.` : ''}
          onPress={() => router.push({ pathname: '/program', params: { edit: '1' } })}
          chevron
        />
        <Row
          label="Objectif"
          value={GOALS.find((g) => g.id === profile?.goal)?.title ?? ''}
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

      <SectionTitle
        title="Disques de ta salle"
        right={
          <Text size={14} color={colors.muted}>
            pour le calcul par côté
          </Text>
        }
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ALL_PLATES.map((kg) => {
          const on = settings.plates.includes(kg);
          return (
            <Pressable
              key={kg}
              onPress={() => togglePlate(kg)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`Disque de ${formatKg(kg)} kg`}
              style={{
                width: '23.2%',
                height: 74,
                borderRadius: radius.sm + 2,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: on ? colors.surface : 'transparent',
                borderWidth: 2,
                borderStyle: on ? 'solid' : 'dashed',
                borderColor: on ? colors.cream : colors.line,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: plateSize(kg, 0.4).height,
                  borderRadius: 2,
                  backgroundColor: on ? colors.cream : colors.line,
                }}
              />
              <Text size={15} weight="black" color={on ? colors.cream : colors.muted}>
                {formatKg(kg)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="Compte" />
      <Text size={16} color={colors.muted} style={{ marginBottom: space.md, lineHeight: 22 }}>
        {signedIn
          ? 'Connecté : tes séances sont sauvegardées dans ton compte.'
          : 'Sans compte : tes séances restent sur ce téléphone.'}
      </Text>
      <Button
        label="Se déconnecter"
        variant="outline"
        height={56}
        onPress={() => confirmLogout(signedIn)}
        style={{ borderColor: colors.line }}
      />
    </Screen>
  );
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
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} : ${value}`}
      accessibilityHint={hint}
      style={({ pressed }) => ({
        height: 62,
        gap: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
        backgroundColor: pressed ? colors.line : 'transparent',
      })}
    >
      <Text size={18} weight="bold">
        {label}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
        <Text
          size={chevron ? 16 : 18}
          weight={chevron ? 'semibold' : 'black'}
          color={chevron ? colors.muted : colors.cream}
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {value}
        </Text>
        {chevron ? <ChevronRight size={18} color={colors.muted} /> : null}
      </View>
    </Pressable>
  );
}
