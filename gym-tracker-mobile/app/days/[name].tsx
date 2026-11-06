import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { border, colors, space } from '@/constants/theme';
import { choosableDays, dayKey, equipmentShown, ruleFor, withOverride, type ExerciseDef } from '@/domain/programs';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { BackButton } from '@/components/ui/BackButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { IndexBadge } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { DayExercisesEditor } from '@/components/program/DayExercisesEditor';
import { DayNameForm } from '@/components/program/DayNameForm';
import { checkDayName } from '@/domain/ownDays';
import { dayName, exerciseName, t } from '@/i18n';
import { useLocale } from '@/hooks/useLocale';

/** One session of the program: its exercises, their order, sets and reps. */
export default function DayScreen() {
  useLocale();
  const { name } = useLocalSearchParams<{ name: string }>();
  const profile = useProfileStore((s) => s.profile);
  const customDays = useSettingsStore((s) => s.settings.customDays);
  const own = useSettingsStore((s) => s.settings.customExercises);
  const ownDays = useSettingsStore((s) => s.settings.ownDays);
  const supersets = useSettingsStore((s) => s.settings.supersets);
  const toggleSuperset = useSettingsStore((s) => s.toggleSuperset);
  const [dragging, setDragging] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const renameOwnDay = useSettingsStore((s) => s.renameOwnDay);
  const removeOwnDay = useSettingsStore((s) => s.removeOwnDay);
  if (!profile) return null;

  // Une séance hors programme se règle aussi, sous son propre programme
  const day = choosableDays(profile.program.split, customDays, own, ownDays).find((d) => d.name === name);
  if (!day) {
    return (
      <Screen>
        <BackButton />
        <Text size={20} style={{ marginTop: 20 }}>
          {t('program.day.notFound')}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll scrollEnabled={!dragging}>
      <BackButton />
      <ScreenHeader eyebrow={t('program.days.title')} title={dayName(day.name)} subtitle={t('program.day.subtitle')} />
      {day.own && renaming ? (
        <View style={{ marginBottom: space.md }}>
          <DayNameForm
            initial={day.name}
            submitLabel={t('program.create.save')}
            onCancel={() => setRenaming(false)}
            onSubmit={(typed) => {
              const checked = checkDayName(typed, day.split, useSettingsStore.getState().settings, day.name);
              if (typeof checked !== 'string') return checked.error;
              renameOwnDay(day.split, day.name, checked);
              setRenaming(false);
              router.setParams({ name: checked });
              return null;
            }}
          />
        </View>
      ) : day.own ? (
        <View style={{ flexDirection: 'row', gap: space.lg, marginBottom: space.md }}>
          <Link label={t('program.days.rename')} onPress={() => setRenaming(true)} />
          <Link
            label={t('program.days.remove')}
            onPress={() =>
              Alert.alert(t('program.days.removeTitle', { name: day.name }), t('program.days.removeText'), [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('program.days.removeConfirm'),
                  style: 'destructive',
                  onPress: () => {
                    removeOwnDay(day.split, day.name);
                    router.back();
                  },
                },
              ])
            }
          />
        </View>
      ) : null}
      <DayExercisesEditor
        split={day.split}
        day={day}
        items={day.exercises}
        keyOf={(def) => def.name}
        onDragChange={setDragging}
        renderRow={(def, i, remove) => {
          const key = dayKey(day.split, day.name);
          const next = day.exercises[i + 1];
          return (
            <ExerciseRow
              def={def}
              index={i}
              goal={profile.goal}
              onRemove={remove}
              next={next ? exerciseName(next.name) : undefined}
              linked={!!next && (supersets[key] ?? []).includes(def.name)}
              onLink={() => toggleSuperset(key, def.name)}
            />
          );
        }}
      />
    </Screen>
  );
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <Text size={15} weight="bold" style={{ textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function ExerciseRow({
  def,
  index,
  goal,
  onRemove,
  next,
  linked,
  onLink,
}: {
  def: ExerciseDef;
  index: number;
  goal: Parameters<typeof ruleFor>[0];
  onRemove: () => void;
  /** The exercise after this one, shown: it can be chained with it as a superset. Last: none. */
  next?: string;
  linked: boolean;
  onLink: () => void;
}) {
  const override = useSettingsStore((s) => s.settings.ruleOverrides[def.name]);
  const rule = withOverride(ruleFor(goal, def, 0), override);
  const label = exerciseName(def.name);

  return (
    <PressableScale
      haptic="selection"
      onPress={() => router.push({ pathname: '/exercise/[name]', params: { name: def.name } })}
      accessibilityRole="button"
      accessibilityLabel={t('program.day.rowA11y', {
        name: label,
        sets: t('common.sets', { count: rule.sets }),
        min: rule.repMin,
        max: rule.repMax,
      })}
    >
      <StickerCard small style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IndexBadge value={index + 1} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text size={16} weight="black" numberOfLines={1}>
            {label}
          </Text>
          <Text size={14} weight="semibold" color={colors.inkMuted} numberOfLines={1}>
            {t('program.day.rowDetail', {
              equipment: t(`program.equipment.${equipmentShown(def)}`),
              sets: rule.sets,
              min: rule.repMin,
              max: rule.repMax,
            })}
            {override ? t('program.day.custom') : ''}
          </Text>
        </View>
        {next ? (
          <Pressable
            onPress={onLink}
            accessibilityRole="switch"
            accessibilityState={{ checked: linked }}
            accessibilityLabel={t('program.day.linkA11y', { name: label, next })}
            hitSlop={6}
            style={({ pressed }) => ({
              height: 32,
              paddingHorizontal: 10,
              borderRadius: 16,
              borderWidth: border.base - 0.5,
              borderColor: linked ? colors.outlineStrong : colors.line,
              borderStyle: linked ? 'solid' : 'dashed',
              backgroundColor: linked || pressed ? colors.coralSoft : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text size={13} weight="black" color={linked ? colors.ink : colors.inkMuted}>
              {linked ? t('program.day.linked') : t('program.day.link')}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={t('program.day.remove', { name: label })}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: border.base - 0.5,
            borderColor: colors.outline,
            backgroundColor: pressed ? colors.coralSoft : colors.card,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text size={14} weight="black">
            ✕
          </Text>
        </Pressable>
      </StickerCard>
    </PressableScale>
  );
}
