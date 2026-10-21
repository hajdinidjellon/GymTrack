import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius } from '@/constants/theme';
import { ALL_PLATES, formatKg } from '@/lib/plates';
import { GOALS, getSplit } from '@/lib/programs';
import { isSupabaseConfigured, signOut, supabase } from '@/lib/supabase';
import { speak } from '@/lib/voice';
import { useProfileStore } from '@/stores/profileStore';
import { REST_CHOICES, useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
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
    if (!isSupabaseConfigured()) return;
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)).catch(() => null);
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
      <Text size={40} weight="black" style={{ marginTop: 12 }}>Profil</Text>

      <View style={{ marginTop: 20, borderRadius: radius.md + 2, backgroundColor: colors.surface, overflow: 'hidden' }}>
        <Row label="Programme" value={profile ? getSplit(profile.program.split).title : ''} onPress={() => router.push({ pathname: '/program', params: { edit: '1' } })} chevron />
        <Row label="Objectif" value={GOALS.find((g) => g.id === profile?.goal)?.title ?? ''} onPress={() => router.push({ pathname: '/goal', params: { edit: '1' } })} chevron />
        <Row label="Repos par défaut" value={`${settings.defaultRestTime} s`} onPress={nextRest} hint="Touche pour changer" />
        <Row label="Voix pendant la séance" value={settings.voice ? 'Oui' : 'Non'} onPress={toggleVoice} last />
      </View>

      <View style={{ marginTop: 22, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text size={17} weight="bold">Disques de ta salle</Text>
        <Text size={14} weight="semibold" color={colors.muted}>pour le calcul par côté</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
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
              <View style={{ width: 8, height: plateSize(kg, 0.4).height, borderRadius: 2, backgroundColor: on ? colors.cream : colors.line }} />
              <Text size={15} weight="black" color={on ? colors.cream : colors.muted}>{formatKg(kg)}</Text>
            </Pressable>
          );
        })}
      </View>

      {signedIn ? (
        <Button
          label="Se déconnecter"
          variant="outline"
          height={56}
          onPress={() => signOut().then(() => setSignedIn(false))}
          style={{ marginTop: 18, borderColor: colors.line }}
        />
      ) : null}
    </Screen>
  );
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
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
        backgroundColor: pressed ? colors.line : 'transparent',
      })}
    >
      <Text size={18} weight="bold">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text size={chevron ? 16 : 18} weight={chevron ? 'semibold' : 'black'} color={chevron ? colors.muted : colors.cream}>{value}</Text>
        {chevron ? <ChevronRight size={18} color={colors.muted} /> : null}
      </View>
    </Pressable>
  );
}
