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
  WEEKDAYS,
  experienceTip,
  goalTip,
  rhythmTip,
  splitFor,
  weekLegend,
  weekPlan,
  type OnboardingAnswers,
} from '@/domain/onboarding';
import { formatKg } from '@/domain/plates';
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
import { OnboardingHeader, PickMark, Question, Tip } from './OnboardingParts';

const QUESTIONS = 4;
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
  const next = () => setStep(step + 1);

  if (step === RECAP) return <Recap answers={answers} onBack={back} onFinish={(end) => onFinish(answers, end)} />;

  return (
    <Screen
      scroll
      footer={
        <StickerButton
          label={step === QUESTIONS - 1 ? 'Voir mon programme' : 'Continuer'}
          haptic="light"
          onPress={next}
        />
      }
    >
      <OnboardingHeader step={step} total={QUESTIONS} onBack={back} onSkip={() => setStep(RECAP)} />
      <FadeIn key={step}>
        {step === 0 ? <GoalStep answers={answers} set={set} /> : null}
        {step === 1 ? <RhythmStep answers={answers} set={set} /> : null}
        {step === 2 ? <ExperienceStep answers={answers} set={set} /> : null}
        {step === 3 ? <GymStep answers={answers} set={set} /> : null}
      </FadeIn>
    </Screen>
  );
}

interface StepProps {
  answers: OnboardingAnswers;
  set: (patch: Partial<OnboardingAnswers>) => void;
}

function GoalStep({ answers, set }: StepProps) {
  return (
    <>
      <Question
        title="Tu viens pour quoi ?"
        subtitle="Ça règle tes séries et tes reps. Tu pourras changer plus tard."
      />
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
                  borderColor: colors.ink,
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
  const week = weekPlan(answers.perWeek);
  return (
    <>
      <Question
        title="Combien de séances par semaine ?"
        subtitle="Sois réaliste : mieux vaut 3 séances tenues que 5 ratées."
      />
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10 }}>
        {PER_WEEK_CHOICES.map((n) => {
          const on = answers.perWeek === n;
          return (
            <Choice
              key={n}
              selected={on}
              onPress={() => set({ perWeek: n })}
              accessibilityLabel={`${n} séances par semaine`}
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
            Ta semaine type
          </Text>
          <Text size={14} weight="semibold" color={colors.inkMuted}>
            {getSplit(splitFor(answers.perWeek)).title}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={`Exemple : séances le ${WEEKDAYS.filter((_, i) => week[i]).join(', ')}`}
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
        >
          {WEEKDAYS.map((d, i) => {
            const letter = week[i];
            return (
              <View key={d} style={{ alignItems: 'center', gap: 6 }}>
                <Text size={13} weight="bold" color={colors.inkMuted}>
                  {d}
                </Text>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    borderWidth: border.base,
                    borderColor: letter ? colors.ink : colors.line,
                    borderStyle: letter ? 'solid' : 'dashed',
                    backgroundColor: letter ? colors.coralSoft : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {letter ? (
                    <Text size={15} weight="titleMedium">
                      {letter}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
        <Text size={14} color={colors.inkMuted} style={{ lineHeight: 20 }}>
          {weekLegend(answers.perWeek)}. Les jours sont un exemple : tu viens quand tu veux, on suit l'ordre.
        </Text>
      </StickerCard>
      <Tip tip={rhythmTip(answers.perWeek)} />
    </>
  );
}

function ExperienceStep({ answers, set }: StepProps) {
  return (
    <>
      <Question
        title="Tu soulèves depuis quand ?"
        subtitle="Pas de piège : ça sert juste à choisir tes premières charges."
      />
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
        borderColor: colors.ink,
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
            borderColor: colors.line,
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
      <Question title="Il y a quoi dans ta salle ?" subtitle="Pour te dire quels disques mettre de chaque côté." />
      <Text size={19} weight="titleMedium" style={{ marginBottom: 10 }}>
        La barre
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 12 }}>
        {BAR_CHOICES.map((b) => (
          <Choice
            key={b.kg}
            selected={answers.barWeight === b.kg}
            onPress={() => set({ barWeight: b.kg })}
            accessibilityLabel={`Barre de ${b.kg} kilos, ${b.label}`}
            style={{
              flex: 1,
              height: 60,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Text size={20} weight="titleMedium">
              {b.kg} kg
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
          Les disques
        </Text>
        <Text size={14} weight="semibold" color={colors.inkMuted}>
          {answers.plates.length} sur {GYM_PLATES.length}
        </Text>
      </View>
      <StickerCard style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
        {GYM_PLATES.map((kg) => {
          const on = answers.plates.includes(kg);
          return (
            <Pressable
              key={kg}
              onPress={() => toggle(kg)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${formatKg(kg)} kilos`}
              style={({ pressed }) => ({ width: '25%', alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 })}
            >
              <PlateFace kg={kg} size={62} off={!on} />
              <Text size={13} weight="bold" color={on ? colors.ink : colors.inkMuted}>
                {formatKg(kg)}
              </Text>
            </Pressable>
          );
        })}
      </StickerCard>
      <Tip
        tip={['Touche un disque', "pour l'ajouter ou l'enlever. On ne te demandera jamais un disque que tu n'as pas."]}
      />
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
  const split = getSplit(splitFor(answers.perWeek));
  const goal = GOALS.find((g) => g.id === answers.goal) ?? GOALS[0]!;
  const plan = useMemo(
    () =>
      planDay(split.days[0]!, {
        profile: { goal: answers.goal, program: { split: split.id, perWeek: answers.perWeek }, prs: [] },
        settings,
        workouts: [],
      }),
    [answers, settings, split],
  );

  return (
    <Screen
      scroll
      footer={
        <>
          <StickerButton label="Voir ma première séance" haptic="medium" onPress={() => onFinish('session')} />
          <StickerButton
            label="Plus tard, voir l'accueil"
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
            Ton programme{'\n'}est prêt
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[split.title, `${answers.perWeek} × par semaine`, goal.sub].map((label) => (
              <View
                key={label}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: border.base,
                  borderColor: colors.ink,
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
              Séance 1 · {plan.name}
            </Text>
            <Text size={14} weight="semibold" color={colors.inkMuted}>
              ~{plan.minutes} min
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
                {lift.def.name}
              </Text>
              <Text size={15} weight="titleMedium" color={colors.inkMuted}>
                {lift.rule.sets} × {lift.rule.repMin}–{lift.rule.repMax}
              </Text>
            </View>
          ))}
        </StickerCard>
      </FadeIn>

      <FadeIn index={2}>
        <Tip
          tip={[
            'Première fois ?',
            'Tu choisis ta charge sur chaque exercice. Ensuite, toutes tes charges sont calculées.',
          ]}
        />
      </FadeIn>
    </Screen>
  );
}
