import React from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { clampRule } from '@/domain/programs';
import type { RuleOverride } from '@/types';
import { Text } from '@/components/ui/Text';
import { Minus, Plus } from '@/components/ui/icons';
import { buzz } from '@/components/ui/PressableScale';
import { t } from '@/i18n';

interface Props {
  rule: RuleOverride;
  /** The goal's rule: shown when the user changed it, with a way back. */
  base: RuleOverride;
  custom: boolean;
  /** No weight to add: the reps climb with no ceiling. */
  bodyweight?: boolean;
  /** Held for a time: seconds, 5 by 5. */
  timed?: boolean;
  onChange: (rule: RuleOverride) => void;
  onReset: () => void;
}

/** Sets and rep range of an exercise, each with − and + buttons. */
export function RuleEditor({ rule, base, custom, bodyweight, timed, onChange, onReset }: Props) {
  const step = timed ? 5 : 1;
  const change = (patch: Partial<RuleOverride>) => {
    const next = clampRule({ ...rule, ...patch }, timed);
    if (next.sets === rule.sets && next.repMin === rule.repMin && next.repMax === rule.repMax) return;
    buzz('selection');
    onChange(next);
  };

  return (
    <View style={{ gap: 10 }}>
      <Line label={t('program.rule.sets')} value={rule.sets} onChange={(n) => change({ sets: n })} />
      <Line
        label={t(timed ? 'program.rule.secMin' : 'program.rule.repMin')}
        value={rule.repMin}
        step={step}
        onChange={(n) => change({ repMin: n })}
      />
      <Line
        label={t(timed ? 'program.rule.secMax' : 'program.rule.repMax')}
        value={rule.repMax}
        step={step}
        onChange={(n) => change({ repMax: n })}
      />
      <Text size={13} color={colors.inkMuted} style={{ lineHeight: 18 }}>
        {t(timed ? 'program.rule.timed' : bodyweight ? 'program.rule.bodyweight' : 'program.rule.weighted', {
          min: rule.repMin,
          max: rule.repMax,
        })}
      </Text>
      {custom ? (
        <Pressable onPress={onReset} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start' }}>
          <Text size={14} weight="bold" color={colors.inkMuted} style={{ textDecorationLine: 'underline' }}>
            {t('program.rule.reset', { sets: base.sets, min: base.repMin, max: base.repMax })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Line({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text size={16} weight="semibold" color={colors.inkMuted}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Small
          icon={<Minus />}
          a11y={t('program.rule.minus', { label, n: step })}
          onPress={() => onChange(value - step)}
        />
        <Text
          size={22}
          weight="black"
          align="center"
          style={{ minWidth: 32 }}
          accessibilityLabel={t('program.rule.value', { label, value })}
        >
          {value}
        </Text>
        <Small
          icon={<Plus />}
          a11y={t('program.rule.plus', { label, n: step })}
          onPress={() => onChange(value + step)}
        />
      </View>
    </View>
  );
}

function Small({ icon, a11y, onPress }: { icon: React.ReactNode; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        borderWidth: border.base,
        borderColor: colors.outline,
        backgroundColor: pressed ? colors.coralSoft : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      {icon}
    </Pressable>
  );
}
