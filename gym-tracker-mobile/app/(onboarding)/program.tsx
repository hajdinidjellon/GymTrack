import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/theme';
import { SPLITS } from '@/lib/programs';
import { useProfileStore } from '@/stores/profileStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { StepHeader } from '@/components/ui/StepHeader';
import type { Goal, SplitId } from '@/types';

const PER_WEEK = [2, 3, 4, 5];

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
    router.dismissAll();
    router.replace('/(tabs)');
  };

  return (
    <Screen footer={<Button label={edit ? 'Enregistrer' : "C'est parti"} onPress={save} />}>
      <StepHeader step={edit ? undefined : 2} total={edit ? undefined : 2} />
      <Text size={52} weight="black" style={{ marginTop: 26, lineHeight: 52 }}>Ton programme</Text>
      <Text size={18} color={colors.muted} style={{ marginTop: 10 }}>Tu pourras le changer quand tu veux.</Text>

      <View accessibilityRole="radiogroup" style={{ gap: 10, marginTop: 24 }}>
        {SPLITS.map((s) => (
          <Choice
            key={s.id}
            selected={split === s.id}
            onPress={() => setSplit(s.id)}
            accessibilityLabel={`${s.title}, ${s.meta}`}
            style={{ height: 74, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text size={21} weight="black">{s.title}</Text>
            <Text size={16} weight="bold" color={colors.muted}>{s.meta}</Text>
          </Choice>
        ))}
      </View>

      <Text size={17} weight="bold" style={{ marginTop: 28 }}>Séances par semaine</Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
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
                width: 74,
                height: 74,
                borderRadius: 37,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.cream : 'transparent',
                borderWidth: on ? 0 : 8,
                borderColor: colors.line,
              }}
            >
              <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.bg : colors.surface }}>
                <Text size={20} weight="black">{n}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
