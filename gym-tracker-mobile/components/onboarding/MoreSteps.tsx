import React, { useState } from 'react';
import { View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { border, colors, fonts, radius } from '@/constants/theme';
import { GYM_CHAINS, HOME_GYM, OTHER_GYM, POPULAR_GYMS, searchGyms, type GymChain } from '@/domain/gyms';
import {
  AGE_GROUPS,
  BODY_WEIGHT_RANGE,
  BODY_WEIGHT_START,
  PROGRAM_CHOICES,
  SESSION_MINUTES,
  type OnboardingAnswers,
} from '@/domain/onboarding';
import { formatKg } from '@/domain/plates';
import { t } from '@/i18n';
import type { AgeGroup, Sex, SplitId } from '@/types';
import { Text } from '@/components/ui/Text';
import { Choice } from '@/components/ui/Choice';
import { Stepper } from '@/components/ui/Stepper';
import { StickerCard } from '@/components/ui/StickerCard';
import { PickMark, Question, Tip } from './OnboardingParts';
import { Pill } from '@/components/ui/Pill';
import { CustomProgramBuilder } from '@/components/program/CustomProgramBuilder';
import { useSettingsStore } from '@/stores/settingsStore';

export interface StepProps {
  answers: OnboardingAnswers;
  set: (patch: Partial<OnboardingAnswers>, quiet?: boolean) => void;
}

function Label({ children }: { children: string }) {
  return (
    <Text size={19} weight="titleMedium" style={{ marginTop: 22, marginBottom: 10 }}>
      {children}
    </Text>
  );
}

const AGE_TO: Record<AgeGroup, number | null> = { '16': 24, '25': 34, '35': 44, '45': 54, '55': null };

export const ageLabel = (g: AgeGroup) =>
  AGE_TO[g] === null
    ? t('onboarding.flow.about.ageFrom', { from: g })
    : t('onboarding.flow.about.ageGroup', { from: g, to: AGE_TO[g]! });

const clampWeight = (kg: number) =>
  Math.min(BODY_WEIGHT_RANGE.max, Math.max(BODY_WEIGHT_RANGE.min, Math.round(kg * 2) / 2));

/** « Et toi ? » : sex, age, body weight. Each optional; untouched stays unsaid. */
export function AboutStep({ answers, set }: StepProps) {
  const sexes: { id: Sex | null; label: string }[] = [
    { id: 'male', label: t('onboarding.flow.about.male') },
    { id: 'female', label: t('onboarding.flow.about.female') },
    { id: null, label: t('onboarding.flow.about.noSay') },
  ];
  const weight = answers.bodyWeight;
  const nudge = (d: number) => set({ bodyWeight: clampWeight((weight ?? BODY_WEIGHT_START) + d) });
  return (
    <>
      <Question title={t('onboarding.flow.about.title')} subtitle={t('onboarding.flow.about.subtitle')} />
      <Text size={19} weight="titleMedium" style={{ marginBottom: 10 }}>
        {t('onboarding.flow.about.sex')}
      </Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {sexes.map((s) => (
          <Pill key={s.id ?? 'none'} label={s.label} on={answers.sex === s.id} onPress={() => set({ sex: s.id })} />
        ))}
      </View>

      <Label>{t('onboarding.flow.about.age')}</Label>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AGE_GROUPS.map((g) => (
          <Pill
            key={g}
            label={ageLabel(g)}
            on={answers.ageGroup === g}
            // Touché une deuxième fois : on ne dit plus rien
            onPress={() => set({ ageGroup: answers.ageGroup === g ? null : g })}
          />
        ))}
      </View>

      <Label>{t('onboarding.flow.about.weight')}</Label>
      <StickerCard style={{ paddingVertical: 10 }}>
        <Stepper
          value={weight == null ? t('onboarding.flow.about.weightUnset') : formatKg(weight)}
          unit={t('common.kg')}
          onMinus={() => nudge(-1)}
          onPlus={() => nudge(1)}
          minusLabel={t('onboarding.flow.about.weightLess')}
          plusLabel={t('onboarding.flow.about.weightMore')}
          onChange={(kg) => {
            if (kg >= BODY_WEIGHT_RANGE.min && kg <= BODY_WEIGHT_RANGE.max) set({ bodyWeight: clampWeight(kg) });
          }}
          inputLabel={t('onboarding.flow.about.weightLabel')}
        />
        {weight != null ? (
          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <Pill
              label={t('onboarding.flow.about.weightClear')}
              on={false}
              role="button"
              onPress={() => set({ bodyWeight: null })}
            />
          </View>
        ) : null}
      </StickerCard>
      <Tip tip={[t('onboarding.flow.about.tipLead'), t('onboarding.flow.about.tip')]} />
    </>
  );
}

/** The programs in plain words; the one the rhythm suits is advised and picked first. */
export function ProgramStep({ answers, set }: StepProps) {
  const pick = (id: SplitId | null) => {
    const program = PROGRAM_CHOICES.find((p) => p.id === id);
    // Le rythme suit le programme s'il n'est pas fait pour lui ; la semaine se refait
    const perWeek = !program || program.rhythms.includes(answers.perWeek) ? answers.perWeek : program.rhythms[0]!;
    // « Autre » : two sessions to name to start with, the ones already typed kept
    const custom =
      id === 'custom' ? (answers.custom ?? { name: '', days: [{ name: '' }, { name: '' }] }) : answers.custom;
    set({ split: id, perWeek, schedule: null, custom });
  };
  const settings = useSettingsStore((s) => s.settings);
  const choices = [
    {
      id: null,
      title: t('onboarding.flow.program.unsure'),
      sub: t('onboarding.flow.program.unsureSub'),
      badge: null,
    },
    ...PROGRAM_CHOICES.map((p) => ({
      ...p,
      title: p.title,
      sub: p.sub,
      badge: t('onboarding.flow.program.ideal', { n: rhythmsLabel(p.rhythms) }),
    })),
  ];
  return (
    <>
      <Question title={t('onboarding.flow.program.title')} subtitle={t('onboarding.flow.program.subtitle')} />
      <View accessibilityRole="radiogroup" style={{ gap: 12 }}>
        {choices.map((p) => {
          const on = answers.split === p.id;
          return (
            <Choice
              key={p.id ?? 'unsure'}
              selected={on}
              onPress={() => pick(p.id)}
              accessibilityLabel={[p.title, p.sub, p.badge].filter(Boolean).join(', ')}
              style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text size={20} weight="titleMedium">
                  {p.title}
                </Text>
                <Text size={14} weight="semibold" color={colors.inkMuted}>
                  {p.sub}
                </Text>
                {p.badge ? (
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 2,
                      borderRadius: radius.pill,
                      borderWidth: 2,
                      borderColor: colors.frame,
                      backgroundColor: colors.sun,
                    }}
                  >
                    <Text size={13} weight="bold" color={colors.onSun}>
                      {p.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <PickMark on={on} />
            </Choice>
          );
        })}
      </View>
      {answers.split === 'custom' && answers.custom ? (
        <View style={{ marginTop: 22 }}>
          <CustomProgramBuilder
            draft={answers.custom}
            // The week is made again from the new names
            onChange={(custom) => set({ custom, schedule: null }, true)}
            settings={settings}
            showProblem
            hint={t('program.custom.hintOnboarding')}
          />
        </View>
      ) : null}
    </>
  );
}

/** [2, 3] → "2–3", [4] → "4". */
export const rhythmsLabel = (rhythms: number[]) =>
  rhythms.length > 1 ? `${rhythms[0]}–${rhythms[rhythms.length - 1]}` : `${rhythms[0]}`;

/** The usual session time: a program day that runs over is cut to fit. */
export function DurationStep({ answers, set }: StepProps) {
  return (
    <>
      <Question title={t('onboarding.flow.duration.title')} subtitle={t('onboarding.flow.duration.subtitle')} />
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
        {SESSION_MINUTES.map((n) => {
          const on = answers.sessionMinutes === n;
          return (
            <Choice
              key={n}
              selected={on}
              onPress={() => set({ sessionMinutes: n })}
              accessibilityLabel={t('onboarding.flow.duration.minutesLabel', { n })}
              style={{ flex: 1, height: 84, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text size={on ? 30 : 26} weight="black">
                {n}
              </Text>
              <Text size={13} weight="bold" color={colors.inkMuted}>
                {t('onboarding.flow.duration.unit')}
              </Text>
            </Choice>
          );
        })}
      </View>
      <Tip tip={[t('onboarding.flow.duration.tipLead'), t('onboarding.flow.duration.tip')]} />
    </>
  );
}

/** The gym chain: four big names, a search for the others, another gym or home. Prefills the equipment. */
export function ChainPicker({ answers, set }: StepProps) {
  const [query, setQuery] = useState('');
  const found = searchGyms(query);
  const pick = (g: GymChain) =>
    set({ gym: g.id, barWeight: g.barWeight, plates: g.plates, stackStep: g.stackStep, cableStep: g.cableStep });
  const chosen = [...GYM_CHAINS, OTHER_GYM, HOME_GYM].find((g) => g.id === answers.gym);
  // Picked from the search: shown with the four, so it stays visible once the search is cleared
  const shown = chosen && !chosen.popular && chosen.name ? [...POPULAR_GYMS, chosen] : POPULAR_GYMS;
  return (
    <>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {shown.map((g) => (
          <Choice
            key={g.id}
            selected={answers.gym === g.id}
            onPress={() => pick(g)}
            accessibilityLabel={g.name}
            style={{ width: '48%', flexGrow: 1, minHeight: 64, padding: 12, justifyContent: 'center' }}
          >
            <Text size={18} weight="titleMedium" numberOfLines={1} adjustsFontSizeToFit>
              {g.name}
            </Text>
          </Choice>
        ))}
      </View>
      <View style={{ marginTop: 12 }}>
        <Input
          maxFontSizeMultiplier={1.5}
          value={query}
          onChangeText={setQuery}
          placeholder={t('onboarding.flow.chain.searchPlaceholder')}
          placeholderTextColor={colors.inkFaint}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={t('onboarding.flow.chain.search')}
          style={{
            minHeight: 52,
            paddingHorizontal: 16,
            paddingVertical: 0,
            borderRadius: radius.row,
            borderWidth: border.base,
            borderColor: colors.outline,
            backgroundColor: colors.card,
            fontFamily: fonts.bold,
            fontSize: 16,
            color: colors.ink,
          }}
        />
      </View>
      {query.trim() ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          {found.length === 0 ? (
            <Text size={14} weight="semibold" color={colors.inkMuted}>
              {t('onboarding.flow.chain.notFound')}
            </Text>
          ) : (
            found.map((g) => (
              <Pill
                key={g.id}
                label={g.name}
                on={answers.gym === g.id}
                onPress={() => {
                  pick(g);
                  setQuery('');
                }}
              />
            ))
          )}
        </View>
      ) : null}
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Pill
          label={t('onboarding.flow.chain.other')}
          on={answers.gym === OTHER_GYM.id}
          onPress={() => pick(OTHER_GYM)}
        />
        <Pill label={t('onboarding.flow.chain.home')} on={answers.gym === HOME_GYM.id} onPress={() => pick(HOME_GYM)} />
      </View>
      {answers.stackStep ? (
        <Text size={14} weight="semibold" color={colors.inkMuted} style={{ marginTop: 12 }}>
          {[
            t('onboarding.flow.chain.stacks', { kg: formatKg(answers.stackStep) }),
            ...(answers.cableStep ? [t('onboarding.flow.chain.cables', { kg: formatKg(answers.cableStep) })] : []),
          ].join(', ')}
        </Text>
      ) : null}
    </>
  );
}
