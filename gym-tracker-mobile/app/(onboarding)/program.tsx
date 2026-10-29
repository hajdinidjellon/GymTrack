import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { border, colors, hardShadow } from '@/constants/theme';
import { getSplit, SPLITS } from '@/domain/programs';
import { defaultSchedule, trainingCount, validSchedule, WEEKDAY_NAMES, type Schedule } from '@/domain/schedule';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { Choice } from '@/components/ui/Choice';
import { StepHeader } from '@/components/ui/StepHeader';
import type { Goal, SplitId } from '@/types';
import { resetTo } from '@/components/navigation/resetTo';

const PER_WEEK = [2, 3, 4, 5, 6];

export default function ProgramScreen() {
  const { goal, edit } = useLocalSearchParams<{ goal?: Goal; edit?: string }>();
  const profile = useProfileStore((s) => s.profile);
  const [split, setSplit] = useState<SplitId>(profile?.program.split ?? 'ppl');
  const [perWeek, setPerWeek] = useState(profile?.program.perWeek ?? 3);
  const names = getSplit(split).days.map((d) => d.name);
  const saved = validSchedule(profile?.program.schedule, names);
  const [fixed, setFixed] = useState(!!saved);
  const [schedule, setSchedule] = useState<Schedule>(saved ?? defaultSchedule(names, perWeek));
  const days = trainingCount(schedule);

  const chooseSplit = (id: SplitId) => {
    setSplit(id);
    // Les séances changent de nom : on repart d'une semaine type avec le même nombre de jours
    setSchedule(
      defaultSchedule(
        getSplit(id).days.map((d) => d.name),
        days || perWeek,
      ),
    );
  };

  const setDay = (index: number, name: string | null) => {
    setSchedule((week) => week.map((n, i) => (i === index ? name : n)));
  };

  const save = async () => {
    const program = fixed ? { split, perWeek: days, schedule } : { split, perWeek };
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
    resetTo('/(tabs)');
  };

  return (
    <Screen
      scroll
      footer={
        <StickerButton label={edit ? 'Enregistrer' : "C'est parti"} onPress={save} disabled={fixed && days === 0} />
      }
    >
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
            onPress={() => chooseSplit(s.id)}
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
        Tes jours
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Choice
          selected={fixed}
          onPress={() => setFixed(true)}
          accessibilityLabel="Jours fixes"
          style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text size={17} weight="black">
            Jours fixes
          </Text>
        </Choice>
        <Choice
          selected={!fixed}
          onPress={() => setFixed(false)}
          accessibilityLabel="Quand je peux"
          style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text size={17} weight="black">
            Quand je peux
          </Text>
        </Choice>
      </View>
      <Text size={15} color={colors.inkMuted} style={{ marginTop: 12, lineHeight: 21 }}>
        {fixed
          ? days === 0
            ? 'Choisis au moins un jour de séance.'
            : `${days} séance${days > 1 ? 's' : ''} par semaine. Un jour de repos, tu peux quand même t'entraîner.`
          : "Tu viens quand tu veux : les séances s'enchaînent dans l'ordre."}
      </Text>

      {fixed ? (
        <View style={{ gap: 12, marginTop: 16 }}>
          {WEEKDAY_NAMES.map((weekday, i) => (
            <DayRow
              key={weekday}
              weekday={weekday}
              names={names}
              value={schedule[i] ?? null}
              onChange={(n) => setDay(i, n)}
            />
          ))}
        </View>
      ) : (
        <PerWeekPicker perWeek={perWeek} onChange={setPerWeek} />
      )}
    </Screen>
  );
}

function DayRow({
  weekday,
  names,
  value,
  onChange,
}: {
  weekday: string;
  names: string[];
  value: string | null;
  onChange: (name: string | null) => void;
}) {
  const options: (string | null)[] = [null, ...names];
  return (
    <View style={{ gap: 6 }}>
      <Text size={15} weight="bold" style={{ textTransform: 'capitalize' }}>
        {weekday}
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {options.map((name) => {
          const on = value === name;
          return (
            <Pressable
              key={name ?? 'rest'}
              onPress={() => onChange(name)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${weekday} : ${name ?? 'repos'}`}
              style={{
                minHeight: 40,
                paddingHorizontal: 14,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: on ? border.strong : border.base,
                borderColor: on ? colors.ink : colors.line,
                borderStyle: name === null && !on ? 'dashed' : 'solid',
                backgroundColor: on ? (name ? colors.coralSoft : colors.paper) : colors.card,
                ...(on ? hardShadow(2) : {}),
              }}
            >
              <Text size={15} weight="black" color={on ? colors.ink : colors.inkMuted}>
                {name ?? 'Repos'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PerWeekPicker({ perWeek, onChange }: { perWeek: number; onChange: (n: number) => void }) {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}
    >
      {PER_WEEK.map((n) => {
        const on = perWeek === n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
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
  );
}
