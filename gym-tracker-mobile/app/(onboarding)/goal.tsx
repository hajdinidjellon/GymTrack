import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/theme';
import { GOALS } from '@/domain/programs';
import { useProfileStore } from '@/stores/profileStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import { StepHeader } from '@/components/ui/StepHeader';
import { Barbell } from '@/components/disc/Barbell';
import type { Goal } from '@/types';

export default function GoalScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const profile = useProfileStore((s) => s.profile);
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'muscle');

  const next = async () => {
    if (edit) {
      await useProfileStore.getState().updateProfile({ goal });
      router.back();
    } else {
      router.push({ pathname: '/program', params: { goal } });
    }
  };

  return (
    <Screen footer={<Button label={edit ? 'Enregistrer' : 'Continuer'} onPress={next} />}>
      <StepHeader step={edit ? undefined : 1} total={edit ? undefined : 2} />
      <Text size={52} weight="black" style={{ marginTop: 26, lineHeight: 52 }}>
        Ton objectif ?
      </Text>
      <Text size={18} color={colors.muted} style={{ marginTop: 10 }}>
        On règle tes séries et tes reps en fonction.
      </Text>

      <View accessibilityRole="radiogroup" style={{ gap: 12, marginTop: 28 }}>
        {GOALS.map((g) => (
          <Choice
            key={g.id}
            selected={goal === g.id}
            onPress={() => setGoal(g.id)}
            accessibilityLabel={`${g.title}, ${g.sub}`}
            style={{
              minHeight: 96,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <View
              style={{
                width: 96,
                height: 64,
                borderRadius: 18,
                backgroundColor: colors.bg,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Barbell perSide={g.plates} scale={0.44} barWidth={26} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text size={21} weight="black">
                {g.title}
              </Text>
              <Text size={16} weight="semibold" color={colors.muted}>
                {g.sub}
              </Text>
            </View>
          </Choice>
        ))}
      </View>
    </Screen>
  );
}
