import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { border, colors, radius, space } from '@/constants/theme';
import { checkDayName } from '@/domain/ownDays';
import { DayNameForm } from '@/components/program/DayNameForm';
import { dayKey, programDays, programTitle } from '@/domain/programs';
import { useProfileStore } from '@/stores/profileStore';
import { SETTINGS_LIMITS } from '@/domain/schemas';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StickerCard } from '@/components/ui/StickerCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { Chip } from '@/components/ui/Chip';
import { FadeIn } from '@/components/ui/FadeIn';
import { Text } from '@/components/ui/Text';
import { ChevronRight } from '@/components/ui/icons';
import { dayName, exerciseName, t } from '@/i18n';
import { useLocale } from '@/hooks/useLocale';

/** Every session of the program, to set up its exercises ahead of time. */
export default function DaysScreen() {
  useLocale();
  const split = useProfileStore((s) => s.profile?.program.split);
  const customDays = useSettingsStore((s) => s.settings.customDays);
  const own = useSettingsStore((s) => s.settings.customExercises);
  const ownDays = useSettingsStore((s) => s.settings.ownDays);
  const programName = useSettingsStore((s) => s.settings.programName);
  const addOwnDay = useSettingsStore((s) => s.addOwnDay);
  const [adding, setAdding] = useState(false);
  if (!split) return null;
  const days = programDays(split, customDays, own, ownDays);

  return (
    <Screen scroll>
      <ScreenHeader
        back
        eyebrow={programTitle(split, programName)}
        title={t('program.days.title')}
        subtitle={t('program.days.subtitle')}
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
                accessibilityLabel={t('program.days.editA11y', {
                  day: dayName(day.name),
                  exercises: t('common.exercises', { count: day.exercises.length }),
                })}
              >
                <StickerCard small style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text size={20} weight="black">
                        {dayName(day.name)}
                      </Text>
                      {custom && !day.own ? <Chip tone="sun" label={t('program.days.custom')} /> : null}
                    </View>
                    <Text size={14} color={colors.inkMuted} numberOfLines={2} style={{ lineHeight: 19 }}>
                      {day.exercises.length
                        ? day.exercises.map((e) => exerciseName(e.name)).join(' · ')
                        : t('program.days.empty')}
                    </Text>
                  </View>
                  <ChevronRight size={20} />
                </StickerCard>
              </PressableScale>
            </FadeIn>
          );
        })}
      </View>
      <View style={{ marginTop: space.md }}>
        {(ownDays[split]?.length ?? 0) >= SETTINGS_LIMITS.ownDays ? (
          <Text size={14} color={colors.inkMuted} align="center">
            {t('program.days.full', { max: SETTINGS_LIMITS.ownDays })}
          </Text>
        ) : adding ? (
          <DayNameForm
            submitLabel={t('program.days.create')}
            onCancel={() => setAdding(false)}
            onSubmit={(typed) => {
              const checked = checkDayName(typed, split, useSettingsStore.getState().settings);
              if (typeof checked !== 'string') return checked.error;
              addOwnDay(split, checked);
              setAdding(false);
              router.push({ pathname: '/days/[name]', params: { name: checked } });
              return null;
            }}
          />
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              minHeight: 56,
              borderRadius: radius.row,
              borderWidth: border.base,
              borderStyle: 'dashed',
              borderColor: pressed ? colors.outlineStrong : colors.outlineSoft,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text size={16} weight="bold" color={colors.inkMuted}>
              {t('program.days.add')}
            </Text>
          </Pressable>
        )}
      </View>
      <Text size={13} color={colors.inkFaint} align="center" style={{ marginTop: space.lg }}>
        {t('program.days.changeProgram')}
      </Text>
    </Screen>
  );
}
