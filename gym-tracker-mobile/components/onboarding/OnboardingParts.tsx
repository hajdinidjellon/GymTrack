import React from 'react';
import { Pressable, View } from 'react-native';
import { border, colors, radius } from '@/constants/theme';
import { t } from '@/i18n';
import { Text } from '@/components/ui/Text';
import { BackButton } from '@/components/ui/BackButton';
import { BulbIcon, Check } from '@/components/ui/icons';

/** Back arrow, the questions as segments (done green, current coral, upcoming dashed) and "Passer". */
export function OnboardingHeader({
  step,
  total,
  onBack,
  onSkip,
}: {
  /** 0-based question, or undefined on the recap. */
  step?: number;
  total: number;
  onBack: () => void;
  onSkip?: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 48 }}>
      <BackButton onPress={onBack} label={t('onboarding.header.back')} />
      {step != null ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('onboarding.header.progress', { n: step + 1, total })}
          accessibilityValue={{ min: 1, max: total, now: step + 1 }}
          style={{ flex: 1, flexDirection: 'row', gap: 6 }}
        >
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 12,
                borderRadius: 6,
                borderWidth: border.base,
                borderColor: i <= step ? colors.outlineStrong : colors.outlineSoft,
                borderStyle: i <= step ? 'solid' : 'dashed',
                backgroundColor: i < step ? colors.success : i === step ? colors.coral : 'transparent',
              }}
            />
          ))}
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {onSkip ? (
        <Pressable onPress={onSkip} accessibilityRole="button" hitSlop={10}>
          <Text size={15} weight="bold" color={colors.inkMuted}>
            {t('onboarding.header.skip')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Question title and one line under it. */
export function Question({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ gap: 6, marginTop: 22, marginBottom: 22 }}>
      <Text size={32} weight="black" accessibilityRole="header" style={{ lineHeight: 36 }}>
        {title}
      </Text>
      <Text size={16} color={colors.inkMuted} style={{ lineHeight: 22 }}>
        {subtitle}
      </Text>
    </View>
  );
}

/** What the answer changes, in a bold lead and one sentence. */
export function Tip({ tip }: { tip: [string, string] }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: radius.md,
        borderWidth: border.base,
        borderColor: colors.outline,
        backgroundColor: colors.sunSoft,
      }}
    >
      <BulbIcon />
      <Text size={15} style={{ flex: 1, lineHeight: 21 }}>
        <Text size={15} weight="bold">
          {tip[0]}
        </Text>{' '}
        {tip[1]}
      </Text>
    </View>
  );
}

/** The round mark on the right of the picked card. */
export function PickMark({ on }: { on: boolean }) {
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: border.base,
        borderColor: on ? colors.outline : colors.outlineSoft,
        borderStyle: on ? 'solid' : 'dashed',
        backgroundColor: on ? colors.coral : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on ? <Check size={16} color={colors.onCoral} /> : null}
    </View>
  );
}
