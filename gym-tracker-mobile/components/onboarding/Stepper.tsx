import React, { useState, useRef } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hud, hudType } from '@/constants/theme';

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
    Haptics.selectionAsync().catch(() => null);
    onChange(clamp(value + delta));
  };

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
        borderRadius: 4, borderWidth: 1,
        borderColor: editing ? hud.cyan.primary : hud.border.hairline,
        padding: compact ? 8 : 12, width: '100%', justifyContent: 'space-between',
      }}>
        {/* Bouton − */}
        <Pressable
          onPress={() => nudge(-step)}
          style={({ pressed }) => ({
            width: compact ? 30 : 38, height: compact ? 30 : 38, borderRadius: 4,
            backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
            borderWidth: 1, borderColor: hud.border.hairline,
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Text style={{
            fontFamily: 'Rajdhani-Bold', fontSize: compact ? 18 : 22,
            color: hud.text.secondary, lineHeight: compact ? 22 : 26,
          }}>−</Text>
        </Pressable>

        {/* Valeur — tap pour éditer */}
        <Pressable onPress={() => { setRaw(display); setEditing(true); inputRef.current?.focus(); }} style={{ alignItems: 'center', flex: 1 }}>
          {editing ? (
            <TextInput
              ref={inputRef}
              style={{
                fontFamily: 'Rajdhani-Bold',
                fontSize: compact ? 22 : 30,
                fontVariant: ['tabular-nums'],
                color: hud.cyan.bright,
                textAlign: 'center', minWidth: 40,
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
              fontFamily: 'Rajdhani-Bold',
              fontSize: compact ? 22 : 30,
              fontVariant: ['tabular-nums'],
              color: hud.text.primary,
            }}>
              {display}
            </Text>
          )}
          <Text style={[hudType.labelHud, {
            fontSize: 10,
            color: unit ? (editing ? hud.cyan.bright : hud.text.muted) : 'transparent',
            marginTop: -2,
          }]}>
            {unit ?? ' '}
          </Text>
        </Pressable>

        {/* Bouton + */}
        <Pressable
          onPress={() => nudge(step)}
          style={({ pressed }) => ({
            width: compact ? 30 : 38, height: compact ? 30 : 38, borderRadius: 4,
            backgroundColor: pressed ? 'rgba(29,196,255,0.25)' : 'rgba(29,196,255,0.10)',
            borderWidth: 1, borderColor: hud.border.subtle,
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Text style={{
            fontFamily: 'Rajdhani-Bold', fontSize: compact ? 18 : 22,
            color: hud.cyan.bright, lineHeight: compact ? 22 : 26,
          }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
