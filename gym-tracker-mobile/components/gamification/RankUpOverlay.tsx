/**
 * RANK UP OVERLAY — le sommet de la hiérarchie de célébration
 * (DESIGN-GYMTRACK.md §B.9-4). Séquence (~4s, skippable au tap après 1.5s) :
 *
 *   1. Le cadre octogonal se TRACE en périphérie (trim de path Skia, 600ms)
 *   2. L'ancien emblème éclate en fragments (burst de particules du tier)
 *   3. Le nouvel emblème émerge (scale 0.6→1, spring) avec ONDE DE CHOC
 *      circulaire + le fond se teinte de la couleur du nouveau tier
 *   4. « OR II → OR III », titre du rang, Mimi celebrate, confettis du tier
 *
 * Haptique : 3 impacts heavy synchronisés sur trace / éclat / émergence.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, useWindowDimensions } from 'react-native';
import { Canvas, Path as SkPath, Circle as SkCircle, BlurMask } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { hud, hudType, motion, rankPalette } from '@/constants/theme';
import { useCelebrationStore, type RankUpEvent } from '@/stores/celebrationStore';
import { octagonPath } from '@/components/ui/hud/octagon';
import { BadgeImage } from '@/components/ui/BadgeImage';
import { ConfettiBurst } from './ConfettiBurst';
import { AnimatedMultiFrameMascot } from '@/components/mascot/Mascot';
import { useT } from '@/lib/i18n';
import type { RankTier } from '@/types';

const heavy = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null);

function RankUpInner({ rankUp, onDismiss }: { rankUp: RankUpEvent; onDismiss: () => void }) {
  const t = useT();
  const { width, height } = useWindowDimensions();
  const palette = rankPalette[rankUp.to.tier as RankTier];
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const canSkip = useRef(false);

  // 1 — Trace du cadre périphérique
  const traceEnd = useSharedValue(0);
  // 2 — Ancien emblème
  const oldScale = useSharedValue(0.6);
  const oldOpacity = useSharedValue(0);
  // 3 — Nouvel emblème + onde de choc
  const newScale = useSharedValue(0.6);
  const newOpacity = useSharedValue(0);
  const waveProgress = useSharedValue(0);
  // Teinte du tier sur le fond
  const tint = useSharedValue(0);

  useEffect(() => {
    heavy();
    traceEnd.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    oldScale.value = withSpring(1, motion.spring);
    oldOpacity.value = withTiming(1, { duration: 250 });

    const tShatter = setTimeout(() => {
      setPhase(1);
      heavy();
      oldOpacity.value = withTiming(0, { duration: 200 });
      oldScale.value = withTiming(1.25, { duration: 200 });
    }, 1000);

    const tReveal = setTimeout(() => {
      setPhase(2);
      heavy();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
      newOpacity.value = withTiming(1, { duration: 200 });
      newScale.value = withSpring(1, motion.springCelebration);
      waveProgress.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
      tint.value = withTiming(0.08, { duration: 500 });
    }, 1500);

    const tSkip = setTimeout(() => { canSkip.current = true; }, 1500);
    const tAuto = setTimeout(onDismiss, 5500);
    return () => { clearTimeout(tShatter); clearTimeout(tReveal); clearTimeout(tSkip); clearTimeout(tAuto); };
  }, []);

  // Cadre périphérique octogonal
  const FRAME_M = 22;
  const framePath = octagonPath(FRAME_M, FRAME_M, width - FRAME_M * 2, height - FRAME_M * 2, 28);

  // Onde de choc : anneau qui s'étend et s'éteint
  const waveRadius = useDerivedValue(() => 60 + waveProgress.value * (width * 0.7));
  const waveOpacity = useDerivedValue(() => (1 - waveProgress.value) * 0.6);

  const oldStyle = useAnimatedStyle(() => ({
    opacity: oldOpacity.value,
    transform: [{ scale: oldScale.value }],
  }));
  const newStyle = useAnimatedStyle(() => ({
    opacity: newOpacity.value,
    transform: [{ scale: newScale.value }],
  }));
  const tintStyle = useAnimatedStyle(() => ({ opacity: tint.value }));

  const emblemCenterY = height * 0.38;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={{ flex: 1 }} onPress={() => { if (canSkip.current) onDismiss(); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,8,16,0.95)' }}>
          {/* Teinte du nouveau tier */}
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: palette.core },
              tintStyle,
            ]}
          />

          {/* Cadre tracé + onde de choc — un seul Canvas plein écran */}
          <Canvas pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width, height }}>
            <SkPath
              path={framePath}
              color={palette.core}
              style="stroke"
              strokeWidth={1.5}
              start={0}
              end={traceEnd}
            >
              <BlurMask blur={4} style="solid" />
            </SkPath>
            {phase === 2 && (
              <SkCircle
                cx={width / 2}
                cy={emblemCenterY}
                r={waveRadius}
                color={palette.core}
                style="stroke"
                strokeWidth={2}
                opacity={waveOpacity}
              />
            )}
          </Canvas>

          {/* Éclat de l'ancien emblème */}
          {phase >= 1 && (
            <ConfettiBurst
              count={16}
              colors={[palette.edge, palette.core, '#FFFFFF']}
              origin={{ x: width / 2, y: emblemCenterY }}
              duration={1400}
            />
          )}
          {/* Pluie du tier à la révélation */}
          {phase === 2 && (
            <ConfettiBurst
              count={40}
              colors={[palette.edge, palette.core, hud.cyan.bright]}
              origin={{ x: width / 2, y: emblemCenterY }}
            />
          )}

          {/* Emblèmes superposés au même point */}
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: emblemCenterY - 80, left: 0, right: 0, alignItems: 'center' }}
          >
            <Animated.View style={[{ position: 'absolute' }, oldStyle]}>
              <BadgeImage tier={rankUp.from.tier} size={160} />
            </Animated.View>
            <Animated.View style={newStyle}>
              <BadgeImage tier={rankUp.to.tier} size={160} />
            </Animated.View>
          </View>

          {/* Textes */}
          <View
            style={{
              position: 'absolute',
              top: emblemCenterY + 100,
              left: 24,
              right: 24,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Animated.Text entering={FadeIn.duration(250)} style={[hudType.labelHud, { fontSize: 13 }]}>
              {t('celebration.rankUp')}
            </Animated.Text>

            {phase === 2 && (
              <>
                <Animated.Text
                  entering={FadeIn.duration(300)}
                  style={{
                    fontFamily: 'Rajdhani-Bold',
                    fontSize: 30,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: palette.core,
                    textShadowColor: palette.glow,
                    textShadowRadius: 16,
                    textShadowOffset: { width: 0, height: 0 },
                  }}
                >
                  {rankUp.from.name}  ›  {rankUp.to.name}
                </Animated.Text>
                {rankUp.to.description ? (
                  <Animated.Text
                    entering={FadeIn.delay(250).duration(300)}
                    style={[hudType.body, { textAlign: 'center' }]}
                  >
                    {rankUp.to.description}
                  </Animated.Text>
                ) : null}
              </>
            )}
          </View>

          {/* Mimi celebrate */}
          {phase === 2 && (
            <Animated.View
              entering={FadeIn.delay(200).duration(300)}
              pointerEvents="none"
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' }}
            >
              <AnimatedMultiFrameMascot
                frames={['celebrate_1', 'celebrate_2', 'celebrate_3']}
                height={170}
                frameDuration={420}
                float={false}
              />
            </Animated.View>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

/** Monté une fois dans app/_layout. */
export function RankUpOverlay() {
  const { rankUp, dismissRankUp } = useCelebrationStore();
  if (!rankUp) return null;
  return <RankUpInner key={rankUp.to.name} rankUp={rankUp} onDismiss={dismissRankUp} />;
}
