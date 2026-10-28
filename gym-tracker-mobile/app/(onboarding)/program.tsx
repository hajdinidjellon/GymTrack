import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { border, colors, hardShadow } from '@/constants/theme';
import { SPLITS } from '@/domain/programs';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { Choice } from '@/components/ui/Choice';
import { StepHeader } from '@/components/ui/StepHeader';
import type { Goal, SplitId } from '@/types';

const PER_WEEK = [2, 3, 4, 5, 6];

export default function ProgramScreen() {
  const { goal, edit } = useLocalSearchParams<{ goal?: Goal; edit?: string }>();
  const profile = useProfileStore((s) => s.profile);
  const [split, setSplit] = useState<SplitId>(profile?.program.split ?? 'ppl');
  const [perWeek, setPerWeek] = useState(profile?.program.perWeek ?? 3);

  const save = async () => {
    const program = { split, perWeek };
    if (edit && profile) {
      await useProfileStore.getState().updateProfile({ program });
      router.back();
      return;
    }
    await useProfileStore.getState().saveProfile({
      goal: goal ?? 'muscle',
      program,
      prs: profile?.prs ?? [],
      bodyStats: profile?.bodyStats ?? [],
    });
    useSettingsStore.getState().updateSettings({ signedOut: false });
    router.dismissAll();
    router.replace('/(tabs)');
  };

  return (
    <Screen footer={<StickerButton label={edit ? 'Enregistrer' : "C'est parti"} onPress={save} />}>
      <StepHeader step={edit ? undefined : 2} total={edit ? undefined : 2} />
      <Text size={48} weight="black" style={{ marginTop: 26, lineHeight: 54 }}>
        Ton programme
      </Text>
      <Text size={18} color={colors.inkMuted} style={{ marginTop: 10 }}>
        Tu pourras le changer quand tu veux.
      </Text>

      <View accessibilityRole="radiogroup" style={{ gap: 10, marginTop: 24 }}>
        {SPLITS.map((s) => (
          <Choice
            key={s.id}
            selected={split === s.id}
            onPress={() => setSplit(s.id)}
            accessibilityLabel={`${s.title}, ${s.meta}`}
            style={{
              height: 74,
              paddingHorizontal: 22,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text size={21} weight="black">
              {s.title}
            </Text>
            <Text size={16} weight="bold" color={colors.inkMuted}>
              {s.meta}
            </Text>
          </Choice>
        ))}
      </View>

      <Text size={19} weight="black" style={{ marginTop: 28 }}>
        Séances par semaine
      </Text>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}
      >
        {PER_WEEK.map((n) => {
          const on = perWeek === n;
          return (
            <Pressable
              key={n}
              onPress={() => setPerWeek(n)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${n} séances par semaine`}
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.coralSoft : colors.card,
                borderWidth: on ? border.strong : border.base,
                borderColor: colors.ink,
                ...(on ? hardShadow(4) : hardShadow(2)),
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.ink,
                  backgroundColor: colors.paper,
                }}
              >
                <Text size={20} weight="black">
                  {n}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
