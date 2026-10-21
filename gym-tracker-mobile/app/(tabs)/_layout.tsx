import React, { useEffect } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { BarIcon, ProfileIcon, ProgressIcon } from '@/components/ui/icons';
import { useProfileStore } from '@/stores/profileStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSettingsStore } from '@/stores/settingsStore';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; Icon: typeof BarIcon }> = {
  index: { label: "Aujourd'hui", Icon: BarIcon },
  progress: { label: 'Progrès', Icon: ProgressIcon },
  profile: { label: 'Profil', Icon: ProfileIcon },
};

/** A floating rail. The active tab grows into a cream pill with its label. */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: Math.max(insets.bottom, space.md) }}>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          height: 68,
          padding: 6,
          gap: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const tab = TABS[route.name];
          if (!tab) return null;
          const { Icon, label } = tab;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (focused || event.defaultPrevented) return;
                LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
                navigation.navigate(route.name);
              }}
              style={({ pressed }) => ({
                flex: focused ? 2.2 : 1,
                borderRadius: radius.pill,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: focused ? colors.cream : pressed ? colors.line : 'transparent',
              })}
            >
              <Icon color={focused ? colors.bg : colors.muted} />
              {focused ? (
                <Text size={16} weight="black" color={colors.bg} numberOfLines={1}>{label}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Une séance restée ouverte (app tuée en plein milieu) se rouvre une seule fois au lancement
let resumeChecked = false;

export default function TabsLayout() {
  const hasProfile = useProfileStore((s) => !!s.profile);
  const signedOut = useSettingsStore((s) => s.settings.signedOut);

  useEffect(() => {
    if (resumeChecked || !hasProfile || signedOut) return;
    resumeChecked = true;
    if (useSessionStore.getState().activeSession) router.push('/session');
  }, []);

  if (!hasProfile || signedOut) return <Redirect href="/welcome" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
