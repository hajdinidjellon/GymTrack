import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const LABELS: Record<string, string> = {
  index: "Aujourd'hui",
  progress: 'Progrès',
  profile: 'Profil',
};

/** Three words, no icons. The active one is bold and underlined. */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.line,
        backgroundColor: colors.bg,
        paddingHorizontal: space.gutter,
        paddingBottom: Math.max(insets.bottom, space.lg),
      }}
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const align = i === 0 ? 'flex-start' : i === state.routes.length - 1 ? 'flex-end' : 'center';
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, height: 64, justifyContent: 'center', alignItems: align }}
          >
            <Text
              size={18}
              weight={focused ? 'black' : 'semibold'}
              color={focused ? colors.cream : colors.muted}
              style={focused ? { textDecorationLine: 'underline' } : undefined}
            >
              {LABELS[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Une séance restée ouverte (app tuée en plein milieu) se rouvre une seule fois au lancement
let resumeChecked = false;

export default function TabsLayout() {
  const hasProfile = useProfileStore((s) => !!s.profile);

  useEffect(() => {
    if (resumeChecked) return;
    resumeChecked = true;
    if (useSessionStore.getState().activeSession) router.push('/session');
  }, []);

  if (!hasProfile) return <Redirect href="/welcome" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
