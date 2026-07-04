import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { hud, motion } from '@/constants/theme';
import { useSessionStore } from '@/stores/sessionStore';

// ─── Tokens ─────────────────────────────────────────────────────────────
const CYAN     = '#46C6F5';
const INACTIVE = '#6b7388';

export const DOCK_H                    = 72;
export const DOCK_BOTTOM               = 26;
export const BOTTOM_NAV_RESERVED_SPACE = DOCK_H + DOCK_BOTTOM + 20;

// ─── SVG icons (exact paths from HTML reference) ──────────────────────────────

function IconHome({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 11.5 12 4l9 7.5" />
      <Path d="M5 10v9h14v-9" />
    </Svg>
  );
}

function IconFlame({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3.2C12 3.2 5.5 9.4 5.5 14.2a6.5 6.5 0 0 0 13 0C18.5 9.4 12 3.2 12 3.2Z" />
    </Svg>
  );
}

function IconProgress({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 19V5" />
      <Path d="M4 19h16" />
      <Path d="M8 16l3.5-4 3 2.5L20 8" />
    </Svg>
  );
}

function IconProfile({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={3.4} />
      <Path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </Svg>
  );
}

// ─── Nav items config ──────────────────────────────────────────────────────────

type TabName = 'index' | 'session' | 'progress' | 'profile';

const NAV_LEFT = [
  { name: 'index'   as TabName, label: 'Accueil', Icon: IconHome   },
  { name: 'session' as TabName, label: 'Séance',  Icon: IconFlame  },
] as const;

const NAV_RIGHT = [
  { name: 'progress' as TabName, label: 'Progrès', Icon: IconProgress },
  { name: 'profile'  as TabName, label: 'Profil',  Icon: IconProfile  },
] as const;

// ─── Single nav tab item ───────────────────────────────────────────────────────

// Point ember pulsant — signal « séance en cours » sur l'onglet Séance.
function EmberDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false,
    );
    return () => cancelAnimation(opacity);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: -2,
          right: 12,
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: hud.accent.ember,
          shadowColor: hud.accent.ember,
          shadowOpacity: 0.9,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    />
  );
}

// Trait lumineux animé sous l'onglet actif — scale-in horizontal (spring).
function ActiveBar({ focused }: { focused: boolean }) {
  const scaleX = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    scaleX.value = withSpring(focused ? 1 : 0, motion.spring);
  }, [focused]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }],
    opacity: scaleX.value,
  }));
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: -14, left: 0, right: 0, alignItems: 'center' }}
    >
      <Animated.View
        style={[
          {
            width: 22,
            height: 3,
            borderRadius: 3,
            backgroundColor: CYAN,
            shadowColor: CYAN,
            shadowOpacity: 1,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 0 },
          },
          style,
        ]}
      />
    </View>
  );
}

function NavItem({
  label, Icon, focused, onPress, emberDot = false,
}: {
  label: string;
  Icon: React.ComponentType<{ color: string }>;
  focused: boolean;
  onPress: () => void;
  emberDot?: boolean;
}) {
  const color = focused ? CYAN : INACTIVE;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        // Fixed width wider than any label → text cannot overflow, so
        // alignItems:'center' centers icon and text on the same axis.
        width: 60,
        flexShrink: 0,
        flexGrow: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 2,
        opacity: pressed ? 0.6 : 1,
        position: 'relative',
      })}
    >
      <ActiveBar focused={focused} />
      {emberDot && <EmberDot />}

      {/* Icon — wrapped in an explicit width:60 column so the cross-axis
          center is computed from the column, not from the wider child. */}
      <View style={{ width: 60, alignItems: 'center' }}>
        <View style={focused ? {
          shadowColor: CYAN,
          shadowOpacity: 0.6,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
        } : undefined}>
          <Icon color={color} />
        </View>
      </View>

      {/* Gap between icon and text */}
      <View style={{ height: 4 }} />

      {/* Text — same explicit width:60 wrapper as the icon so both columns
          have identical horizontal centers (independent of intrinsic widths). */}
      <View style={{ width: 60, alignItems: 'center' }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.6,
            textAlign: 'center',
            color,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── BottomNav — drop into tabBar prop ────────────────────────────────────────

function CoachItem({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 68,
        flexShrink: 0, flexGrow: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 2,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ width: 68, alignItems: 'center' }}>
        <View style={{
          width: 56, height: 56, borderRadius: 28,
          shadowColor: CYAN,
          shadowOpacity: active ? 0.7 : 0.35,
          shadowRadius: active ? 18 : 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 10,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: active ? 'rgba(70,198,245,0.75)' : 'rgba(70,198,245,0.45)',
        }}>
          <BlurView intensity={80} tint="dark" style={{ flex: 1, borderRadius: 28 }}>
            <LinearGradient
              colors={['rgba(23,184,255,0.38)', 'rgba(8,20,40,0.88)']}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
          <Svg width={29} height={29} viewBox="0 0 24 24" fill="none"
            stroke={CYAN} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7L12 3Z" />
            <Path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" strokeWidth={1.8} />
          </Svg>
            </LinearGradient>
          </BlurView>
        </View>
      </View>
      <View style={{ height: 4 }} />
      <View style={{ width: 68, alignItems: 'center', marginTop: 7 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.6,
            textAlign: 'center',
            color: CYAN,
          }}
        >
          IA Coach
        </Text>
      </View>
    </Pressable>
  );
}

export function BottomNav({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const focusedName: string = state.routes[state.index]?.name ?? '';
  const isCoachActive = focusedName === 'planner';
  const hasActiveSession = useSessionStore((s) => s.activeSession !== null);

  const navigateTo = (name: string) => {
    if (name !== focusedName) Haptics.selectionAsync();
    navigation.navigate(name);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: DOCK_H + DOCK_BOTTOM + insets.bottom + 8,
        justifyContent: 'flex-end',
      }}
    >
      {/* Solid fill that blocks content showing below/behind the dock */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: insets.bottom + DOCK_BOTTOM + 4,
          backgroundColor: '#080810',
        }}
      />
      {/* ─── Dock glass ───────────────────────────────────────────────────────── */}
      <View style={{
        marginHorizontal: 12,
        marginBottom: insets.bottom + DOCK_BOTTOM,
        // overflow visible so CoachItem can float above the dock
        overflow: 'visible',
      }}>
        {/* CoachItem floated — half the circle sticks out above the dock frame */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: -28,
            left: 0, right: 0,
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <CoachItem
            active={isCoachActive}
            onPress={() => navigateTo('planner')}
          />
        </View>

        {/* deep drop shadow wrapper */}
        <View style={{
          shadowColor: '#000',
          shadowOpacity: 0.95,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 12 },
          elevation: 20,
        }}>
          {/* Outer border (1px rgba(255,255,255,.09)) + overflow clip for blur */}
          <View style={{
            borderRadius: 28,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.09)',
            overflow: 'hidden',
          }}>
            <BlurView intensity={80} tint="dark" style={{ borderRadius: 28 }}>
              {/* Dock background gradient */}
              <LinearGradient
                colors={['rgba(22,26,40,0.72)', 'rgba(10,13,22,0.86)']}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={{ height: DOCK_H, borderRadius: 28 }}
              >
                {/* Glass highlight reflection on top edge (::before in HTML) */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 1, left: '8%', right: '8%', height: 34,
                    borderRadius: 28,
                    zIndex: 1,
                  }}
                  pointerEvents="none"
                />

                {/* 5-column navigation row — spacer replaces CoachItem inside the dock */}
                <View style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-around',
                  paddingTop: 14,
                  paddingBottom: 4,
                  paddingHorizontal: 14,
                }}>
                  {NAV_LEFT.map(({ name, label, Icon }) => (
                    <NavItem
                      key={name}
                      label={label}
                      Icon={Icon}
                      focused={focusedName === name}
                      emberDot={name === 'session' && hasActiveSession}
                      onPress={() => navigateTo(name)}
                    />
                  ))}

                  {/* Spacer to preserve center gap where CoachItem floats above */}
                  <View style={{ width: 68, flexShrink: 0, flexGrow: 0 }} />

                  {NAV_RIGHT.map(({ name, label, Icon }) => (
                    <NavItem
                      key={name}
                      label={label}
                      Icon={Icon}
                      focused={focusedName === name}
                      onPress={() => navigateTo(name)}
                    />
                  ))}
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </View>
      </View>
    </View>
  );
}
