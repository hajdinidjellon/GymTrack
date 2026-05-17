import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, Animated, Easing, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Mascot } from '@/components/mascot/Mascot';

const { width: W, height: H } = Dimensions.get('window');

// ── Confetti minimaliste ──────────────────────────────────────────
const CONFETTI_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#f59e0b', '#f87171', '#e879f9'];

function ConfettiPiece({ i }: { i: number }) {
  const fall   = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const delay  = (i * 110) % 1600;
  const left   = (i * 67 + 20) % (W - 20);
  const size   = 5 + (i % 4) * 2;
  const color  = CONFETTI_COLORS[i % CONFETTI_COLORS.length]!;
  const drift  = ((i % 2 === 0) ? 1 : -1) * (15 + (i % 5) * 12);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(fall,   { toValue: 1, duration: 2800, easing: Easing.linear,         useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 1, duration: 2000, easing: Easing.linear,         useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, []);

  const tY  = fall.interpolate({ inputRange: [0, 1],     outputRange: [-20, H * 0.85] });
  const tX  = fall.interpolate({ inputRange: [0, 1],     outputRange: [0,  drift] });
  const rot = rotate.interpolate({ inputRange: [0, 1],   outputRange: ['0deg', '360deg'] });
  const op  = fall.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute', left, top: 0,
        width: size, height: size, borderRadius: size * 0.3,
        backgroundColor: color, opacity: op,
        transform: [{ translateY: tY }, { translateX: tX }, { rotate: rot }],
      }}
    />
  );
}

export default function OnboardingDoneScreen() {
  const params = useLocalSearchParams<{ name: string }>();
  const name   = (params.name ?? '').trim() || 'champion';

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const glowS = glow.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.12] });
  const glowO = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  return (
    <View style={{ flex: 1, backgroundColor: '#07090f' }}>
      <StatusBar style="light" backgroundColor="#07090f" />

      {/* Fond */}
      <LinearGradient
        colors={['#0c0e1a', '#07090f']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={['rgba(56,189,248,0.14)', 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.55 }}
      />

      {/* Confetti */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        {Array.from({ length: 20 }, (_, i) => <ConfettiPiece key={i} i={i} />)}
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <Animated.View style={{ flex: 1, paddingHorizontal: 28, paddingBottom: 32, opacity: fade, transform: [{ translateY: slide }] }}>

          {/* ── Mascotte + halo ─────────────────────────── */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{
              position: 'absolute', width: 300, height: 300, borderRadius: 150,
              backgroundColor: 'rgba(56,189,248,0.12)',
              opacity: glowO, transform: [{ scale: glowS }],
            }} />
            <Animated.View style={{
              position: 'absolute', width: 200, height: 200, borderRadius: 100,
              backgroundColor: 'rgba(56,189,248,0.22)',
              opacity: glowO, transform: [{ scale: glowS }],
            }} />
            <Mascot pose="mimi3_done" height={220} animate float />
          </View>

          {/* ── Texte ────────────────────────────────────── */}
          <View style={{ alignItems: 'center', gap: 16, marginBottom: 36 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: 'rgba(52,211,153,0.14)',
              borderWidth: 1, borderColor: 'rgba(52,211,153,0.34)',
            }}>
              <Ionicons name="checkmark-circle" size={14} color="#34d399" />
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#6ee7b7', letterSpacing: 1.8, textTransform: 'uppercase' }}>
                Profil créé
              </Text>
            </View>

            <Text style={{ fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1.2, lineHeight: 46, textAlign: 'center' }}>
              Tout est prêt,{'\n'}
              <Text style={{ color: '#38bdf8' }}>{name} !</Text>
            </Text>

            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', lineHeight: 22, textAlign: 'center', paddingHorizontal: 8 }}>
              Ton coach a tout ce qu'il faut. C'est l'heure de soulever de la fonte.
            </Text>
          </View>

          {/* ── CTA ──────────────────────────────────────── */}
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => ({
              borderRadius: 20, overflow: 'hidden',
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: '#38bdf8',
              shadowOpacity: 0.50, shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
              elevation: 10,
            })}
          >
            <View style={{ backgroundColor: '#38bdf8', borderRadius: 18, overflow: 'hidden', paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Ionicons name="flame" size={20} color="#07090f" />
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#07090f', letterSpacing: 1, textTransform: 'uppercase' }}>
                C'est parti !
              </Text>
            </View>
          </Pressable>

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
