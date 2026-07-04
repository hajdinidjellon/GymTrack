import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  icon, title, subtitle, color, selected, onPress, iconSize = 32,
}: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 18,
        overflow: 'hidden',
        transform: [{ scale: pressed ? 0.97 : 1 }],
        borderWidth: 1.5,
        borderColor: selected ? color : 'rgba(255,255,255,0.12)',
        shadowColor: selected ? color : 'transparent',
        shadowOpacity: selected ? 0.55 : 0,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 4 },
        elevation: selected ? 10 : 0,
      })}
    >
      <View style={{ backgroundColor: 'rgba(8,10,20,0.88)', borderRadius: 16, overflow: 'hidden' }}>

        {selected && (
          <LinearGradient
            colors={[`${color}55`, `${color}22`, `${color}08`]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}

        {selected && (
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.0)']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%' }}
          />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          <View style={{
            width: 72,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 20,
            backgroundColor: selected ? `${color}30` : 'rgba(255,255,255,0.04)',
            borderRightWidth: 1,
            borderRightColor: selected ? `${color}40` : 'rgba(255,255,255,0.07)',
          }}>
            <Ionicons
              name={icon}
              size={iconSize}
              color={selected ? color : 'rgba(255,255,255,0.35)'}
            />
          </View>

          <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 16 }}>
            <Text style={{
              fontSize: 17, fontWeight: '900',
              color: selected ? '#fff' : 'rgba(255,255,255,0.80)',
              letterSpacing: -0.3, marginBottom: 3,
            }}>
              {title}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13, fontWeight: '600',
                color: selected ? `${color}DD` : 'rgba(255,255,255,0.35)',
              }}
            >
              {subtitle}
            </Text>
          </View>

          <View style={{ justifyContent: 'center', paddingRight: 18 }}>
            <View style={{
              width: 24, height: 24, borderRadius: 12,
              backgroundColor: selected ? color : 'transparent',
              borderWidth: selected ? 0 : 1.5,
              borderColor: 'rgba(255,255,255,0.22)',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: selected ? color : 'transparent',
              shadowOpacity: 0.7,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}>
              {selected && <Ionicons name="checkmark" size={14} color="#07090f" />}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
