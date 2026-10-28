import React from 'react';
import { Pressable, View } from 'react-native';
import type { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { border, colors, hardShadow, radius, space } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { BarIcon, ProfileIcon, ProgressIcon } from '@/components/ui/icons';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export const TABS: Record<string, { label: string; Icon: typeof BarIcon }> = {
  index: { label: "Aujourd'hui", Icon: BarIcon },
  progress: { label: 'Progrès', Icon: ProgressIcon },
  profile: { label: 'Profil', Icon: ProfileIcon },
};

/**
 * Sticker rail. Every tab keeps its label; the active one sits on an outlined
 * coral pill with bold text (two cues, never colour alone).
 */
export function TabBar({ state, emitter, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: colors.paper,
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: Math.max(insets.bottom, space.md),
      }}
    >
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          height: 68,
          padding: 6,
          gap: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.card,
          borderWidth: border.strong,
          borderColor: colors.ink,
          ...hardShadow(4),
        }}
      >
        {state.routes.map((route, i) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === i;
          const { Icon, label } = tab;
          const tint = focused ? colors.ink : colors.inkMuted;
          return (
            <Pressable
              key={route.key}
              testID={`tab-${route.name}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (focused || event.defaultPrevented) return;
                Haptics.selectionAsync().catch(() => null);
                navigateToTab(route.key);
              }}
              style={({ pressed }) => ({
                flex: 1,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                borderWidth: focused ? border.base : 0,
                borderColor: colors.ink,
                backgroundColor: focused ? colors.coralSoft : pressed ? colors.paper : 'transparent',
              })}
            >
              <Icon color={tint} size={20} />
              <Text size={12} weight={focused ? 'black' : 'semibold'} color={tint} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
