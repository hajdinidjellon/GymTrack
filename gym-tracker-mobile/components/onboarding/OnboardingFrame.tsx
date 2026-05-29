import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, Animated, Easing,
  KeyboardAvoidingView, Platform, Dimensions, ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot, AnimatedExerciseMascot, type MascotPose } from '@/components/mascot/Mascot';

const BG_QR = require('@/assets/images/background-qr.png') as number;

const { width: W } = Dimensions.get('window');

// ── Barre de progression ──────────────────────────────────────────
function StepProgress({ current, total }: { current: number; total: number }) {
  const progress = useRef(new Animated.Value((current - 1) / total)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: current / total,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [current]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ gap: 6 }}>
      <View style={{
        height: 3, borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.10)',
        overflow: 'hidden',
      }}>
        <Animated.View style={{
          height: 3, width,
          backgroundColor: '#38bdf8',
          borderRadius: 3,
        }} />
      </View>
      <Text style={{
        fontSize: 11, fontWeight: '700',
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 1.4,
      }}>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </Text>
    </View>
  );
}

// ── Props ─────────────────────────────────────────────────────────
interface OnboardingFrameProps {
  pose?: MascotPose;
  mascotHeight?: number;
  mascotFrames?: [MascotPose, MascotPose];
  frameDuration?: number;
  /** Remplace le slot mascotte par un composant custom (ex: ToggleMascot aligné à gauche) */
  customMascot?: React.ReactNode;
  question: string;
  subtext?: string;
  step: number;
  total: number;
  canContinue: boolean;
  ctaLabel?: string;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
  skipLabel?: string;
  onSkip?: () => void;
  onContinue?: () => void;
  /** Contenu affiché juste au-dessus du bouton Continuer */
  aboveCta?: React.ReactNode;
  /** Cache le bouton CTA — utiliser quand la navigation est déclenchée par la sélection */
  hideCta?: boolean;
  loading?: boolean;
  hideBack?: boolean;
  children: React.ReactNode;
}

export function OnboardingFrame({
  pose, mascotHeight = 180, mascotFrames, frameDuration, customMascot,
  question, subtext,
  step, total, canContinue,
  ctaLabel = 'Continuer', ctaIcon = 'arrow-forward',
  skipLabel, onSkip, onContinue, aboveCta, hideCta = false, loading = false, hideBack = false,
  children,
}: OnboardingFrameProps) {

  // Animation d'apparition de la question au changement d'écran
  const qFade  = useRef(new Animated.Value(0)).current;
  const qSlide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    qFade.setValue(0); qSlide.setValue(12);
    Animated.parallel([
      Animated.timing(qFade,  { toValue: 1, duration: 350, delay: 80, useNativeDriver: true }),
      Animated.spring(qSlide, { toValue: 0, delay: 80, speed: 14, bounciness: 4, useNativeDriver: true }),
    ]).start();
  }, [question]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#07090f' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Image de fond */}
      <ImageBackground
        source={BG_QR}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.70 }}
      />
      {/* Overlay sombre pour lisibilité */}
      <LinearGradient
        colors={['rgba(7,9,15,0.10)', 'rgba(7,9,15,0.35)', 'rgba(7,9,15,0.80)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* ── Header ──────────────────────────────────── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 16,
          paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
        }}>
          {!hideBack ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => ({
                width: 40, height: 40, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.75)" />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <View style={{ flex: 1 }}>
            <StepProgress current={step} total={total} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 16,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Question ────────────────────────────────── */}
          <Animated.View style={{
            opacity: qFade, transform: [{ translateY: qSlide }],
            marginBottom: 24,
          }}>
            <Text style={{
              fontSize: 30, fontWeight: '900',
              color: '#fff', lineHeight: 38,
              letterSpacing: -0.8,
            }}>
              {question}
            </Text>
            {subtext ? (
              <Text style={{
                fontSize: 15, color: 'rgba(255,255,255,0.45)',
                marginTop: 8, lineHeight: 21,
              }}>
                {subtext}
              </Text>
            ) : null}
          </Animated.View>

          {/* ── Mascotte ────────────────────────────────── */}
          <View style={{ alignItems: customMascot ? 'flex-start' : 'center', marginBottom: 28 }}>
            {customMascot ? customMascot
              : mascotFrames ? (
                <AnimatedExerciseMascot
                  frames={mascotFrames}
                  height={mascotHeight}
                  frameDuration={frameDuration}
                />
              ) : pose ? (
                <Mascot pose={pose} height={mascotHeight} animate float />
              ) : null}
          </View>

          {/* ── Contenu (choices / input) ───────────────── */}
          <View style={{ gap: 10 }}>
            {children}
          </View>
        </ScrollView>

        {/* ── Footer ──────────────────────────────────── */}
        {(!hideCta || (skipLabel && onSkip)) && (
          <View style={{
            paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, gap: 8,
          }}>
            {aboveCta}
            {skipLabel && onSkip && (
              <Pressable
                onPress={onSkip}
                style={({ pressed }) => ({
                  alignItems: 'center', paddingVertical: 10,
                  opacity: pressed ? 0.5 : 0.7,
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.50)' }}>
                  {skipLabel}
                </Text>
              </Pressable>
            )}

            {!hideCta && onContinue && (
              <Pressable
                onPress={onContinue}
                disabled={!canContinue || loading}
                style={({ pressed }) => ({
                  borderRadius: 20, overflow: 'hidden',
                  opacity: !canContinue ? 0.30 : pressed ? 0.90 : 1,
                  transform: [{ scale: canContinue && pressed ? 0.98 : 1 }],
                  shadowColor: canContinue ? '#38bdf8' : 'transparent',
                  shadowOpacity: 0.40, shadowRadius: 18,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: canContinue ? 8 : 0,
                })}
              >
                <View style={{
                  backgroundColor: '#38bdf8',
                  borderRadius: 18,
                  paddingVertical: 19,
                  flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'center', gap: 10,
                }}>
                  <Text style={{
                    fontSize: 16, fontWeight: '900',
                    color: '#07090f', letterSpacing: 0.8, textTransform: 'uppercase',
                  }}>
                    {loading ? 'Chargement...' : ctaLabel}
                  </Text>
                  {!loading && (
                    <Ionicons name={ctaIcon} size={18} color="#07090f" />
                  )}
                </View>
              </Pressable>
            )}
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
