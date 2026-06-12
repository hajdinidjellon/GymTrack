/**
 * PR CELEBRATION — célébration plein écran d'un nouveau record
 * (DESIGN-GYMTRACK.md §B.9-3). Le PR interrompt le flux — il le mérite.
 *
 * Séquence : flash VOLT 12 % → « NOUVEAU RECORD » tamponné (spring
 * overshoot) → le 1RM COMPTE depuis l'ancien record (on voit littéralement
 * sa progression) → confettis octogonaux → Mimi celebrate qui monte du bas.
 * Haptique « charge » : 3 impacts montants puis success.
 *
 * Le volt (#C8FF1D) est réservé à ce moment — jamais ailleurs.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { hud, hudType, motion } from '@/constants/theme';
import { useCelebrationStore, type CelebrationEvent } from '@/stores/celebrationStore';
import { AnimatedNumber } from '@/components/ui/hud/AnimatedNumber';
import { ConfettiBurst } from './ConfettiBurst';
import { AnimatedMultiFrameMascot } from '@/components/mascot/Mascot';
import { useT } from '@/lib/i18n';

const VOLT = hud.accent.volt;

function chargeHaptics() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null), 150);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null), 300);
  setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null), 500);
}

function PRCelebrationInner({ event, onDismiss }: { event: CelebrationEvent; onDismiss: () => void }) {
  const t = useT();
  const hasValues = event.prevValue != null && event.newValue != null;
  const [displayValue, setDisplayValue] = useState(event.prevValue ?? 0);

  // Flash volt plein écran (200ms)
  const flash = useSharedValue(0);
  // Stamp « NOUVEAU RECORD » : scale 1.4 → 1
  const stampScale = useSharedValue(1.4);
  const stampOpacity = useSharedValue(0);
  // Mimi monte du bas
  const mimiY = useSharedValue(220);

  useEffect(() => {
    chargeHaptics();
    flash.value = withSequence(
      withTiming(0.12, { duration: 90 }),
      withTiming(0, { duration: 250 }),
    );
    stampOpacity.value = withDelay(200, withTiming(1, { duration: 150 }));
    stampScale.value = withDelay(200, withSpring(1, motion.springCelebration));
    mimiY.value = withDelay(900, withSpring(0, motion.springCelebration));

    // Le compteur part de l'ancien record et compte vers le nouveau.
    const countTimer = setTimeout(() => {
      if (event.newValue != null) setDisplayValue(event.newValue);
    }, 700);
    // Auto-dismiss après 5s — tap pour fermer avant.
    const dismissTimer = setTimeout(onDismiss, 5000);
    return () => {
      clearTimeout(countTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const stampStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.value,
    transform: [{ scale: stampScale.value }],
  }));
  const mimiStyle = useAnimatedStyle(() => ({ transform: [{ translateY: mimiY.value }] }));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={{ flex: 1 }} onPress={onDismiss}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,8,16,0.92)' }}>
          {/* Flash volt */}
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: VOLT },
              flashStyle,
            ]}
          />

          <ConfettiBurst colors={[VOLT, hud.cyan.bright, '#FFFFFF', hud.cyan.primary]} count={48} />

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 }}>
            {/* Stamp */}
            <Animated.View style={[{ alignItems: 'center', gap: 6 }, stampStyle]}>
              <Text
                style={{
                  fontFamily: 'Rajdhani-Bold',
                  fontSize: 36,
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                  color: VOLT,
                  textShadowColor: 'rgba(200,255,29,0.6)',
                  textShadowRadius: 18,
                  textShadowOffset: { width: 0, height: 0 },
                }}
              >
                {t('celebration.newRecord')}
              </Text>
              {event.exercise ? (
                <Text style={[hudType.labelHud, { fontSize: 14, color: hud.text.primary }]}>
                  {event.exercise}
                </Text>
              ) : null}
            </Animated.View>

            {/* Le moment : le 1RM compte ancien → nouveau */}
            {hasValues ? (
              <Animated.View entering={FadeIn.delay(500).duration(250)} style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <AnimatedNumber
                    value={displayValue}
                    decimals={1}
                    duration={600}
                    style={[hudType.displayHero, { fontSize: 72, color: '#FFFFFF' }]}
                  />
                  <Text style={[hudType.labelHud, { fontSize: 16, color: VOLT }]}>KG</Text>
                </View>
                <Text style={[hudType.labelHud, { marginTop: 2 }]}>1RM ESTIMÉ</Text>
                {event.prevValue != null && event.prevValue > 0 && (
                  <Text style={[hudType.bodyDim, { marginTop: 6 }]}>
                    {t('celebration.previous')} : {event.prevValue.toFixed(1)} kg
                  </Text>
                )}
              </Animated.View>
            ) : (
              <Animated.Text
                entering={FadeIn.delay(500).duration(250)}
                style={[hudType.body, { textAlign: 'center' }]}
              >
                {event.subtitle}
              </Animated.Text>
            )}

            <Animated.Text
              entering={FadeIn.delay(2000).duration(400)}
              style={{ fontSize: 11, color: hud.text.faint, marginTop: 10 }}
            >
              {t('celebration.tapToContinue')}
            </Animated.Text>
          </View>

          {/* Mimi XL celebrate — monte du bas (spring overshoot) */}
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' }, mimiStyle]}
          >
            <AnimatedMultiFrameMascot
              frames={['celebrate_1', 'celebrate_2', 'celebrate_3']}
              height={190}
              frameDuration={420}
              float={false}
            />
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

/** Monté une fois dans app/_layout — prend en charge les events `pr`. */
export function PRCelebration() {
  const { event, dismiss } = useCelebrationStore();
  if (!event || event.type !== 'pr') return null;
  return <PRCelebrationInner key={`${event.exercise}-${event.newValue}`} event={event} onDismiss={dismiss} />;
}
