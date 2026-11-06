import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { border, colors } from '@/constants/theme';
import { GOALS, getSplit } from '@/domain/programs';
import {
  BAR_CHOICES,
  DEFAULT_ANSWERS,
  EXPERIENCES,
  GYM_PLATES,
  PER_WEEK_CHOICES,
  answersWeek,
  experienceTip,
  firstSession,
  goalTip,
  rhythmTip,
  sessionNames,
  answersSplit,
  weekLegend,
  type OnboardingAnswers,
} from '@/domain/onboarding';
import { defaultSchedule, trainingCount } from '@/domain/schedule';
import { formatKg } from '@/domain/plates';
import { dayName, exerciseName, t } from '@/i18n';
import { planDay } from '@/domain/sessionBuilder';
import { useSettingsStore } from '@/stores/settingsStore';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { StickerButton } from '@/components/ui/StickerButton';
import { StickerCard } from '@/components/ui/StickerCard';
import { Choice } from '@/components/ui/Choice';
import { IndexBadge } from '@/components/ui/Chip';
import { Sparkle } from '@/components/ui/Sparkle';
import { FadeIn } from '@/components/ui/FadeIn';
import { buzz } from '@/components/ui/PressableScale';
import { Barbell } from '@/components/disc/Barbell';
import { PlateFace } from '@/components/disc/PlateFace';
import { WeekPicker } from '@/components/program/WeekPicker';
import { OnboardingHeader, PickMark, Question, Tip } from './OnboardingParts';
import { AboutStep, ChainPicker, DurationStep, ProgramStep, type StepProps } from './MoreSteps';

const QUESTIONS = 7;
const RHYTHM = 3;
const RECAP = QUESTIONS;

export type FlowEnd = 'session' | 'home';

interface Props {
  /** Back from the first question. */
  onExit: () => void;
  onFinish: (answers: OnboardingAnswers, end: FlowEnd) => void;
}

/**
 * First launch: four one-tap questions, each pre-answered, then the recap with
 * the first session. One screen whose content changes, like the logger.
 */
export function OnboardingFlow({ onExit, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(DEFAULT_ANSWERS);
  const set = (patch: Partial<OnboardingAnswers>) => {
    buzz('selection');
    setAnswers((a) => ({ ...a, ...patch }));
  };
  const back = () => (step === 0 ? onExit() : setStep(step - 1));
  const next = () => {
    // Continuer sur la semaine affichée : c'est elle qu'on garde
    if (step === RHYTHM && !answers.schedule) setAnswers((a) => ({ ...a, schedule: answersWeek(a) }));
    setStep(step + 1);
  };
  const noDay = step === RHYTHM && trainingCount(answersWeek(answers)) === 0;

  if (step === RECAP) return <Recap answers={answers} onBack={back} onFinish={(end) => onFinish(answers, end)} />;

  return (
    <Screen
      scroll
      footer={
        <StickerButton
          label={step === QUESTIONS - 1 ? t('onboarding.flow.seeProgram') : t('common.continue')}
          haptic="light"
          onPress={next}
          disabled={noDay}
        />
      }
    >
      <OnboardingHeader step={step} total={QUESTIONS} onBack={back} onSkip={() => setStep(RECAP)} />
      <FadeIn key={step}>
        {step === 0 ? <GoalStep answers={answers} set={set} /> : null}
        {step === 1 ? <AboutStep answers={answers} set={set} /> : null}
        {step === 2 ? <ExperienceStep answers={answers} set={set} /> : null}
        {step === 3 ? <RhythmStep answers={answers} set={set} /> : null}
        {step === 4 ? <ProgramStep answers={answers} set={set} /> : null}
        {step === 5 ? <DurationStep answers={answers} set={set} /> : null}
        {step === 6 ? <GymStep answers={answers} set={set} /> : null}
      </FadeIn>
    </Screen>
  );
}

function GoalStep({ answers, set }: StepProps) {
  return (
    <>
      <Question title={t('onboarding.flow.goal.title')} subtitle={t('onboarding.flow.goal.subtitle')} />
      <View accessibilityRole="radiogroup" style={{ gap: 14 }}>
        {GOALS.map((g) => {
          const on = answers.goal === g.id;
          return (
            <Choice
              key={g.id}
              selected={on}
              onPress={() => set({ goal: g.id })}
              accessibilityLabel={`${g.title}, ${g.sub}`}
              style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <View
                style={{
                  width: 72,
                  height: 60,
                  borderRadius: 14,
                  borderWidth: border.base,
                  borderColor: colors.outline,
                  backgroundColor: on ? colors.card : colors.paper,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Barbell perSide={g.plates} scale={0.36} barWidth={18} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text size={20} weight="titleMedium">
                  {g.title}
                </Text>
                <Text size={14} weight="semibold" color={colors.inkMuted}>
                  {g.sub}
                </Text>
              </View>
              <PickMark on={on} />
            </Choice>
          );
        })}
      </View>
      <Tip tip={goalTip(answers.goal)} />
    </>
  );
}

function RhythmStep({ answers, set }: StepProps) {
  const split = answersSplit(answers);
  const names = sessionNames(answers.perWeek, split);
  const week = answersWeek(answers);
  const count = trainingCount(week);
  return (
    <>
      <Question title={t('onboarding.flow.rhythm.title')} subtitle={t('onboarding.flow.rhythm.subtitle')} />
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10 }}>
        {PER_WEEK_CHOICES.map((n) => {
          const on = answers.perWeek === n;
          return (
            <Choice
              key={n}
              selected={on}
              // Un autre rythme, un autre programme : on repart de sa semaine type
              onPress={() => set({ perWeek: n, split: null, schedule: defaultSchedule(sessionNames(n), n) })}
              accessibilityLabel={t('onboarding.flow.rhythm.perWeek', { n })}
              style={{ flex: 1, height: 72, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text size={on ? 32 : 28} weight="black">
                {n}
              </Text>
            </Choice>
          );
        })}
      </View>

      <StickerCard style={{ marginTop: 22, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text size={19} weight="titleMedium">
            {t('onboarding.flow.rhythm.week')}
          </Text>
          <Text size={14} weight="semibold" color={colors.inkMuted}>
            {getSplit(split).title}
          </Text>
        </View>
        <WeekPicker week={week} names={names} onChange={(schedule) => set({ schedule })} />
        <Text size={14} color={count === 0 ? colors.danger : colors.inkMuted} style={{ lineHeight: 20 }}>
          {count === 0
            ? t('onboarding.flow.rhythm.pickOne')
            : t('onboarding.flow.rhythm.legend', { legend: weekLegend(answers.perWeek, split) })}
        </Text>
      </StickerCard>
      <Tip tip={rhythmTip(answers.perWeek, count, split)} />
    </>
  );
}

function ExperienceStep({ answers, set }: StepProps) {
  return (
    <>
      <Question title={t('onboarding.flow.experience.title')} subtitle={t('onboarding.flow.experience.subtitle')} />
      <View accessibilityRole="radiogroup" style={{ gap: 14 }}>
        {EXPERIENCES.map((e) => {
          const on = answers.experience === e.id;
          return (
            <Choice
              key={e.id}
              selected={on}
              onPress={() => set({ experience: e.id })}
              accessibilityLabel={`${e.title}, ${e.sub}`}
              style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <LevelBars level={e.level} on={on} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text size={20} weight="titleMedium">
                  {e.title}
                </Text>
                <Text size={14} weight="semibold" color={colors.inkMuted}>
                  {e.sub}
                </Text>
              </View>
              <PickMark on={on} />
            </Choice>
          );
        })}
      </View>
      <Tip tip={experienceTip(answers.experience)} />
    </>
  );
}

/** Three steps of a staircase, filled up to the level. */
function LevelBars({ level, on }: { level: number; on: boolean }) {
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 14,
        borderWidth: border.base,
        borderColor: colors.outline,
        backgroundColor: on ? colors.card : colors.paper,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 4,
        paddingBottom: 12,
      }}
    >
      {[12, 20, 28].map((h, i) => (
        <View
          key={h}
          style={{
            width: 8,
            height: h,
            borderRadius: 3,
            backgroundColor: i < level ? colors.ink : 'transparent',
            borderWidth: i < level ? 0 : 2,
            borderColor: colors.outlineSoft,
            borderStyle: 'dashed',
          }}
        />
      ))}
    </View>
  );
}

function GymStep({ answers, set }: StepProps) {
  const toggle = (kg: number) => {
    const has = answers.plates.includes(kg);
    set({ plates: has ? answers.plates.filter((p) => p !== kg) : [...answers.plates, kg].sort((a, b) => b - a) });
  };
  return (
    <>
      <Question title={t('onboarding.flow.chain.title')} subtitle={t('onboarding.flow.chain.subtitle')} />
      <ChainPicker answers={answers} set={set} />
      <Text size={22} weight="black" style={{ marginTop: 28 }}>
        {t('onboarding.flow.chain.check')}
      </Text>
      <Text size={19} weight="titleMedium" style={{ marginTop: 14, marginBottom: 10 }}>
        {t('onboarding.flow.gym.bar')}
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 12 }}>
        {BAR_CHOICES.map((b) => (
          <Choice
            key={b.kg}
            selected={answers.barWeight === b.kg}
            onPress={() => set({ barWeight: b.kg })}
            accessibilityLabel={t('onboarding.flow.gym.barLabel', { kg: b.kg, label: b.label })}
            style={{
              flex: 1,
              minHeight: 60,
              flexWrap: 'wrap',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Text size={20} weight="titleMedium">
              {b.kg} {t('common.kg')}
            </Text>
            <Text size={14} weight="semibold" color={colors.inkMuted}>
              {b.label}
            </Text>
          </Choice>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: 22,
          marginBottom: 10,
        }}
      >
        <Text size={19} weight="titleMedium">
          {t('onboarding.flow.gym.plates')}
        </Text>
        <Text size={14} weight="semibold" color={colors.inkMuted}>
          {t('onboarding.flow.gym.platesCount', { n: answers.plates.length, total: GYM_PLATES.length })}
        </Text>
      </View>
      <StickerCard style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
        {GYM_PLATES.map((kg) => {
          const on = answers.plates.includes(kg);
          return (
            <Pressable
              key={kg}
              onPress={() => toggle(kg)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={t('onboarding.flow.gym.plateLabel', { kg: formatKg(kg) })}
              // Five per row: the nine plates fit on two rows
              style={({ pressed }) => ({ width: '20%', alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 })}
            >
              <PlateFace kg={kg} size={62} off={!on} />
              <Text size={13} weight="bold" color={on ? colors.ink : colors.inkMuted}>
                {formatKg(kg)}
              </Text>
            </Pressable>
          );
        })}
      </StickerCard>
      <Tip tip={[t('onboarding.flow.gym.tipLead'), t('onboarding.flow.gym.tip')]} />
    </>
  );
}

function Recap({
  answers,
  onBack,
  onFinish,
}: {
  answers: OnboardingAnswers;
  onBack: () => void;
  onFinish: (end: FlowEnd) => void;
}) {
  const settings = useSettingsStore((s) => s.settings);
  const split = getSplit(answersSplit(answers));
  const goal = GOALS.find((g) => g.id === answers.goal) ?? GOALS[0]!;
  const perWeek = answers.schedule ? trainingCount(answers.schedule) : answers.perWeek;
  const plan = useMemo(
    () =>
      planDay(
        split.days.find((d) => d.name === firstSession(answers.schedule, sessionNames(answers.perWeek, split.id)))!,
        {
          profile: {
            goal: answers.goal,
            program: { split: split.id, perWeek: answers.perWeek },
            prs: [],
            sessionMinutes: answers.sessionMinutes,
          },
          settings: { ...settings, stackStep: answers.stackStep, cableStep: answers.cableStep },
          workouts: [],
        },
      ),
    [answers, settings, split],
  );

  return (
    <Screen
      scroll
      footer={
        <>
          <StickerButton
            label={t('onboarding.flow.recap.firstSession')}
            haptic="medium"
            onPress={() => onFinish('session')}
          />
          <StickerButton
            label={t('onboarding.flow.recap.later')}
            variant="ghost"
            size="small"
            onPress={() => onFinish('home')}
          />
        </>
      }
    >
      <OnboardingHeader total={QUESTIONS} onBack={onBack} />
      <FadeIn>
        <StickerCard tone="hero" style={{ marginTop: 26, gap: 14 }}>
          <View style={{ position: 'absolute', top: 14, right: 18 }}>
            <Sparkle size={34} />
          </View>
          <View style={{ position: 'absolute', top: 50, right: 58 }}>
            <Sparkle size={22} />
          </View>
          <Text size={32} weight="black" accessibilityRole="header" style={{ lineHeight: 36 }}>
            {t('onboarding.flow.recap.ready')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              split.title,
              t('onboarding.flow.recap.perWeek', { n: perWeek }),
              t('onboarding.flow.recap.perDay', { n: answers.sessionMinutes }),
              goal.sub,
            ].map((label) => (
              <View
                key={label}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: border.base,
                  borderColor: colors.outline,
                  backgroundColor: colors.card,
                }}
              >
                <Text size={15} weight="titleMedium">
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </StickerCard>
      </FadeIn>

      <FadeIn index={1}>
        <StickerCard style={{ marginTop: 20, paddingBottom: 6 }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}
          >
            <Text size={19} weight="titleMedium">
              {t('onboarding.flow.recap.session', { name: dayName(plan.name) })}
            </Text>
            <Text size={14} weight="semibold" color={colors.inkMuted}>
              {t('onboarding.flow.recap.minutes', { n: plan.minutes })}
            </Text>
          </View>
          {plan.lifts.map((lift, i) => (
            <View
              key={lift.def.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                borderTopWidth: 2,
                borderTopColor: colors.line,
              }}
            >
              <IndexBadge value={i + 1} />
              <Text size={16} weight="bold" style={{ flex: 1 }}>
                {exerciseName(lift.def.name)}
              </Text>
              <Text size={15} weight="titleMedium" color={colors.inkMuted}>
                {lift.rule.sets} × {lift.rule.repMin}–{lift.rule.repMax}
              </Text>
            </View>
          ))}
        </StickerCard>
      </FadeIn>

      <FadeIn index={2}>
        <Tip tip={[t('onboarding.flow.recap.tipLead'), t('onboarding.flow.recap.tip')]} />
      </FadeIn>
    </Screen>
  );
}
