import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.secondary,
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: 'Séance',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💪" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progrès',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📈" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
