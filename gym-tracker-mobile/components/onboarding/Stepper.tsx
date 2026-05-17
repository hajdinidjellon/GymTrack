import React, { useState, useRef } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  unit?: string;
}

export function Stepper({
  value, onChange, min = 0, max = 999, step = 1, label, unit,
}: StepperProps) {
  const clamp = (v: number) => Math.min(Math.max(v, min), max);
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));

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
      <Text style={{
        fontSize: 11, fontWeight: '700', letterSpacing: 1.4,
        color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase',
      }}>
        {label}
      </Text>

      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16, borderWidth: 1,
        borderColor: editing ? '#38bdf8' : 'rgba(255,255,255,0.10)',
        padding: 12, width: '100%', justifyContent: 'space-between',
      }}>
        {/* Bouton − */}
        <Pressable
          onPress={dec}
          style={({ pressed }) => ({
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Text style={{ fontSize: 22, color: 'rgba(255,255,255,0.85)', fontWeight: '700', lineHeight: 26 }}>−</Text>
        </Pressable>

        {/* Valeur — tap pour éditer */}
        <Pressable onPress={() => { setRaw(display); setEditing(true); inputRef.current?.focus(); }} style={{ alignItems: 'center', flex: 1 }}>
          {editing ? (
            <TextInput
              ref={inputRef}
              style={{ fontSize: 30, fontWeight: '900', color: '#38bdf8', letterSpacing: -1, textAlign: 'center', minWidth: 60 }}
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
            <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>
              {display}
            </Text>
          )}
          <Text style={{ fontSize: 11, fontWeight: '700', color: unit ? (editing ? 'rgba(56,189,248,0.70)' : 'rgba(255,255,255,0.40)') : 'transparent', letterSpacing: 1.2, marginTop: -2 }}>
            {unit ?? ' '}
          </Text>
        </Pressable>

        {/* Bouton + */}
        <Pressable
          onPress={inc}
          style={({ pressed }) => ({
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: pressed ? 'rgba(56,189,248,0.25)' : 'rgba(56,189,248,0.12)',
            borderWidth: 1, borderColor: 'rgba(56,189,248,0.30)',
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Text style={{ fontSize: 22, color: '#38bdf8', fontWeight: '700', lineHeight: 26 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
