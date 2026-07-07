/**
 * ÉCRAN 0 — RÉVEIL (MOBILE_PREMIUM.md storyboard).
 * Fond spatial HUD, NEXUS se matérialise (spring bouncy + glow + haptique
 * light), typewriter « Systèmes en ligne… », CTA octogonal « Initialiser ».
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { JarvisMascot } from '@/components/mascot/JarvisMascot';
import type { NexusMood } from '@/components/mascot/NexusOrb';
import { TypewriterText } from '@/components/mascot/TypewriterText';
import { BevelButton } from '@/components/ui/hud/BevelButton';
import { hud, hudType, motion } from '@/constants/theme';

const SESSION_BG = require('@/assets/images/background-session.png') as number;

const WAKE_TEXT = 'Systèmes en ligne. Je suis NEXUS, ton copilote d’entraînement.';

export default function WelcomeScreen() {
  const [mood, setMood] = useState<NexusMood>('idle');

  // Matérialisation : scale 0 → 1 (spring bouncy) + fade du glow
  const orbScale = useSharedValue(0);
  const orbOpacity = useSharedValue(0);
  const uiOpacity = useSharedValue(0);

  useEffect(() => {
    orbOpacity.value = withDelay(250, withTiming(1, { duration: 200 }));
    orbScale.value = withDelay(250, withSpring(1, motion.springCelebration));
    uiOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    const haptic = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    }, 300);
    return () => clearTimeout(haptic);
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    opacity: orbOpacity.value,
    transform: [{ scale: orbScale.value }],
  }));
  const uiStyle = useAnimatedStyle(() => ({ opacity: uiOpacity.value }));

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    router.push('/(auth)/onboarding/name');
  };

  return (
    <View style={{ flex: 1, backgroundColor: hud.bg.app }}>
      <StatusBar style="light" />

      <ImageBackground
        source={SESSION_BG}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.55 }}
      />
      <LinearGradient
        colors={['rgba(5,11,22,0.25)', 'rgba(5,11,22,0.55)', 'rgba(5,11,22,0.95)']}
        locations={[0, 0.55, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* ── Marque ─────────────────────────────────── */}
        <Animated.View style={[{ alignItems: 'center', marginTop: 32, gap: 6 }, uiStyle]}>
          <Text style={[hudType.labelHud, { color: hud.cyan.bright }]}>
            Système d'entraînement
          </Text>
          <Text style={[hudType.displayTitle, { fontSize: 40, letterSpacing: 4 }]}>
            GymTrack
          </Text>
        </Animated.View>

        {/* ── NEXUS se matérialise ───────────────────── */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={orbStyle}>
            <JarvisMascot size={150} mood={mood} />
          </Animated.View>
        </View>

        {/* ── Dialogue + CTA ─────────────────────────── */}
        <Animated.View style={[{ paddingHorizontal: 24, paddingBottom: 24, gap: 14 }, uiStyle]}>
          <View style={{ minHeight: 64, marginBottom: 6 }}>
            <TypewriterText
              text={WAKE_TEXT}
              delay={900}
              onStart={() => setMood('talking')}
              onDone={() => setMood('idle')}
              style={{
                fontFamily: 'Rajdhani-SemiBold',
                fontSize: 20,
                lineHeight: 27,
                letterSpacing: 0.3,
                color: hud.text.primary,
                textAlign: 'center',
              }}
            />
          </View>

          <BevelButton
            label="Initialiser"
            onPress={handleStart}
            heroChevrons
            haptic={false}
          />
          <BevelButton
            label="J'ai un compte"
            variant="ghost"
            height={48}
            onPress={() => router.push('/(auth)/login')}
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
