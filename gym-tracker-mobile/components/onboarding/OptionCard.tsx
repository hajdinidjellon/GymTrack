/**
 * OPTION CARD — carte de réponse d'onboarding, refondue en octogone HUD.
 * Sélection = bordure accent + glow G2 (élévation lumineuse, jamais d'ombre),
 * repos = G0 dormant. Cible de tap pleine largeur (MOBILE_PREMIUM.md règle 1).
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { HudCard } from '@/components/ui/hud/HudCard';
import { hud, motion } from '@/constants/theme';

interface OptionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  selected: boolean;
  onPress: () => void;
  iconSize?: number;
}

export function OptionCard({
  icon, title, subtitle, color, selected, onPress, iconSize = 26,
}: OptionCardProps) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => null);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.97, motion.spring); }}
        onPressOut={() => { scale.value = withSpring(1, motion.spring); }}
      >
        <HudCard
          level={selected ? 'g2' : 'g0'}
          cut={hud.cut.md}
          borderColor={selected ? color : undefined}
          glowColor={selected ? `${color}4D` : undefined}
          padding={0}
        >
          <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
            {/* Puits d'icône */}
            <View style={{
              width: 64,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 18,
              backgroundColor: selected ? `${color}22` : 'rgba(255,255,255,0.03)',
              borderRightWidth: 1,
              borderRightColor: selected ? `${color}40` : hud.border.hairline,
            }}>
              <Ionicons
                name={icon}
                size={iconSize}
                color={selected ? color : hud.text.faint}
              />
            </View>

            <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{
                fontFamily: 'Rajdhani-Bold',
                fontSize: 18,
                letterSpacing: 0.4,
                color: selected ? hud.text.primary : hud.text.secondary,
                marginBottom: 2,
              }}>
                {title}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'Rajdhani-Medium',
                  fontSize: 13,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  color: selected ? color : hud.text.muted,
                }}
              >
                {subtitle}
              </Text>
            </View>

            {/* Diode de sélection */}
            <View style={{ justifyContent: 'center', paddingRight: 16 }}>
              <View style={{
                width: 10, height: 10,
                transform: [{ rotate: '45deg' }],
                backgroundColor: selected ? color : 'transparent',
                borderWidth: selected ? 0 : 1,
                borderColor: hud.border.subtle,
              }} />
            </View>
          </View>
        </HudCard>
      </Pressable>
    </Animated.View>
  );
}
