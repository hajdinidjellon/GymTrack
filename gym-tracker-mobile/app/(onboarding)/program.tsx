import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { border, colors, hardShadow } from '@/constants/theme';
import { scheduleLegend } from '@/domain/onboarding';
import { getSplit, SPLITS } from '@/domain/programs';
import {
  cleanName,
  currentDraft,
  customProgramSettings,
  draftProblem,
  type CustomProgramDraft,
} from '@/domain/customProgram';
import { CustomProgramBuilder } from '@/components/program/CustomProgramBuilder';
import { defaultSchedule, trainingCount, validSchedule, weekSessions, type Schedule } from '@/domain/schedule';
import { t } from '@/i18n';
import { useLocale } from '@/hooks/useLocale';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { Choice } from '@/components/ui/Choice';
import { StickerCard } from '@/components/ui/StickerCard';
import { buzz } from '@/components/ui/PressableScale';
import { WeekPicker } from '@/components/program/WeekPicker';
import { StepHeader } from '@/components/ui/StepHeader';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import type { Goal, SplitId } from '@/types';
import { resetTo } from '@/components/navigation/resetTo';

const PER_WEEK = [2, 3, 4, 5, 6];

export default function ProgramScreen() {
  useLocale();
  // `split`: the program the home offers to switch to, already picked
  const params = useLocalSearchParams<{ goal?: Goal; edit?: string; split?: string }>();
  const { goal, edit } = params;
  const profile = useProfileStore((s) => s.profile);
  const offered = SPLITS.find((s) => s.id === params.split)?.id;
  const [split, setSplit] = useState<SplitId>(offered ?? profile?.program.split ?? 'ppl');
  const [perWeek, setPerWeek] = useState(profile?.program.perWeek ?? 3);
  const settings = useSettingsStore((s) => s.settings);
  // « Mon programme » : what the user has, else two sessions to name
  const [draft, setDraft] = useState<CustomProgramDraft>(() =>
    profile?.program.split === 'custom' ? currentDraft(settings) : { name: '', days: [{ name: '' }, { name: '' }] },
  );
  const custom = split === 'custom';
  const draftNames = draft.days.map((d) => cleanName(d.name)).filter(Boolean);
  const problem = custom ? draftProblem(draft) : null;
  const names = custom ? draftNames : getSplit(split).days.map((d) => d.name);
  // The days the user added to the program can be on the week too
  const saved = validSchedule(profile?.program.schedule, weekSessions(split, settings).known);
  // Une semaine fixe le reste avec le nouveau programme
  const [fixed, setFixed] = useState(!!saved || (!!offered && !!profile?.program.schedule));
  const [schedule, setSchedule] = useState<Schedule>(saved ?? defaultSchedule(names, perWeek));
  const days = trainingCount(schedule);
  const sessions = custom ? draftNames : weekSessions(split, settings, schedule).offered;
  // Renamed sessions: the week is laid out again with the new names
  const week = custom && !validSchedule(schedule, draftNames) ? defaultSchedule(draftNames, days || perWeek) : schedule;

  const chooseSplit = (id: SplitId) => {
    setSplit(id);
    // Les séances changent de nom : on repart d'une semaine type avec le même nombre de jours
    setSchedule(defaultSchedule(id === 'custom' ? draftNames : getSplit(id).days.map((d) => d.name), days || perWeek));
  };

  const save = async () => {
    if (custom) useSettingsStore.getState().updateSettings(customProgramSettings(settings, draft));
    const program = fixed ? { split, perWeek: trainingCount(week), schedule: week } : { split, perWeek };
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
        <StickerButton
          label={edit ? t('common.save') : t('onboarding.program.start')}
          onPress={save}
          disabled={(fixed && trainingCount(week) === 0) || !!problem}
        />
      }
    >
      {edit ? (
        // Opened from the profile: the arrow on the title's line, like every other screen
        <ScreenHeader back title={t('onboarding.program.title')} subtitle={t('onboarding.program.subtitle')} />
      ) : (
        <>
          <StepHeader step={2} total={2} />
          <Text size={48} weight="black" style={{ marginTop: 26, lineHeight: 54 }}>
            {t('onboarding.program.title')}
          </Text>
          <Text size={18} color={colors.inkMuted} style={{ marginTop: 10 }}>
            {t('onboarding.program.subtitle')}
          </Text>
        </>
      )}

      <View accessibilityRole="radiogroup" style={{ gap: 10, marginTop: 24 }}>
        {SPLITS.map((s) => (
          <Choice
            key={s.id}
            selected={split === s.id}
            onPress={() => chooseSplit(s.id)}
            accessibilityLabel={`${s.title}, ${s.meta}`}
            style={{
              minHeight: 74,
              paddingVertical: 10,
              flexWrap: 'wrap',
              columnGap: 12,
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

      {custom ? (
        <View style={{ marginTop: 24 }}>
          <CustomProgramBuilder
            draft={draft}
            onChange={setDraft}
            settings={settings}
            showProblem
            hint={t('program.custom.hintEdit')}
          />
        </View>
      ) : null}

      <Text size={19} weight="black" style={{ marginTop: 28 }}>
        {t('onboarding.program.days')}
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Choice
          selected={fixed}
          onPress={() => setFixed(true)}
          accessibilityLabel={t('onboarding.program.fixed')}
          style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text size={17} weight="black">
            {t('onboarding.program.fixed')}
          </Text>
        </Choice>
        <Choice
          selected={!fixed}
          onPress={() => setFixed(false)}
          accessibilityLabel={t('onboarding.program.flexible')}
          style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text size={17} weight="black">
            {t('onboarding.program.flexible')}
          </Text>
        </Choice>
      </View>
      <Text size={15} color={colors.inkMuted} style={{ marginTop: 12, lineHeight: 21 }}>
        {fixed
          ? trainingCount(week) === 0
            ? t('onboarding.program.pickOne')
            : t('onboarding.program.fixedHint', { count: trainingCount(week) })
          : t('onboarding.program.flexibleHint')}
      </Text>

      {fixed ? (
        <StickerCard style={{ marginTop: 16, gap: 16 }}>
          <WeekPicker
            week={week}
            names={sessions}
            onChange={(week) => {
              buzz('selection');
              setSchedule(week);
            }}
          />
          <Text size={14} color={colors.inkMuted} style={{ lineHeight: 20 }}>
            {scheduleLegend(split, sessions)}
          </Text>
        </StickerCard>
      ) : (
        <PerWeekPicker perWeek={perWeek} onChange={setPerWeek} />
      )}
    </Screen>
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
            accessibilityLabel={t('onboarding.program.perWeek', { n })}
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? colors.coralSoft : colors.card,
              borderWidth: on ? border.strong : border.base,
              borderColor: colors.outline,
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
                borderColor: colors.outline,
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
