import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const PURPLE        = '#a78bfa';
const PURPLE_DEEP   = '#7c3aed';
const PURPLE_LIGHT  = '#c4b5fd';

const TAB_META: Record<string, {
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
  label: string;
}> = {
  index:    { active: 'home',        inactive: 'home-outline',        label: 'Accueil' },
  session:  { active: 'flame',       inactive: 'flame-outline',       label: 'Séance'  },
  progress: { active: 'stats-chart', inactive: 'stats-chart-outline', label: 'Progrès' },
  profile:  { active: 'person',      inactive: 'person-outline',      label: 'Profil'  },
};

// Ordre visuel fixe : tab, tab, FAB+, tab, tab
const VISUAL_ORDER = ['index', 'session', '__fab__', 'progress', 'profile'] as const;

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();

  // Lookup par nom de route — l'ordre alphabétique du filesystem n'a plus d'impact
  const routeMap = React.useMemo<Record<string, { route: any; idx: number }>>(() =>
    Object.fromEntries(state.routes.map((r: any, i: number) => [r.name, { route: r, idx: i }])),
    [state.routes],
  );

  // Pulse continu doux sur le halo du FAB
  const pulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.10, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 110 + insets.bottom,
        justifyContent: 'flex-end',
        paddingBottom: insets.bottom + 16,
      }}
    >
      {/* ─── FAB central « + » ──────────────────────────────────── */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          bottom: insets.bottom + 60,
          left: 0, right: 0,
          alignItems: 'center',
          zIndex: 40,
        }}
      >
        <Pressable
          onPress={() => navigation.navigate('planner')}
          style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}
          hitSlop={12}
        >
          {/* Halo pulsant extérieur */}
          <Animated.View style={{
            position: 'absolute',
            top: -14, left: -14, right: -14, bottom: -14,
            borderRadius: 50,
            backgroundColor: 'rgba(167,139,250,0.10)',
            transform: [{ scale: pulse }],
          }} />

          {/* Anneau de bordure */}
          <View style={{
            position: 'absolute',
            top: -7, left: -7, right: -7, bottom: -7,
            borderRadius: 37,
            borderWidth: 1,
            borderColor: 'rgba(167,139,250,0.35)',
          }} />

          {/* Orbe principal */}
          <View style={{
            shadowColor: PURPLE,
            shadowOpacity: 1,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 10 },
            elevation: 30,
          }}>
            <LinearGradient
              colors={[PURPLE_LIGHT, PURPLE, PURPLE_DEEP]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }}
              style={{
                width: 60, height: 60, borderRadius: 30,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
                overflow: 'hidden',
              }}
            >
              {/* Reflet brillant haut */}
              <LinearGradient
                colors={['rgba(255,255,255,0.30)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, height: 30,
                  borderTopLeftRadius: 30, borderTopRightRadius: 30,
                }}
              />
              <Ionicons name="add" size={32} color="#fff" style={{
                textShadowColor: 'rgba(124,58,237,0.7)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }} />
            </LinearGradient>
          </View>
        </Pressable>
      </View>

      {/* ─── Dock verre flottant ────────────────────────────────── */}
      <View style={{
        marginHorizontal: 18,
        shadowColor: PURPLE,
        shadowOpacity: 0.30,
        shadowRadius: 34,
        shadowOffset: { width: 0, height: 4 },
        elevation: 16,
      }}>
        <View style={{
          borderRadius: 38,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(167,139,250,0.18)',
          backgroundColor: 'rgba(8,10,22,0.55)',
        }}>
          <BlurView intensity={70} tint="dark" style={{
            flexDirection: 'row',
            height: 70,
            alignItems: 'stretch',
            paddingHorizontal: 8,
          }}>
            {VISUAL_ORDER.map((name) => {
              if (name === '__fab__') {
                return <View key={name} style={{ flex: 0.9 }} />;
              }

              const info = routeMap[name];
              if (!info) return null;

              const focused = state.index === info.idx;
              const meta = TAB_META[name];
              if (!meta) return null;

              return (
                <Pressable
                  key={name}
                  onPress={() => navigation.navigate(name)}
                  style={({ pressed }) => ({
                    flex: 1, alignItems: 'center', justifyContent: 'center',
                    gap: 4, paddingVertical: 6,
                    opacity: pressed ? 0.55 : 1,
                  })}
                >
                  {/* Halo radial derrière icône active */}
                  <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }}>
                    {focused && (
                      <>
                        <View style={{
                          position: 'absolute',
                          width: 44, height: 44, borderRadius: 22,
                          backgroundColor: 'rgba(167,139,250,0.18)',
                          shadowColor: PURPLE,
                          shadowOpacity: 0.95,
                          shadowRadius: 18,
                          shadowOffset: { width: 0, height: 0 },
                        }} />
                        <View style={{
                          position: 'absolute',
                          width: 30, height: 30, borderRadius: 15,
                          backgroundColor: 'rgba(167,139,250,0.25)',
                        }} />
                      </>
                    )}
                    <View style={focused ? {
                      shadowColor: PURPLE,
                      shadowOpacity: 1,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 0 },
                    } : undefined}>
                      <Ionicons
                        name={focused ? meta.active : meta.inactive}
                        size={focused ? 23 : 22}
                        color={focused ? PURPLE_LIGHT : 'rgba(255,255,255,0.45)'}
                      />
                    </View>
                  </View>

                  <Text style={{
                    fontSize: 9, fontWeight: '700', letterSpacing: 0.5,
                    color: focused ? PURPLE_LIGHT : 'rgba(255,255,255,0.42)',
                  }}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </BlurView>
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index"    options={{ title: 'Accueil' }} />
      <Tabs.Screen name="session"  options={{ title: 'Séance'  }} />
      <Tabs.Screen name="planner"  options={{ title: 'Plan'    }} />
      <Tabs.Screen name="progress" options={{ title: 'Progrès' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profil'  }} />
    </Tabs>
  );
}
