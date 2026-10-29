import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '@/constants/theme';
import { dayKey, getSplit, programDays } from '@/domain/programs';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { BackButton } from '@/components/ui/BackButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { Chip } from '@/components/ui/Chip';
import { FadeIn } from '@/components/ui/FadeIn';
import { Text } from '@/components/ui/Text';
import { ChevronRight } from '@/components/ui/icons';

/** Every session of the program, to set up its exercises ahead of time. */
export default function DaysScreen() {
  const split = useProfileStore((s) => s.profile?.program.split);
  const customDays = useSettingsStore((s) => s.settings.customDays);
  const own = useSettingsStore((s) => s.settings.customExercises);
  if (!split) return null;
  const days = programDays(split, customDays, own);

  return (
    <Screen scroll>
      <BackButton />
      <ScreenHeader
        eyebrow={getSplit(split).title}
        title="Mes séances"
        subtitle="Choisis les exercices de chaque séance et leur ordre. Le reste, on le calcule."
      />
      <View style={{ gap: 12 }}>
        {days.map((day, i) => {
          const custom = dayKey(split, day.name) in customDays;
          return (
            <FadeIn key={day.name} index={i + 1}>
              <PressableScale
                haptic="selection"
                onPress={() => router.push({ pathname: '/days/[name]', params: { name: day.name } })}
                accessibilityRole="button"
                accessibilityLabel={`Modifier la séance ${day.name}, ${day.exercises.length} exercices`}
              >
                <StickerCard small style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text size={20} weight="black">
                        {day.name}
                      </Text>
                      {custom ? <Chip tone="sun" label="Perso" /> : null}
                    </View>
                    <Text size={14} color={colors.inkMuted} numberOfLines={2} style={{ lineHeight: 19 }}>
                      {day.exercises.length
                        ? day.exercises.map((e) => e.name).join(' · ')
                        : 'Aucun exercice pour l’instant'}
                    </Text>
                  </View>
                  <ChevronRight size={20} />
                </StickerCard>
              </PressableScale>
            </FadeIn>
          );
        })}
      </View>
      <Text size={13} color={colors.inkFaint} align="center" style={{ marginTop: space.lg }}>
        Pour changer de programme (Push · Pull · Legs, Haut · Bas…), va dans Profil → Programme.
      </Text>
    </Screen>
  );
}
