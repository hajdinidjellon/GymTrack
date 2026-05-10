import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Animated } from 'react-native';
import { colors } from '@/constants/theme';

interface RestTimerProps {
  secondsLeft: number;
  totalSeconds: number;
  isVisible: boolean;
  onSkip: () => void;
  onAddTime: (seconds: number) => void;
}

export function RestTimer({
  secondsLeft,
  totalSeconds,
  isVisible,
  onSkip,
  onAddTime,
}: RestTimerProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const progress = secondsLeft / totalSeconds;
    Animated.timing(rotation, {
      toValue: 1 - progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [secondsLeft, totalSeconds, rotation]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const urgencyColor =
    secondsLeft <= 10
      ? colors.status.danger
      : secondsLeft <= 30
        ? colors.status.warning
        : colors.brand.secondary;

  const SIZE = 180;
  const STROKE = 8;

  return (
    <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
        <View
          className="items-center gap-6 p-8 rounded-3xl mx-6"
          style={{
            backgroundColor: colors.bg.secondary,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            minWidth: 300,
          }}
        >
          <Text className="text-lg font-semibold text-text-secondary">Temps de repos</Text>

          {/* Cercle de progression */}
          <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                position: 'absolute',
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
                borderWidth: STROKE,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
                borderWidth: STROKE,
                borderColor: 'transparent',
                borderTopColor: urgencyColor,
                borderRightColor: secondsLeft / totalSeconds > 0.25 ? urgencyColor : 'transparent',
                borderBottomColor: secondsLeft / totalSeconds > 0.5 ? urgencyColor : 'transparent',
                borderLeftColor: secondsLeft / totalSeconds > 0.75 ? urgencyColor : 'transparent',
                transform: [{ rotate: '-90deg' }],
              }}
            />
            <Text
              style={{
                fontSize: 48,
                fontWeight: '900',
                color: urgencyColor,
              }}
            >
              {timeStr}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => onAddTime(15)}
              className="flex-1 py-3 rounded-xl bg-white/[0.08] items-center"
            >
              <Text className="text-sm font-semibold text-text-primary">+15s</Text>
            </Pressable>
            <Pressable
              onPress={() => onAddTime(30)}
              className="flex-1 py-3 rounded-xl bg-white/[0.08] items-center"
            >
              <Text className="text-sm font-semibold text-text-primary">+30s</Text>
            </Pressable>
            <Pressable
              onPress={onSkip}
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: 'rgba(124,58,237,0.25)' }}
            >
              <Text className="text-sm font-semibold text-brand-primary">Passer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
