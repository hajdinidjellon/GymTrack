import React, { useState, useRef } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hud, hudType } from '@/constants/theme';
import { playSfx } from '@/lib/sfx';

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  unit?: string;
  compact?: boolean;
}

export function Stepper({
  value, onChange, min = 0, max = 999, step = 1, label, unit, compact = false,
}: StepperProps) {
  const clamp = (v: number) => Math.min(Math.max(v, min), max);
  const nudge = (delta: number) => {
    const next = clamp(value + delta);
    if (next !== value) {
      Haptics.selectionAsync().catch(() => null);
      playSfx('type', 0.5);
    }
    onChange(next);
  };
  const dec = () => nudge(-step);
  const inc = () => nudge(step);

  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState('');
  const inputRef              = useRef<TextInput>(null);

  const display = Number.isInteger(value) ? String(value) : value.toFixed(1);

  const handleFocus = () => {
    setRaw(display);
    setEditing(true);
    // petit délai pour laisser le rendu avant de sélectionner tout
    setTimeout(() => inputRef.current?.setNativeProps?.({ selection: { start: 0, end: display.length } }), 50);
  };

  const handleBlur = () => {
    setEditing(false);
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    }
  };

  const handleChange = (text: string) => {
    // Autorise chiffres, virgule et point uniquement
    setRaw(text.replace(/[^0-9.,]/g, ''));
  };

  const handleSubmit = () => {
    inputRef.current?.blur();
  };

  return (
    <View style={{ flex: 1, gap: 8, alignItems: 'center' }}>
      <Text style={hudType.labelHud}>
        {label}
      </Text>

      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: compact ? 6 : 10,
        backgroundColor: hud.bg.surfaceDeep,
        borderRadius: 12, borderWidth: 1,
        borderColor: editing ? hud.cyan.primary : hud.border.subtle,
        padding: compact ? 8 : 12, width: '100%', justifyContent: 'space-between',
      }}>
        {/* Bouton − */}
        <Pressable
          onPress={dec}
          style={({ pressed }) => ({
            width: compact ? 30 : 38, height: compact ? 30 : 38, borderRadius: 10,
            backgroundColor: pressed ? hud.bg.surfaceElev : hud.bg.surface,
            borderWidth: 1, borderColor: hud.border.neutral,
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Text style={{
            fontSize: compact ? 18 : 22, color: hud.text.secondary,
            fontFamily: 'Rajdhani-Bold', lineHeight: compact ? 22 : 26,
          }}>−</Text>
        </Pressable>

        {/* Valeur — tap pour éditer */}
        <Pressable onPress={() => { setRaw(display); setEditing(true); inputRef.current?.focus(); }} style={{ alignItems: 'center', flex: 1 }}>
          {editing ? (
            <TextInput
              ref={inputRef}
              style={{
                fontSize: compact ? 22 : 30, fontFamily: 'Rajdhani-Bold',
                color: hud.cyan.primary, textAlign: 'center', minWidth: 40,
                fontVariant: ['tabular-nums'],
              }}
              value={raw}
              onChangeText={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onSubmitEditing={handleSubmit}
              keyboardType="decimal-pad"
              selectTextOnFocus
              autoFocus
            />
          ) : (
            <Text style={{
              fontSize: compact ? 22 : 30, fontFamily: 'Rajdhani-Bold',
              color: hud.text.primary, fontVariant: ['tabular-nums'],
            }}>
              {display}
            </Text>
          )}
          <Text style={{
            fontSize: 11, fontFamily: 'Rajdhani-SemiBold', letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: unit ? (editing ? hud.cyan.bright : hud.text.muted) : 'transparent',
            marginTop: -2,
          }}>
            {unit ?? ' '}
          </Text>
        </Pressable>

        {/* Bouton + */}
        <Pressable
          onPress={inc}
          style={({ pressed }) => ({
            width: compact ? 30 : 38, height: compact ? 30 : 38, borderRadius: 10,
            backgroundColor: pressed ? hud.glow.cyan : hud.glow.cyanSoft,
            borderWidth: 1, borderColor: hud.border.subtle,
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Text style={{
            fontSize: compact ? 18 : 22, color: hud.cyan.primary,
            fontFamily: 'Rajdhani-Bold', lineHeight: compact ? 22 : 26,
          }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
