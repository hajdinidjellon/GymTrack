import React from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { border, colors, hardShadow, radius } from '@/constants/theme';
import { t } from '@/i18n';
import { Text } from '@/components/ui/Text';
import { ChevronRight } from '@/components/ui/icons';

/** A sticker switch: the knob on the right and green when on. */
function Switch({ on }: { on: boolean }) {
  return (
    <View
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        borderWidth: border.base,
        borderColor: colors.outline,
        backgroundColor: on ? colors.success : colors.paper,
        padding: 2,
        alignItems: on ? 'flex-end' : 'flex-start',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 21,
          height: 21,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: colors.outline,
          backgroundColor: colors.card,
        }}
      />
    </View>
  );
}

export function Group({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ borderRadius: radius.card, ...hardShadow(5) }}>
      <View
        style={{
          borderRadius: radius.card,
          borderCurve: 'continuous',
          borderWidth: border.strong,
          borderColor: colors.outline,
          backgroundColor: colors.card,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

export interface RowProps {
  label: string;
  value: string;
  onPress: () => void;
  chevron?: boolean;
  last?: boolean;
  hint?: string;
  /** An on/off setting: drawn as a switch, so it reads as something to change. */
  on?: boolean;
}

export function Row({ label, value, onPress, chevron, last, hint, on }: RowProps) {
  const toggle = on !== undefined;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => null);
        onPress();
      }}
      accessibilityRole={toggle ? 'switch' : 'button'}
      accessibilityState={toggle ? { checked: on } : undefined}
      accessibilityLabel={toggle ? label : t('profile.row', { label, value })}
      accessibilityHint={hint}
      style={({ pressed }) => ({
        minHeight: 56,
        gap: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: last ? 0 : 2,
        borderBottomColor: colors.line,
        backgroundColor: pressed ? colors.coralSoft : 'transparent',
      })}
    >
      <Text size={16} weight="bold">
        {label}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
        {toggle ? (
          <Switch on={on} />
        ) : (
          <Text
            size={chevron ? 14 : 16}
            weight={chevron ? 'semibold' : 'black'}
            color={chevron ? colors.inkMuted : colors.ink}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {value}
          </Text>
        )}
        {chevron ? <ChevronRight size={18} /> : null}
      </View>
    </Pressable>
  );
}
