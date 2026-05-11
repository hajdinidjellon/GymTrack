import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  home:     { active: '⌂',  inactive: '⌂'  },
  session:  { active: '◉',  inactive: '◎'  },
  progress: { active: '▲',  inactive: '△'  },
  planner:  { active: '▦',  inactive: '▧'  },
  profile:  { active: '●',  inactive: '○'  },
};

function TabIcon({ name, focused, label }: { name: string; focused: boolean; label: string }) {
  const icon = TAB_ICONS[name] ?? { active: '●', inactive: '○' };

  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      {focused && (
        <LinearGradient
          colors={['#7c3aed', '#06b6d4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: -10,
            width: 28,
            height: 2,
            borderRadius: 1,
          }}
        />
      )}
      <Text
        style={{
          fontSize: 18,
          color: focused ? colors.brand.primary : colors.text.muted,
          opacity: focused ? 1 : 0.5,
        }}
      >
        {focused ? icon.active : icon.inactive}
      </Text>
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
          backgroundColor: '#0c0c18',
          borderTopColor: 'rgba(255,255,255,0.07)',
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} label="Accueil" />,
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: 'Séance',
          tabBarIcon: ({ focused }) => <TabIcon name="session" focused={focused} label="Séance" />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progrès',
          tabBarIcon: ({ focused }) => <TabIcon name="progress" focused={focused} label="Progrès" />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => <TabIcon name="planner" focused={focused} label="Plan" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} label="Profil" />,
        }}
      />
    </Tabs>
  );
}
