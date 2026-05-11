import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

interface RestTimerProps {
  secondsLeft: number;
  totalSeconds: number;
  isVisible: boolean;
  onSkip: () => void;
  onAddTime: (seconds: number) => void;
}

export function RestTimer({ secondsLeft, totalSeconds, isVisible, onSkip, onAddTime }: RestTimerProps) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progress = secondsLeft / totalSeconds;

  const urgencyColor =
    secondsLeft <= 10 ? colors.status.danger :
    secondsLeft <= 30 ? colors.status.warning :
    colors.brand.secondary;

  const urgencyGradient: [string, string] =
    secondsLeft <= 10 ? ['#ef4444', '#dc2626'] :
    secondsLeft <= 30 ? ['#f59e0b', '#d97706'] :
    ['#7c3aed', '#06b6d4'];

  const SIZE   = 200;
  const STROKE = 10;

  return (
    <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.80)' }}>
        <View
          style={{
            backgroundColor: '#0d0d1c',
            borderRadius: 28,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
            padding: 32,
            gap: 28,
            minWidth: 320,
            alignItems: 'center',
            shadowColor: urgencyColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 40,
            elevation: 20,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.muted, letterSpacing: 2, textTransform: 'uppercase' }}>
            Temps de repos
          </Text>

          {/* Anneau */}
          <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
            {/* Track */}
            <View
              style={{
                position: 'absolute',
                width: SIZE, height: SIZE,
                borderRadius: SIZE / 2,
                borderWidth: STROKE,
                borderColor: 'rgba(255,255,255,0.07)',
              }}
            />
            {/* Arc de progression */}
            <View
              style={{
                position: 'absolute',
                width: SIZE, height: SIZE,
                borderRadius: SIZE / 2,
                borderWidth: STROKE,
                borderColor: 'transparent',
                borderTopColor: urgencyColor,
                borderRightColor: progress > 0.25 ? urgencyColor : 'transparent',
                borderBottomColor: progress > 0.5  ? urgencyColor : 'transparent',
                borderLeftColor:  progress > 0.75 ? urgencyColor : 'transparent',
                transform: [{ rotate: '-90deg' }],
              }}
            />
            {/* Temps */}
            <Text style={{ fontSize: 52, fontWeight: '900', color: urgencyColor }}>
              {timeStr}
            </Text>
            <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
              / {String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:{String(totalSeconds % 60).padStart(2, '0')}
            </Text>
          </View>

          {/* Boutons */}
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <Pressable
              onPress={() => onAddTime(15)}
              style={{
                flex: 1, paddingVertical: 13, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text.primary }}>+15s</Text>
            </Pressable>

            <Pressable
              onPress={() => onAddTime(30)}
              style={{
                flex: 1, paddingVertical: 13, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text.primary }}>+30s</Text>
            </Pressable>

            <Pressable onPress={onSkip} style={{ flex: 1.2, borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient
                colors={urgencyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 13, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Passer</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
