import React from 'react';
import { Tabs } from 'expo-router';
import { BottomNav } from '@/components/ui/BottomNav';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="index"    options={{ title: 'Accueil' }} />
      <Tabs.Screen name="session"  options={{ title: 'Séance'  }} />
      <Tabs.Screen name="planner"  options={{ title: 'Plan'    }} />
      <Tabs.Screen name="progress" options={{ title: 'Progrès' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profil'  }} />
    </Tabs>
  );
}
