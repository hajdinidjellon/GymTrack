import React, { useEffect, useRef } from 'react';
import {
  View, Text, Modal, Pressable, Animated, Easing, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Mascot } from '@/components/mascot/Mascot';
import { BG_COLORS } from '@/components/ui/ScreenBackground';
import type { UnlockedBadge } from '@/types';

const { width: W, height: H } = Dimensions.get('window');

const RARITY_COLOR: Record<string, string> = {
  common:    '#9ca3af',
  rare:      '#38bdf8',
  epic:      '#a78bfa',
  legendary: '#f59e0b',
};

const RARITY_LABEL: Record<string, string> = {
  common: 'COMMUN', rare: 'RARE', epic: 'ÉPIQUE', legendary: 'LÉGENDAIRE',
};

const CONFETTI_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#f59e0b', '#f87171', '#e879f9'];

// ── Confetti piece ───────────────────────────────────────────────
function ConfettiPiece({ i, color }: { i: number; color: string }) {
  const fall   = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const delay  = (i * 60) % 1200;
  const left   = (i * 53 + 20) % (W - 20);
  const size   = 6 + (i % 4) * 2;
  const drift  = ((i % 2 === 0) ? 1 : -1) * (20 + (i % 5) * 14);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(fall,   { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, []);

  const tY  = fall.interpolate({ inputRange: [0, 1],     outputRange: [-30, H * 0.9] });
  const tX  = fall.interpolate({ inputRange: [0, 1],     outputRange: [0,  drift] });
  const rot = rotate.interpolate({ inputRange: [0, 1],   outputRange: ['0deg', '360deg'] });
  const op  = fall.interpolate({ inputRange: [0, 0.08, 0.88, 1], outputRange: [0, 1, 1, 0] });

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

// ── Modal principal ──────────────────────────────────────────────
interface BadgeUnlockModalProps {
  badge: UnlockedBadge | null;
  onClose: () => void;
}

export function BadgeUnlockModal({ badge, onClose }: BadgeUnlockModalProps) {
  const fade  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) {
      fade.setValue(0);
      scale.setValue(0.7);
      return;
    }
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [badge]);

  if (!badge) return null;

  const rarityColor = RARITY_COLOR[badge.rarity] ?? RARITY_COLOR.common!;
  const rarityLabel = RARITY_LABEL[badge.rarity] ?? badge.rarity.toUpperCase();
  const glowScale   = glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{
          flex: 1, alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(7,9,15,0.88)',
          opacity: fade,
        }}
      >
        {/* Confetti background */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          {Array.from({ length: 30 }, (_, i) => (
            <ConfettiPiece key={i} i={i} color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]!} />
          ))}
        </View>

        <Animated.View
          style={{
            transform: [{ scale }],
            width: W * 0.86,
            maxWidth: 380,
          }}
        >
          {/* Card */}
          <View style={{
            backgroundColor: '#0c0e1a',
            borderRadius: 28, overflow: 'hidden',
            borderWidth: 1.5, borderColor: `${rarityColor}40`,
            shadowColor: rarityColor, shadowOpacity: 0.6, shadowRadius: 30,
            shadowOffset: { width: 0, height: 12 }, elevation: 16,
          }}>
            <LinearGradient
              colors={[`${rarityColor}28`, `${rarityColor}08`, 'transparent']}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }}
            />

            {/* Close */}
            <Pressable
              onPress={onClose}
              style={{
                position: 'absolute', top: 14, right: 14, zIndex: 10,
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.70)" />
            </Pressable>

            <View style={{ alignItems: 'center', paddingHorizontal: 28, paddingTop: 32, paddingBottom: 24, gap: 8 }}>
              {/* Tag rareté */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
                backgroundColor: `${rarityColor}22`,
                borderWidth: 1, borderColor: `${rarityColor}45`,
              }}>
                <Ionicons name="sparkles" size={11} color={rarityColor} />
                <Text style={{ fontSize: 10, fontWeight: '900', color: rarityColor, letterSpacing: 2, textTransform: 'uppercase' }}>
                  Badge {rarityLabel}
                </Text>
              </View>

              {/* Mimi + halo */}
              <View style={{ alignItems: 'center', justifyContent: 'center', height: 200, marginVertical: 8 }}>
                <Animated.View style={{
                  position: 'absolute',
                  width: 200, height: 200, borderRadius: 100,
                  backgroundColor: `${rarityColor}30`,
                  opacity: glowOpacity, transform: [{ scale: glowScale }],
                }} />
                <Animated.View style={{
                  position: 'absolute',
                  width: 140, height: 140, borderRadius: 70,
                  backgroundColor: `${rarityColor}50`,
                  opacity: glowOpacity, transform: [{ scale: glowScale }],
                }} />
                <Mascot pose="mimi3_done" height={170} animate float />
              </View>

              {/* Titre & description */}
              <Text style={{
                fontSize: 14, fontWeight: '900', color: rarityColor,
                letterSpacing: 2, textTransform: 'uppercase',
                textAlign: 'center', marginTop: 4,
              }}>
                Badge débloqué
              </Text>
              <Text style={{
                fontSize: 30, fontWeight: '900', color: '#fff',
                letterSpacing: -1.2, textAlign: 'center', lineHeight: 34,
              }}>
                {badge.name}
              </Text>
              <Text style={{
                fontSize: 14, color: 'rgba(255,255,255,0.55)',
                textAlign: 'center', fontWeight: '600', lineHeight: 20,
                paddingHorizontal: 8, marginTop: 4,
              }}>
                {badge.description}
              </Text>

              {/* XP reward */}
              {badge.xpReward > 0 && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
                  backgroundColor: 'rgba(56,189,248,0.12)',
                  borderWidth: 1, borderColor: 'rgba(56,189,248,0.28)',
                  marginTop: 12,
                }}>
                  <Ionicons name="star" size={14} color={BG_COLORS.accent} />
                  <Text style={{ fontSize: 14, fontWeight: '900', color: BG_COLORS.accent, letterSpacing: 0.3 }}>
                    +{badge.xpReward} XP
                  </Text>
                </View>
              )}

              {/* CTA */}
              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  alignSelf: 'stretch', marginTop: 20,
                  borderRadius: 18, overflow: 'hidden',
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: BG_COLORS.accent,
                  shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
                  elevation: 10,
                })}
              >
                <View style={{
                  backgroundColor: BG_COLORS.accent, borderRadius: 18,
                  paddingVertical: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <Ionicons name="flame" size={16} color="#07090f" />
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#07090f', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    Continuer
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
