import React from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { clampRule } from '@/domain/programs';
import type { RuleOverride } from '@/types';
import { Text } from '@/components/ui/Text';
import { buzz } from '@/components/ui/PressableScale';
import { t } from '@/i18n';

interface Props {
  rule: RuleOverride;
  /** The goal's rule: shown when the user changed it, with a way back. */
  base: RuleOverride;
  custom: boolean;
  /** No weight to add: the reps climb with no ceiling. */
  bodyweight?: boolean;
  onChange: (rule: RuleOverride) => void;
  onReset: () => void;
}

/** Sets and rep range of an exercise, each with − and + buttons. */
export function RuleEditor({ rule, base, custom, bodyweight, onChange, onReset }: Props) {
  const change = (patch: Partial<RuleOverride>) => {
    const next = clampRule({ ...rule, ...patch });
    if (next.sets === rule.sets && next.repMin === rule.repMin && next.repMax === rule.repMax) return;
    buzz('selection');
    onChange(next);
  };

  return (
    <View style={{ gap: 10 }}>
      <Line label={t('program.rule.sets')} value={rule.sets} onChange={(n) => change({ sets: n })} />
      <Line label={t('program.rule.repMin')} value={rule.repMin} onChange={(n) => change({ repMin: n })} />
      <Line label={t('program.rule.repMax')} value={rule.repMax} onChange={(n) => change({ repMax: n })} />
      <Text size={13} color={colors.inkMuted} style={{ lineHeight: 18 }}>
        {t(bodyweight ? 'program.rule.bodyweight' : 'program.rule.weighted', { min: rule.repMin, max: rule.repMax })}
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

function Line({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text size={16} weight="semibold" color={colors.inkMuted}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Small label="−" a11y={t('program.rule.minus', { label })} onPress={() => onChange(value - 1)} />
        <Text
          size={22}
          weight="black"
          align="center"
          style={{ minWidth: 32 }}
          accessibilityLabel={t('program.rule.value', { label, value })}
        >
          {value}
        </Text>
        <Small label="+" a11y={t('program.rule.plus', { label })} onPress={() => onChange(value + 1)} />
      </View>
    </View>
  );
}

function Small({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
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
        borderColor: colors.ink,
        backgroundColor: pressed ? colors.coralSoft : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text size={20} weight="black">
        {label}
      </Text>
    </Pressable>
  );
}
