import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCelebrationStore } from '@/stores/celebrationStore';
import { POSES } from '@/components/mascot/Mascot';
import { Image } from 'react-native';
import type { MascotPose } from '@/components/mascot/Mascot';

// ── Sprite frame helper ────────────────────────────────────────────
function SpriteFrame({ pose, height }: { pose: MascotPose; height: number }) {
  const crop  = POSES[pose];
  const scale = height / crop.h;
  return (
    <View style={{ width: crop.w * scale, height, overflow: 'hidden' }}>
      <Image
        source={crop.src}
        style={{
          width:      crop.imgW * scale,
          height:     crop.imgH * scale,
          marginLeft: -crop.x * scale,
          marginTop:  -crop.y * scale,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}

// ── Animation 2 frames avec échelle commune ────────────────────────
function TwoFrameMascot({ frameA, frameB, durA = 400, durB = 500, height = 200 }: {
  frameA: MascotPose; frameB: MascotPose;
  durA?: number; durB?: number; height?: number;
}) {
  const opA = useRef(new Animated.Value(1)).current;
  const opB = useRef(new Animated.Value(0)).current;

  const frames = [frameA, frameB];
  const ops    = [opA, opB];

  const commonScale = height / Math.max(...frames.map((p) => POSES[p].h));
  const maxW        = Math.max(...frames.map((p) => POSES[p].w * commonScale));

  const switchTo = (from: Animated.Value, to: Animated.Value) =>
    Animated.parallel([
      Animated.timing(from, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.timing(to,   { toValue: 1, duration: 0, useNativeDriver: true }),
    ]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(durA),
        switchTo(opA, opB),
        Animated.delay(durB),
        switchTo(opB, opA),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ width: maxW, height }}>
      {frames.map((pose, i) => {
        const crop  = POSES[pose];
        const dispW = crop.w * commonScale;
        const dispH = crop.h * commonScale;
        return (
          <Animated.View
            key={pose}
            style={{ position: 'absolute', bottom: 0, left: (maxW - dispW) / 2, opacity: ops[i] }}
          >
            <View style={{ width: dispW, height: dispH, overflow: 'hidden' }}>
              <Image
                source={crop.src}
                style={{
                  width:      crop.imgW * commonScale,
                  height:     crop.imgH * commonScale,
                  marginLeft: -crop.x * commonScale,
                  marginTop:  -crop.y * commonScale,
                }}
                resizeMode="stretch"
              />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ── Animation célébration PR (celebrate_1 ↔ celebrate_2) ──────────
function CelebrationMascot({ height = 200 }: { height?: number }) {
  const op1 = useRef(new Animated.Value(1)).current;
  const op2 = useRef(new Animated.Value(0)).current;

  const frames: MascotPose[] = ['celebrate_1', 'celebrate_2'];
  const ops = [op1, op2];

  // Échelle commune basée sur la frame la plus haute → même zoom pour les deux
  const commonScale = height / Math.max(...frames.map((p) => POSES[p].h));
  const maxW        = Math.max(...frames.map((p) => POSES[p].w * commonScale));

  const switchTo = (from: Animated.Value, to: Animated.Value) =>
    Animated.parallel([
      Animated.timing(from, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.timing(to,   { toValue: 1, duration: 0, useNativeDriver: true }),
    ]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        switchTo(op1, op2),
        Animated.delay(500),
        switchTo(op2, op1),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ width: maxW, height }}>
      {frames.map((pose, i) => {
        const crop  = POSES[pose];
        const dispW = crop.w * commonScale;
        const dispH = crop.h * commonScale;
        return (
          <Animated.View
            key={pose}
            style={{
              position: 'absolute',
              bottom: 0,                       // pieds alignés au même niveau
              left: (maxW - dispW) / 2,
              opacity: ops[i],
            }}
          >
            {/* Rendu direct à commonScale, pas height/crop.h */}
            <View style={{ width: dispW, height: dispH, overflow: 'hidden' }}>
              <Image
                source={crop.src}
                style={{
                  width:      crop.imgW * commonScale,
                  height:     crop.imgH * commonScale,
                  marginLeft: -crop.x * commonScale,
                  marginTop:  -crop.y * commonScale,
                }}
                resizeMode="stretch"
              />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ── Particules de confettis ────────────────────────────────────────
const SPARKLES = ['✦', '★', '✦', '✸', '★', '✦', '✸'];
function Sparkles() {
  const anims = useRef(SPARKLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(anim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);

  const positions = [
    { top: -10, left: 10  },  { top: -20, left: 90  },  { top: 10, right: 5  },
    { top: 30,  left: -15 },  { top: 60,  right: -10 },  { top: -5, right: 60 },
    { top: 50,  left: 40  },
  ];

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {SPARKLES.map((s, i) => (
        <Animated.Text
          key={i}
          style={[
            { position: 'absolute', fontSize: 14, color: '#fbbf24' },
            positions[i],
            { opacity: anims[i], transform: [{ scale: anims[i]!.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] }) }] },
          ]}
        >
          {s}
        </Animated.Text>
      ))}
    </View>
  );
}

// ── Composant principal ────────────────────────────────────────────
export function CelebrationToast() {
  const { event, dismiss } = useCelebrationStore();

  const scaleAnim   = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bgOpacity   = useRef(new Animated.Value(0)).current;

  const isPR   = event?.type === 'pr';
  const accent = isPR ? '#fbbf24' : '#38bdf8';

  useEffect(() => {
    if (!event) return;

    scaleAnim.setValue(0.7);
    opacityAnim.setValue(0);
    bgOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1, speed: 16, bounciness: 10, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(bgOpacity,   { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss après 4.5s
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(bgOpacity,   { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => dismiss());
    }, 4500);

    return () => clearTimeout(timer);
  }, [event?.type, event?.title]);

  if (!event) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <Pressable style={{ flex: 1 }} onPress={dismiss}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.72)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: bgOpacity,
          }}
        >
          <Animated.View
            style={{
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              width: 300,
            }}
          >
            <LinearGradient
              colors={[`${accent}22`, '#0a0a14', '#0a0a14']}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={{
                borderRadius: 32,
                borderWidth: 1.5,
                borderColor: `${accent}50`,
                paddingVertical: 32,
                paddingHorizontal: 28,
                alignItems: 'center',
                gap: 14,
                shadowColor: accent,
                shadowOpacity: 0.45,
                shadowRadius: 30,
                shadowOffset: { width: 0, height: 8 },
                elevation: 20,
              }}
            >
              {/* Badge type */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 14, paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: `${accent}22`,
                borderWidth: 1, borderColor: `${accent}55`,
              }}>
                <Ionicons
                  name={isPR ? 'trophy' : 'checkmark-circle'}
                  size={13}
                  color={accent}
                />
                <Text style={{ fontSize: 11, fontWeight: '900', color: accent, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {isPR ? 'Nouveau record' : 'Objectif atteint'}
                </Text>
              </View>

              {/* Mascotte animée selon le type */}
              <View style={{ position: 'relative', marginVertical: 4 }}>
                {isPR ? (
                  <CelebrationMascot height={180} />
                ) : (
                  <TwoFrameMascot frameA="trophy_1" frameB="trophy_2" durA={600} durB={800} height={180} />
                )}
                <Sparkles />
              </View>

              {/* Titre */}
              <Text style={{
                fontSize: 28, fontWeight: '900', color: '#fff',
                letterSpacing: -1, textAlign: 'center', lineHeight: 32,
              }}>
                {event.title}
              </Text>

              {/* Sous-titre */}
              <Text style={{
                fontSize: 14, color: 'rgba(255,255,255,0.60)',
                fontWeight: '600', textAlign: 'center', lineHeight: 20,
              }}>
                {event.subtitle}
              </Text>

              {/* Hint tap */}
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4, fontWeight: '600' }}>
                Appuie pour continuer
              </Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
