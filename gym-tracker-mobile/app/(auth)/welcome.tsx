import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, Animated, Easing,
  Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mascot } from '@/components/mascot/Mascot';
import type { MascotPose } from '@/components/mascot/Mascot';

const LOGO    = require('@/assets/logo.png') as number;
const { width: W, height: H } = Dimensions.get('window');

// ── Blobs décoratifs (formes organiques) ──────────────────────────
function Blob({ top, left, right, bottom, rotate }: {
  top?: number; left?: number; right?: number; bottom?: number; rotate: string;
}) {
  return (
    <View style={{ position: 'absolute', top, left, right, bottom }}>
      <View style={{
        width: W * 0.72, height: W * 0.62,
        backgroundColor: '#0d2435',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 180,
        borderBottomLeftRadius: 220,
        borderBottomRightRadius: 60,
        transform: [{ rotate }],
      }} />
      <View style={{
        position: 'absolute',
        width: W * 0.52, height: W * 0.44,
        backgroundColor: '#0e2a3f',
        borderTopLeftRadius: 150,
        borderTopRightRadius: 40,
        borderBottomLeftRadius: 60,
        borderBottomRightRadius: 160,
        top: W * 0.12, left: W * 0.08,
        transform: [{ rotate: '-20deg' }],
      }} />
    </View>
  );
}

// ── Petite mascotte flottante ─────────────────────────────────────
function ParadeMascot({ pose, height, delay }: {
  pose: MascotPose; height: number; delay: number;
}) {
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(floatY, { toValue: -7, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,  duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: floatY }] }}>
      <Mascot pose={pose} height={height} animate={false} />
    </Animated.View>
  );
}

const PARADE: Array<{ pose: MascotPose; h: number; delay: number }> = [
  { pose: 'mimi3_done',      h: 88,  delay: 0    },
  { pose: 'mimi_goal',       h: 82,  delay: 300  },
  { pose: 'mimi2_bench',     h: 80,  delay: 600  },
  { pose: 'mimi_level',      h: 86,  delay: 900  },
  { pose: 'mimi3_deadlift',  h: 84,  delay: 1200 },
];

export default function WelcomeScreen() {
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#07090f' }}>
      <StatusBar style="light" backgroundColor="#07090f" />

      {/* ── Blobs ─────────────────────────────────────── */}
      <Blob top={-H * 0.08} left={-W * 0.22} rotate="-12deg" />
      <Blob bottom={H * 0.12} right={-W * 0.22} rotate="165deg" />

      {/* Petits cercles accent */}
      <View style={{ position: 'absolute', top: H * 0.10, left: W * 0.12, width: 18, height: 18, borderRadius: 9, backgroundColor: '#1a4a63', opacity: 0.8 }} />
      <View style={{ position: 'absolute', top: H * 0.34, right: W * 0.06, width: 24, height: 24, borderRadius: 12, backgroundColor: '#1a4a63', opacity: 0.7 }} />
      <View style={{ position: 'absolute', bottom: H * 0.30, left: W * 0.07, width: 14, height: 14, borderRadius: 7, backgroundColor: '#0e3050', opacity: 0.9 }} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

          {/* ── Logo ────────────────────────────────────── */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Image source={LOGO} style={{ width: 44, height: 44 }} resizeMode="contain" />
          </View>

          {/* ── Titre + sous-titre ──────────────────────── */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 }}>
            <Text style={{
              fontSize: 54, fontWeight: '900', letterSpacing: -2,
              color: '#fff', textAlign: 'center', lineHeight: 58,
            }}>
              GYMTRACK
            </Text>
            <Text style={{
              fontSize: 19, fontWeight: '600',
              color: 'rgba(255,255,255,0.60)',
              textAlign: 'center', lineHeight: 26,
            }}>
              Soulève plus.{'\n'}Progresse mieux.{'\n'}Recommence.
            </Text>
          </View>

          {/* ── Parade de mascottes ─────────────────────── */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            paddingHorizontal: 16,
            paddingBottom: 16,
            height: 110,
          }}>
            {PARADE.map((p, i) => (
              <ParadeMascot key={i} pose={p.pose} height={p.h} delay={p.delay} />
            ))}
          </View>

          {/* ── Boutons ─────────────────────────────────── */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 28, gap: 14 }}>
            {/* Commencer maintenant — toujours vers l'onboarding */}
            <Pressable
              onPress={() => router.push('/(auth)/onboarding/name')}
              style={({ pressed }) => ({
                borderRadius: 20,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.97 : 1 }],
                shadowColor: '#38bdf8',
                shadowOpacity: 0.45,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 10,
              })}
            >
              <View style={{
                backgroundColor: '#38bdf8',
                paddingVertical: 20,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  Commencer maintenant
                </Text>
              </View>
            </Pressable>

            {/* J'ai un compte — même taille, même forme, couleur différente */}
            <Pressable
              onPress={() => router.push('/(auth)/login')}
              style={({ pressed }) => ({
                borderRadius: 20,
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.22)',
                paddingVertical: 20,
                alignItems: 'center',
                borderRadius: 20,
              }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  J'ai un compte
                </Text>
              </View>
            </Pressable>
          </View>

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
