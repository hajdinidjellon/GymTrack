import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BG_COLORS } from '@/components/ui/ScreenBackground';

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  home:     { active: 'home',           inactive: 'home-outline' },
  session:  { active: 'flame',          inactive: 'flame-outline' },
  progress: { active: 'trending-up',    inactive: 'trending-up-outline' },
  planner:  { active: 'calendar',       inactive: 'calendar-outline' },
  profile:  { active: 'person-circle',  inactive: 'person-circle-outline' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icon = TAB_ICONS[name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      {focused && (
        <View
          style={{
            position: 'absolute',
            top: -10,
            width: 22,
            height: 3,
            borderRadius: 2,
            backgroundColor: BG_COLORS.accent,
            shadowColor: BG_COLORS.accent,
            shadowOpacity: 0.6,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
            elevation: 4,
          }}
        />
      )}
      <Ionicons
        name={focused ? icon.active : icon.inactive}
        size={22}
        color={focused ? BG_COLORS.accent : 'rgba(255,255,255,0.40)'}
      />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#08101a',
          borderTopColor: 'rgba(56,189,248,0.10)',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 10,
        },
        tabBarActiveTintColor: BG_COLORS.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.40)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.6,
          marginTop: 3,
          textTransform: 'uppercase',
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: 'Séance',
          tabBarIcon: ({ focused }) => <TabIcon name="session" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progrès',
          tabBarIcon: ({ focused }) => <TabIcon name="progress" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => <TabIcon name="planner" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
